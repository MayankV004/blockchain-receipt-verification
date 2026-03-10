import { useEffect, useRef, useState, useCallback } from "react";

interface WSOptions {
  maxMessages?: number;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
}

export function useWebSocket(url: string, opts: WSOptions = {}) {
  const { maxMessages = 50, reconnectDelay = 2000, maxReconnectDelay = 30000 } = opts;
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const ws = useRef<WebSocket | null>(null);
  const delay = useRef(reconnectDelay);
  const unmounted = useRef(false);

  const connect = useCallback(() => {
    if (unmounted.current) return;

    try {
      ws.current = new WebSocket(url);
    } catch {
      return;
    }

    ws.current.onopen = () => {
      if (unmounted.current) return;
      setConnected(true);
      setReconnectCount(0);
      delay.current = reconnectDelay;
    };

    ws.current.onclose = () => {
      if (unmounted.current) return;
      setConnected(false);
      setReconnectCount((c) => c + 1);
      // Exponential backoff with jitter
      const jitter = Math.random() * 1000;
      const nextDelay = Math.min(delay.current * 1.5 + jitter, maxReconnectDelay);
      delay.current = nextDelay;
      setTimeout(connect, nextDelay);
    };

    ws.current.onerror = () => {
      ws.current?.close();
    };

    ws.current.onmessage = (e) => {
      if (unmounted.current) return;
      try {
        const data = JSON.parse(e.data);
        setMessages((prev) => [data, ...prev].slice(0, maxMessages));
      } catch {
        // skip malformed messages
      }
    };
  }, [url, maxMessages, reconnectDelay, maxReconnectDelay]);

  useEffect(() => {
    unmounted.current = false;
    connect();
    return () => {
      unmounted.current = true;
      ws.current?.close();
    };
  }, [connect]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, connected, reconnectCount, clearMessages };
}
