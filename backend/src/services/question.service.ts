import { prisma } from "../lib/prisma";

export async function getAllQuestions() {
  return prisma.question.findMany({
    select: { id: true, title: true, difficulty: true },
    orderBy: { createdAt: "asc" },
  });
}