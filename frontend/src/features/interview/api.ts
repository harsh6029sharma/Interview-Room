import { axiosInstance } from "@/lib/axios";

export const getInterviews = async () => {
  const response = await axiosInstance.get("/interviews");
  return response.data;
};