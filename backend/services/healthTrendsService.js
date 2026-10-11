const Appointment = require('../models/Appointment');
const SymptomLog = require('../models/SymptomLog');
const { detectHealthTrend } = require('./aiService');
const { getLocalDateString } = require('../utils/date');

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_MS = 5 * 60 * 1000;
const caches = new Map();
const inFlight = new Map();
let generation = 0;
let lastRecomputed = 0;
let timer = null;
let socketServer = null;
let lastSignature = null;

function kolkataTimestamp(date) {
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).format(date);
  return `${getLocalDateString(date, 'Asia/Kolkata')}T${time}+05:30`;
}

function getTrendWindow(now = new Date()) {
  const start = new Date(now.getTime() - 9 * WEEK_MS);
  return {
    start, end: now,
    month: Number(getLocalDateString(now, 'Asia/Kolkata').slice(5, 7)),
    window: {
      current_start: kolkataTimestamp(new Date(now.getTime() - WEEK_MS)),
      current_end: kolkataTimestamp(now), timezone: 'Asia/Kolkata'
    }
  };
}

function alertSignature(result) {
  return JSON.stringify((result.alerts || []).map(({ type, name, tier }) => `${type}:${name}:${tier}`).sort());
}

async function aggregateTrends(includeDemo) {
  const { start, end, month, window } = getTrendWindow();
  const match = { createdAt: { $gte: start, $lt: end },
    is_demo: includeDemo ? { $in: [true, false, null] } : { $ne: true } };
  const bucket = { $floor: { $divide: [{ $subtract: ['$createdAt', start] }, WEEK_MS] } };
  const [departments, keywords] = await Promise.all([
    Appointment.aggregate([
      { $match: { ...match, status: { $ne: 'cancelled' }, department: { $type: 'string', $ne: '' } } },
      { $group: { _id: { name: '$department', week: bucket }, count: { $sum: 1 },
        demo_count: { $sum: { $cond: ['$is_demo', 1, 0] } } } }
    ]),
    SymptomLog.aggregate([
      { $match: match }, { $unwind: '$keywords' },
      { $group: { _id: { name: '$keywords', week: bucket }, count: { $sum: 1 },
        demo_count: { $sum: { $cond: ['$is_demo', 1, 0] } } } },
      { $group: { _id: '$_id.name', total: { $sum: '$count' }, demo_count: { $sum: '$demo_count' },
        weeks: { $push: { week: '$_id.week', count: '$count' } } } },
      { $match: { total: { $gte: 3 } } }
    ])
  ]);
  const series = { departments: Object.create(null), keywords: Object.create(null) };
  for (const { _id, count } of departments) {
    if (!series.departments[_id.name]) series.departments[_id.name] = Array(9).fill(0);
    series.departments[_id.name][_id.week] = count;
  }
  for (const { _id: name, weeks } of keywords) {
    series.keywords[name] = Array(9).fill(0);
    for (const { week, count } of weeks) series.keywords[name][week] = count;
  }
  const detected = await detectHealthTrend(series, month);
  return {
    ...(detected || { generated_at: new Date().toISOString(), alerts: [], baseline_status: 'unavailable' }),
    window,
    includes_demo: departments.some((row) => row.demo_count > 0) || keywords.some((row) => row.demo_count > 0)
  };
}

async function getHealthTrends({ includeDemo = true } = {}) {
  const key = String(includeDemo);
  const cached = caches.get(key);
  if (cached && cached.expires > Date.now()) return cached.result;
  const version = generation;
  const existing = inFlight.get(key);
  if (existing?.version === version) return existing.task;
  const task = aggregateTrends(includeDemo).then((result) => {
    if (version === generation) caches.set(key, { result, expires: Date.now() + CACHE_MS });
    if (includeDemo && lastSignature === null) lastSignature = alertSignature(result);
    return result;
  });
  inFlight.set(key, { task, version });
  try {
    return await task;
  } finally {
    if (inFlight.get(key)?.task === task) inFlight.delete(key);
  }
}

function invalidateHealthTrends(io) {
  generation += 1;
  caches.clear();
  if (io) socketServer = io;
  if (!socketServer || timer) return;
  timer = setTimeout(() => {
    timer = null;
    lastRecomputed = Date.now();
    const previous = lastSignature;
    getHealthTrends().then((result) => {
      // A temporary Flask failure must not announce that real alerts disappeared.
      if (result.baseline_status === 'unavailable') return;
      const signature = alertSignature(result);
      if (signature !== (previous ?? '[]')) socketServer.emit('health_alerts_updated', result);
      lastSignature = signature;
    }).catch((error) => console.error('Health trend refresh failed:', error.message));
  }, Math.max(0, 60000 - (Date.now() - lastRecomputed)));
  timer.unref();
}

module.exports = { getHealthTrends, invalidateHealthTrends, getTrendWindow };
