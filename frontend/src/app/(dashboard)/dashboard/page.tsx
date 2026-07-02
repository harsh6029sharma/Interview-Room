"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { getInterviews } from "@/features/interview/api";
import type { Interview } from "@/features/interview/types";
import { useAuthStore } from "@/stores/auth-store";
import { CreateInterviewDialog } from "@/features/interview/components/create-interview-dialog";

export default function DashboardPage() {
  const router = useRouter();
  const authToken = useAuthStore((state) => state.authToken);

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  function handleCreated(interview: Interview) {
    setInterviews((prev) => [interview, ...prev]);
  }

  useEffect(() => {
    if (!authToken) {
      router.push("/login");
      return;
    }

    getInterviews()
      .then((res) => setInterviews(res.data))
      .finally(() => setLoading(false));
  }, [authToken, router]);

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Your Interviews</h1>
        <CreateInterviewDialog onCreated={handleCreated} />
      </div>

      {interviews.length === 0 && <p>No interviews yet.</p>}

      <div className="space-y-3">
        {interviews.map((interview) => (
          <Link key={interview.id} href={`/interviews/${interview.id}`}>
            <div className="rounded-lg border p-4 hover:bg-accent cursor-pointer">
              <h2 className="font-medium">{interview.title}</h2>
              <p className="text-sm text-gray-500">
                {interview.status} — {new Date(interview.scheduledAt).toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}