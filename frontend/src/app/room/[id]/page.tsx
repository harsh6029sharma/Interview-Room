"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSocket } from "@/hooks/use-socket";
import { useElapsedTime } from "@/hooks/use-elapsed-time";
import { CodeEditor } from "@/features/editor/components/code-editor";
import { QuestionPanel } from "@/features/interview-room/components/question-panel";

interface RoomInterviewQuestion {
  id: string;
  questionTitle: string;
  questionDescription: string;
  functionName: string;
  difficulty: string;
  exampleTestCases: { input: unknown; expected: unknown }[];
}

interface RoomInit {
  interviewId: string;
  title: string;
  status: string;
  interviewQuestions: RoomInterviewQuestion[];
}

export default function RoomPage() {
  const params = useParams<{ id: string }>();
  const [roomToken, setRoomToken] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<RoomInit | null>(null);
  const joinedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("roomToken");
    setRoomToken(token);
  }, []);

  const { socket, connected } = useSocket({ roomToken });

  useEffect(() => {
    if (!socket) return;

    socket.on("room:init", (data) => {
      setRoomData(data);
      if (!joinedAtRef.current) {
        joinedAtRef.current = Date.now();
      }
    });

    return () => {
      socket.off("room:init");
    };
  }, [socket]);

  const elapsedTime = useElapsedTime(joinedAtRef.current);

  if (!roomToken) {
    return (
      <p className="p-6">No room access. Please join from the dashboard.</p>
    );
  }

  const activeQuestion = roomData?.interviewQuestions?.[0];

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <span className="font-medium">
          {roomData?.title ?? "Interview Room"}
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm font-mono text-gray-300">{elapsedTime}</span>
          <span className="text-sm text-gray-300">
            Status: {connected ? "connected" : "connecting"}
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col border-r overflow-hidden">
          {activeQuestion ? (
            <>
              <QuestionPanel
                title={activeQuestion.questionTitle}
                description={activeQuestion.questionDescription}
                functionName={activeQuestion.functionName}
                difficulty={activeQuestion.difficulty}
                exampleTestCases={activeQuestion.exampleTestCases}
              />
              <div className="flex-1">
                <CodeEditor
                  socket={socket}
                  interviewQuestionId={activeQuestion.id}
                />
              </div>
            </>
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
