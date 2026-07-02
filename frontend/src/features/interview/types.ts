export interface Question {
  id: string;
  title: string;
  description: string;
  starterCode: Record<string, string>;
  difficulty?: string;
}

export interface InterviewQuestion {
  id: string;
  interviewId: string;
  questionId: string;
  question: Question;
}

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
  interviewQuestions: InterviewQuestion[];
}