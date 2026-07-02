"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { getInterviewById, joinAsInterviewer, joinAsCandidate } from "@/features/interview/api";
import type { Interview } from "@/features/interview/types";
import { Button } from "@/components/ui/button";

export default function InterviewDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    getInterviewById(params.id)
      .then(setInterview)
      .catch(() => toast.error("Failed to load interview"))
      .finally(() => setLoading(false));
  }, [params.id]);

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