"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import type { Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types/socket.types";

type AppClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface CodeEditorProps {
  socket: AppClientSocket | null;
  interviewQuestionId: string;
  onCodeChange?: (code: string, language: string) => void;
}

export function CodeEditor({ socket, interviewQuestionId, onCodeChange }: CodeEditorProps) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const versionRef = useRef(0);
  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    if (!socket) return;

    socket.emit("code:join", { interviewQuestionId });

    socket.on("code:init", (data) => {
      isRemoteUpdate.current = true;
      setCode(data.code);
      setLanguage(data.language);
      versionRef.current = data.version;
    });

    socket.on("code:update", (data) => {
      isRemoteUpdate.current = true;
      setCode(data.code);
      versionRef.current = data.version;
    });

    return () => {
      socket.off("code:init");
      socket.off("code:update");
    };
  }, [socket, interviewQuestionId]);

  useEffect(() => {
    onCodeChange?.(code, language);
  }, [code, language, onCodeChange]);

  function handleChange(value: string | undefined) {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    const newCode = value ?? "";
    setCode(newCode);

    socket?.emit("code:change", {
      interviewQuestionId,
      code: newCode,
      language,
    });
  }

  return (
    <Editor
      height="100%"
      language={language}
      value={code}
      onChange={handleChange}
      theme="vs-dark"
      options={{ minimap: { enabled: false }, fontSize: 14 }}
    />
  );
}