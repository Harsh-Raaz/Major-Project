import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from '../api/axios';
import { getHealthTrends } from '../api/healthTrends';

const SOCKET_URL = api.defaults.baseURL.replace(/\/api\/?$/, '');

export function useHealthTrends() {
  const [trends, setTrends] = useState(null);
  useEffect(() => {
    let active = true;
    let revision = 0;
    const refresh = () => {
      const current = ++revision;
      getHealthTrends().then(({ data }) => {
        if (active && current === revision) setTrends(data);
      }).catch(() => {
        if (active && current === revision) setTrends({ alerts: [], baseline_status: 'unavailable' });
      });
    };
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    const update = (result) => {
      revision += 1;
      if (active) setTrends(result);
    };
    refresh();
    socket.on('connect', refresh);
    socket.on('health_alerts_updated', update);
    return () => {
      active = false;
      socket.off('connect', refresh);
      socket.off('health_alerts_updated', update);
      socket.disconnect();
    };
  }, []);
  return trends;
}
