import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_BASE, API_BASE } from '../utils/constants';

export function useSentinelSocket({ onNewAlert, onTelemetryUpdate }) {
  const [isConnected, setIsConnected] = useState(false);
  const [latencyMs, setLatencyMs] = useState(0);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const lastPingTimeRef = useRef(0);

  const connect = useCallback(() => {
    try {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        return;
      }

      const ws = new WebSocket(WS_BASE);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log("SENTINEL AI WebSocket link established.");

        // Start heartbeat ping
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            lastPingTimeRef.current = performance.now();
            ws.send(JSON.stringify({ type: 'HEARTBEAT' }));
          }
        }, 8000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'PONG') {
            setLatencyMs(Math.round(performance.now() - lastPingTimeRef.current));
          } else if (msg.type === 'TELEMETRY_UPDATE') {
            if (onTelemetryUpdate) {
              onTelemetryUpdate(msg.data);
            }
          } else if (msg.type === 'NEW_ALERT') {
            if (onNewAlert) {
              onNewAlert(msg.data);
            }
          }
        } catch (e) {
          console.error("WS Parse error:", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        // Exponential reconnect attempt
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.warn("WS error:", err);
        ws.close();
      };
    } catch (e) {
      console.error("WS initialization failed:", e);
      setIsConnected(false);
    }
  }, [onNewAlert, onTelemetryUpdate]);

  const sendPacket = useCallback((imageB64, audioB64) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'STREAM_PACKET',
        image: imageB64 || '',
        audio: audioB64 || ''
      }));
    }
  }, []);

  const simulateNetworkDrop = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [connect]);

  return {
    isConnected,
    latencyMs,
    sendPacket,
    simulateNetworkDrop,
    reconnect: connect
  };
}
