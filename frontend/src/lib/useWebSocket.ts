import { useEffect, useRef, useState } from "react";
import { getSession } from "@/lib/auth-client";

export function useWebSocket(url: string, maxMessages = 50) {
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = async () => {
      const sessionRes = await getSession();
      const data = sessionRes?.data as any; // Ignore strict typing error on getSession nested data
      const token = data?.session?.token;
      if (!token) return;

      // Pass token as query param (WebSocket can't set headers)
      ws.current = new WebSocket(`${url}?token=${token}`);
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
