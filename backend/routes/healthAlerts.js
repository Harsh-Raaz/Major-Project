const router = require('express').Router();
const Parser = require('rss-parser');

const DISEASE_KEYWORDS = ['dengue', 'malaria', 'chikungunya', 'typhoid', 'influenza', 'flu', 'viral fever', 'cholera', 'leptospirosis', 'H1N1', 'fever', 'outbreak', 'infection', 'cases'];
const LOCAL_PLACES = ['bengaluru', 'bangalore', 'karnataka', 'bbmp'];
const LOCAL_OUTLETS = ['Bangalore Mirror', 'Deccan Herald', 'The Hindu', 'Times of India', 'Star of Mysore', 'Udayavani', 'Prajavani', 'Vijay Karnataka', 'News18 Kannada', 'The New Indian Express'];
const OTHER_PLACES = ['West Bengal', 'Bengal', 'Kolkata', 'Delhi', 'Mumbai', 'Kerala', 'Tamil Nadu', 'Chennai', 'Hyderabad', 'Pune', 'Odisha', 'Bihar', 'Uttar Pradesh', 'Gujarat', 'Rajasthan', 'Punjab', 'Assam', 'Maharashtra', 'Ahmedabad'];
const wordPattern = (words) => new RegExp(`\\b(${words.map((word) => word.replace(/ /g, '\\s+')).join('|')})\\b`, 'i');
const diseasePattern = wordPattern(DISEASE_KEYWORDS);
const localPattern = wordPattern(LOCAL_PLACES);
const explicitLocalPattern = wordPattern(LOCAL_PLACES.filter((place) => place !== 'bbmp'));
const outletPattern = wordPattern(LOCAL_OUTLETS);
const otherPlacePattern = wordPattern(OTHER_PLACES);

const parser = new Parser({ timeout: 8000, customFields: { item: ['source'] } });
const query = '(Bengaluru OR Bangalore) (dengue OR malaria OR chikungunya OR typhoid OR influenza OR "viral fever" OR cholera OR leptospirosis OR "H1N1") when:30d';
const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
const CACHE_MS = 30 * 60 * 1000;
// This process-local cache starts empty on every server start.
let cache = null;
let pending = null;

function normalizeItems(items) {
  const news = [];
  for (const item of items) {
    const rawTitle = String(item.title || '').trim();
    const suffixIndex = rawTitle.lastIndexOf(' - ');
    const title = (suffixIndex > 0 ? rawTitle.slice(0, suffixIndex) : rawTitle).trim();
    const suffix = suffixIndex > 0 ? rawTitle.slice(suffixIndex + 3).trim() : null;
    const itemSource = typeof item.source === 'string' ? item.source : item.source?._;
    const source = itemSource?.trim() || suffix || null;
    const diseaseMatch = title.match(diseasePattern);
    if (!title || !diseaseMatch) continue;
    if (!localPattern.test(title) && !outletPattern.test(source || '')) continue;
    if (otherPlacePattern.test(title) && !explicitLocalPattern.test(title)) continue;

    const date = new Date(item.isoDate || item.pubDate);
    if (!Number.isFinite(date.getTime())) continue;
    let link;
    try {
      link = new URL(item.link);
      if (!['https:', 'http:'].includes(link.protocol)) continue;
    } catch {
      continue;
    }
    const matched = diseaseMatch?.[1].toLowerCase().replace(/\s+/g, ' ');
    news.push({
      title, source, link: link.href,
      published_at: date.toISOString(), disease: matched === 'h1n1' ? 'H1N1' : matched || null
    });
  }
  news.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  const seen = new Set();
  return news.filter(({ title }) => {
    const normalized = title.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  }).slice(0, 12);
}

router.get('/news', async (req, res) => {
  if (cache && Date.now() - cache.savedAt < CACHE_MS) {
    return res.json({ status: 'cached', fetched_at: cache.fetched_at, items: cache.items });
  }
  // Share a refresh across simultaneous public requests.
  if (!pending) {
    pending = parser.parseURL(feedUrl).then((feed) => {
      // Cache only headline metadata. Article pages and bodies are never fetched or stored.
      cache = { savedAt: Date.now(), fetched_at: new Date().toISOString(), items: normalizeItems(feed.items || []) };
      return { status: 'ok', fetched_at: cache.fetched_at, items: cache.items };
    }).catch((error) => {
      console.error('Health news feed unavailable:', error.message);
      return cache
        ? { status: 'cached', fetched_at: cache.fetched_at, items: cache.items }
        : { status: 'unavailable', fetched_at: null, items: [] };
    }).finally(() => { pending = null; });
  }
  res.json(await pending);
});

module.exports = router;
