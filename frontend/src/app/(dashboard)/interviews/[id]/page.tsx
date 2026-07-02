"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  getInterviewById,
  joinAsInterviewer,
  joinAsCandidate,
  getQuestions,
  attachQuestion,
} from "@/features/interview/api";
import type { Interview } from "@/features/interview/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function InterviewDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [questions, setQuestions] = useState<{ id: string; title: string; difficulty: string }[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [attaching, setAttaching] = useState(false);

  useEffect(() => {
    getInterviewById(params.id)
      .then(setInterview)
      .catch(() => toast.error("Failed to load interview"))
      .finally(() => setLoading(false));

    getQuestions().then(setQuestions);
  }, [params.id]);

  async function handleAttach() {
    if (!selectedQuestionId) return;
    setAttaching(true);
    try {
      await attachQuestion(params.id, selectedQuestionId);
      const updated = await getInterviewById(params.id);
      setInterview(updated);
      toast.success("Question added");
    } catch (err) {
      toast.error("Failed to add question");
    } finally {
      setAttaching(false);
    }
  }

  async function handleJoin(role: "interviewer" | "candidate") {
    setJoining(true);
    try {
      const { roomToken } = role === "interviewer"
        ? await joinAsInterviewer(params.id)
        : await joinAsCandidate(params.id);

      sessionStorage.setItem("roomToken", roomToken);
      router.push(`/room/${params.id}`);
    } catch (err) {
      toast.error("Failed to join interview");
    } finally {
      setJoining(false);
    }
  }

  if (loading) return <p className="p-6">Loading...</p>;
  if (!interview) return <p className="p-6">Interview not found.</p>;

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold mb-2">{interview.title}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {interview.status} — {new Date(interview.scheduledAt).toLocaleString()}
      </p>

      <div className="mb-6 space-y-2">
        <p className="text-sm font-medium">Questions</p>
        {interview.interviewQuestions.length === 0 && (
          <p className="text-sm text-gray-500">No question added yet.</p>
        )}
        {interview.interviewQuestions.map((iq) => (
          <p key={iq.id} className="text-sm text-gray-500">{iq.question.title}</p>
        ))}

        <div className="flex gap-2 pt-2">
          <Select value={selectedQuestionId} onValueChange={setSelectedQuestionId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a question" />
            </SelectTrigger>
            <SelectContent>
              {questions.map((q) => (
                <SelectItem key={q.id} value={q.id}>
                  {q.title} ({q.difficulty})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAttach} disabled={!selectedQuestionId || attaching}>
            Add
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={() => handleJoin("interviewer")} disabled={joining}>
          Join as Interviewer
        </Button>
        <Button variant="outline" onClick={() => handleJoin("candidate")} disabled={joining}>
          Join as Candidate
        </Button>
      </div>
    </div>
  );
}