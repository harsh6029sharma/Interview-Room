export interface Interview {
  id: string;
  title: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  scheduledAt: string;
  startedAt: string | null;
  endedAt: string | null;
  candidateName: string | null;
  candidateEmail: string | null;
  interviewerId: string;
  createdAt: string;
  updatedAt: string;
}