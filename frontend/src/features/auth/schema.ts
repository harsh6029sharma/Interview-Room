import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("enter a valid email"),
  password: z.string().min(6, "password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "name is too short"),
  email: z.email("enter a valid email"),
  password: z.string().min(6, "password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
