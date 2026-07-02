import { z } from "zod";

export const createInterviewSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  scheduledAt: z
    .string()
    .min(1, "Scheduled time is required")
    .transform((val) => new Date(val).toISOString()),
});

export type CreateInterviewInput = z.input<typeof createInterviewSchema>;
export type CreateInterviewOutput = z.output<typeof createInterviewSchema>;