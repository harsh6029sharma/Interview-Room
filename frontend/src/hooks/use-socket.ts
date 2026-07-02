import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types/socket.types";

interface UseSocketOptions {
  roomToken: string | null;
}

type AppClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket({ roomToken }: UseSocketOptions) {
  const socketRef = useRef<AppClientSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<AppClientSocket | null>(null);

  useEffect(() => {
    if (!roomToken) return;

    const newSocket: AppClientSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      auth: { token: roomToken },
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on("connect", () => setConnected(true));
    newSocket.on("disconnect", () => setConnected(false));
    newSocket.on("connect_error", (err) => {
      console.error("Socket connect_error:", err.message);
    });
    newSocket.on("error", (data) => {
      console.error("Socket error:", data.message);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [roomToken]);

  return { socket, connected };
}