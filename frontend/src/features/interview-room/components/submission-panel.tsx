"use client";

import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { submitCode } from "../api";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types/socket.types";

type AppClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface TestResult {
  pass: boolean;
  input?: unknown[];
  expected?: unknown;
  actual?: unknown;
  error?: string;
}

interface SubmissionResult {
  submissionId: string;
  passCount: number;
  totalCount: number;
  testResults: TestResult[];
  executionTime: number | null;
}

interface SubmissionPanelProps {
  socket: AppClientSocket | null;
  interviewId: string;
  interviewQuestionId: string;
  code: string;
  language: string;
  roomToken: string;
}

export function SubmissionPanel({
  socket,
  interviewId,
  interviewQuestionId,
  code,
  language,
  roomToken,
}: SubmissionPanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [pendingSubmissionId, setPendingSubmissionId] = useState<string | null>(null);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("submission:result", (data) => {
      if (data.submissionId !== pendingSubmissionId) return;

      setResult(data as SubmissionResult);
      setSubmitting(false);
      setPendingSubmissionId(null);
    });

    return () => {
      socket.off("submission:result");
    };
  }, [socket, pendingSubmissionId]);

  async function handleSubmit() {
    setSubmitting(true);
    setResult(null);
    try {
      const { submissionId } = await submitCode({
        interviewId,
        interviewQuestionId,
        code,
        language,
        roomToken,
      });
      setPendingSubmissionId(submissionId);
    } catch (err) {
      toast.error("Failed to submit code");
      setSubmitting(false);
    }
  }

  return (
    <div className="border-t p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Running..." : "Submit"}
        </Button>
        {result && (
          <span className="text-sm text-gray-300">
            {result.passCount}/{result.totalCount} passed
            {result.executionTime !== null && ` — ${result.executionTime}ms`}
          </span>
        )}
      </div>

      {result && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {result.testResults.map((tc, idx) => (
            <div
              key={idx}
              className={`text-xs font-mono rounded-md p-2 ${
                tc.pass ? "bg-green-950 text-green-400" : "bg-red-950 text-red-400"
              }`}
            >
              <p>{tc.pass ? "Passed" : "Failed"} — Test {idx + 1}</p>
              {!tc.pass && (
                <>
                  <p>Input: {JSON.stringify(tc.input)}</p>
                  <p>Expected: {JSON.stringify(tc.expected)}</p>
                  <p>Got: {JSON.stringify(tc.actual)}</p>
                  {tc.error && <p>Error: {tc.error}</p>}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}