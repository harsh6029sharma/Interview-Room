"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSocket } from "@/hooks/use-socket";
import { CodeEditor } from "@/features/editor/components/code-editor";

interface RoomInit {
  interviewId: string;
  title: string;
  status: string;
  interviewQuestions: { id: string; questionTitle: string }[];
}

export default function RoomPage() {
  const params = useParams<{ id: string }>();
  const [roomToken, setRoomToken] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<RoomInit | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("roomToken");
    setRoomToken(token);
  }, []);

  const { socket, connected } = useSocket({ roomToken });

  useEffect(() => {
    if (!socket) return;

    socket.on("room:init", (data) => {
      console.log("room:init received:", data);
      setRoomData(data);
    });

    return () => {
      socket.off("room:init");
    };
  }, [socket]);

  if (!roomToken) {
    return (
      <p className="p-6">No room access. Please join from the dashboard.</p>
    );
  }

  const interviewQuestionId = roomData?.interviewQuestions?.[0]?.id;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <span className="font-medium">
          {roomData?.title ?? "Interview Room"}
        </span>
        <span className="text-sm text-gray-500">
          Status: {connected ? "connected" : "connecting"}
        </span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 border-r">
          {interviewQuestionId ? (
            <CodeEditor
              socket={socket}
              interviewQuestionId={interviewQuestionId}
            />
          ) : (
            <p className="p-4 text-sm text-gray-500">Loading question...</p>
          )}
        </div>

        <div className="flex w-96 flex-col">
          <div className="h-64 border-b p-4">
            <p className="text-sm text-gray-500">Video goes here</p>
          </div>
          <div className="flex-1 p-4">
            <p className="text-sm text-gray-500">Chat goes here</p>
          </div>
        </div>
      </div>

      <footer className="border-t p-4">
        <p className="text-sm text-gray-500">Submit panel goes here</p>
      </footer>
    </div>
  );
}