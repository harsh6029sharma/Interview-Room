import { axiosInstance } from "@/lib/axios";
import type { LoginFormData, RegisterFormData } from "./schema";

export const loginUser = async (data: LoginFormData) => {
  const response = await axiosInstance.post("/auth/login", data);
  return response.data;
};

export const registerUser = async (data: RegisterFormData) => {
  const response = await axiosInstance.post("/auth/register", data);
  return response.data;
};

export const getInterviews = async () => {
  const response = await axiosInstance.get("/interviews");
  return response.data;
};