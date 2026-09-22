import { useState, useEffect, useCallback, useRef } from 'react';
import { stripEmojis } from '@/lib/utils';


export function useNotifications(isAuthenticated, API_URL, addToast) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const isAuthRef = useRef(isAuthenticated);
  const authFailedRef = useRef(false);

  const pingIntervalRef = useRef(null);

  useEffect(() => {
    isAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const fetchInitialNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/notifications`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const cleaned = (data.data?.notifications || []).map(n => ({
          ...n,
          title: stripEmojis(n.title),
          content: stripEmojis(n.content),
        }));
        setNotifications(cleaned);
        setUnreadCount(cleaned.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('Failed to fetch initial notifications', err);
    }
  }, [API_URL]);

  const connectWebSocket = useCallback(() => {
    if (ws.current) return;
    if (!isAuthRef.current || authFailedRef.current) return;

    // Construct WebSocket URL handling relative or absolute API_URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = API_URL.startsWith('http')
      ? API_URL.replace(/^http/, 'ws') + '/notifications/ws'
      : `${protocol}//${host}${API_URL}/notifications/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      authFailedRef.current = false;
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'ERROR' && message.message === 'Authentication failed') {
          console.warn('[WebSocket] Authentication rejected by server. Halting reconnect loop.');
          authFailedRef.current = true;
          return;
        }

        if (message.type === 'NEW_NOTIFICATION') {
          const raw = message.data || {};
          const newNotif = {
            ...raw,
            title: stripEmojis(raw.title),
            content: stripEmojis(raw.content),
          };
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show a toast when a real-time notification arrives
          addToast({
            title: newNotif.title,
            message: newNotif.content,
            type: newNotif.type === 'loan' ? 'success' : 'info',
            action_url: newNotif.action_url,
          });

          window.dispatchEvent(new CustomEvent('finconnect-notification-received', { detail: newNotif }));
        } else if (message.type === 'BALANCE_UPDATED') {
          window.dispatchEvent(new CustomEvent('finconnect-balance-updated', { detail: message.data }));
        } else if (message.type === 'LOAN_APPLICATION_UPDATED') {
          window.dispatchEvent(new CustomEvent('loan-application-updated', { detail: message.data }));
        }
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    // Heartbeat to keep connection alive
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    pingIntervalRef.current = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'PING' }));
      }
    }, 30000);

    socket.onclose = (event) => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      ws.current = null;

      // Close code 4401 or 4001 indicates auth rejection — do NOT reconnect
      if (event.code === 4401 || event.code === 4001) {
        authFailedRef.current = true;
        console.warn('[WebSocket] Server closed socket due to auth failure. Reconnect aborted.');
        return;
      }

      // Auto reconnect only if still authenticated and auth didn't fail
      if (isAuthRef.current && !authFailedRef.current) {
        if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = setTimeout(connectWebSocket, 5000);
      }
    };

    ws.current = socket;
  }, [API_URL, addToast]);

  useEffect(() => {
    if (isAuthenticated) {
      authFailedRef.current = false;
      fetchInitialNotifications();
      connectWebSocket();
    } else {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
    }

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [isAuthenticated, connectWebSocket, fetchInitialNotifications]);

  const markAsRead = async (id) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
}
