import { useState, useEffect, useMemo } from "react";
import socketIOClient from "socket.io-client";

export function useSocket({ endpoint, token }) {
  const [isConnected, setIsConnected] = useState(false);

  const socket = useMemo(() => {
    return socketIOClient(endpoint, {
      auth: { token },
      reconnection: true, // Ensure this is enabled
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }, [endpoint, token]);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      // Don't disconnect here - let socket.io handle reconnections
    };
  }, [socket]);

  return { isConnected, socket };
}