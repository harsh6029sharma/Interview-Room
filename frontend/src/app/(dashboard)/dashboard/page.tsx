"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getInterviews } from "@/features/interview/api";
import type { Interview } from "@/features/interview/types";
import { useAuthStore } from "@/stores/auth-store";

export default function DashboardPage() {
  const router = useRouter();
  const authToken = useAuthStore((state) => state.authToken);

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

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
      <h1 className="text-2xl font-semibold mb-4">Your Interviews</h1>

      {interviews.length === 0 && <p>No interviews yet.</p>}

      <div className="space-y-3">
        {interviews.map((interview) => (
          <div key={interview.id} className="rounded-lg border p-4">
            <h2 className="font-medium">{interview.title}</h2>
            <p className="text-sm text-gray-500">
              {interview.status} — {new Date(interview.scheduledAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}