import { useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

export function useSlotSocket(hospital_id, date, onSlotUpdate) {
  useEffect(() => {
    if (!hospital_id || !date) return;

    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    const joinRoom = () => socket.emit('join_slot_room', { hospital_id, date });

    // Rejoin the room on every connection, including automatic reconnects.
    socket.on('connect', joinRoom);
    socket.on('slot_updated', onSlotUpdate);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('slot_updated', onSlotUpdate);
      socket.emit('leave_slot_room', { hospital_id, date });
      socket.disconnect();
    };
  }, [hospital_id, date, onSlotUpdate]);
}
