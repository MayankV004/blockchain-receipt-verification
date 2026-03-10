import { useEffect, useRef, useState } from "react";
import { getSession } from "@/lib/auth-client";

export function useWebSocket(url: string, maxMessages = 50) {
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = async () => {
      // Cookies are automatically sent to the same domain (localhost) during WebSocket handshake
      ws.current = new WebSocket(url);
      ws.current.onopen = () => setConnected(true);
      ws.current.onclose = () => {
        setConnected(false);
        setTimeout(connect, 3000);
      };
      ws.current.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setMessages(prev => [data, ...prev].slice(0, maxMessages));
      };
    };
    connect();
    return () => ws.current?.close();
  }, [url]);

  return { messages, connected };
}
