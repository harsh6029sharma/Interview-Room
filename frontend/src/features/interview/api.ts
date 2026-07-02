import { axiosInstance } from "@/lib/axios";
import type { CreateInterviewOutput } from "./schema";
import { Interview } from "./types";

export const getInterviews = async () => {
  const response = await axiosInstance.get("/interviews");
  return response.data;
};

export async function createInterview(payload: CreateInterviewOutput): Promise<Interview> {
  const res = await axiosInstance.post("/interviews", payload);
  return res.data.data;
}

export async function getInterviewById(id: string): Promise<Interview> {
  const res = await axiosInstance.get(`/interviews/${id}`);
  return res.data.data;
}

export async function joinAsInterviewer(id: string): Promise<{ roomToken: string }> {
  const res = await axiosInstance.post(`/interviews/${id}/join/interviewer`);
  return res.data.data;
}

export async function joinAsCandidate(id: string): Promise<{ roomToken: string }> {
  const res = await axiosInstance.post(`/interviews/${id}/join/candidate`);
  return res.data.data;
}
