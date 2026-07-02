import axios from "axios";

interface SubmitCodeInput {
  interviewId: string;
  interviewQuestionId: string;
  code: string;
  language: string;
  roomToken: string;
}

export async function submitCode({
  interviewId,
  interviewQuestionId,
  code,
  language,
  roomToken,
}: SubmitCodeInput): Promise<{ submissionId: string; status: string }> {
  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/interviews/${interviewId}/questions/${interviewQuestionId}/submit`,
    { code, language },
    { headers: { Authorization: `Bearer ${roomToken}` } }
  );
  return res.data.data;
}