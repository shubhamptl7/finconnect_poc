import { useState, useEffect, useCallback, useRef } from 'react';


export function useNotifications(isAuthenticated, API_URL, addToast) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  const fetchInitialNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/notifications`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.notifications.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('Failed to fetch initial notifications', err);
    }
  }, [API_URL]);

  const connectWebSocket = useCallback(() => {
    if (ws.current) return;

    // Construct WebSocket URL handling relative or absolute API_URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = API_URL.startsWith('http')
      ? API_URL.replace(/^http/, 'ws') + '/notifications/ws'
      : `${protocol}//${host}${API_URL}/notifications/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected');
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'NEW_NOTIFICATION') {
          const newNotif = message.data;
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show a toast when a real-time notification arrives
          addToast({
            title: newNotif.title,
            message: newNotif.content,
            type: 'info'
          });
        }
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    // Heartbeat to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'PING' }));
      }
    }, 30000);

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      clearInterval(pingInterval);
      ws.current = null;
      // Auto reconnect
      if (isAuthenticated) {
        reconnectTimeout.current = setTimeout(connectWebSocket, 5000);
      }
    };

    ws.current = socket;
  }, [API_URL, isAuthenticated, addToast]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchInitialNotifications();
      connectWebSocket();
    } else {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
    }

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
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
