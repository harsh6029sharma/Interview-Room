import * as z from 'zod'

export const createInterviewSchema = z.object({
    title:z.string().min(1,"title is required"),
    scheduledAt: z.coerce.date()
})

export const joinCandidateSchema = z.object({
    candidateName:z.string().min(1,"candidateName is required"),
    candidateEmail:z.email("invalid email format").optional()
})

export type CreateInterviewBody = z.infer<typeof createInterviewSchema>;
export type JoinCandidateBody = z.infer<typeof joinCandidateSchema>;