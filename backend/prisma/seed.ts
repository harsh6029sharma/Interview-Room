import { prisma } from "../src/lib/prisma"


const questions = [
  {
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    difficulty: "EASY" as const,
    functionName: "twoSum",
    starterCode: {
      javascript: "function twoSum(nums, target) {\n  // your code here\n}",
    },
    testCases: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2] },
    ],
  },
  {
    title: "Valid Parentheses",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    difficulty: "EASY" as const,
    functionName: "isValid",
    starterCode: {
      javascript: "function isValid(s) {\n  // your code here\n}",
    },
    testCases: [
      { input: ["()"], expected: true },
      { input: ["()[]{}"], expected: true },
      { input: ["(]"], expected: false },
    ],
  },
  {
    title: "Reverse Linked List",
    description: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    difficulty: "MEDIUM" as const,
    functionName: "reverseList",
    starterCode: {
      javascript: "function reverseList(head) {\n  // your code here\n}",
    },
    testCases: [
      { input: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1] },
    ],
  },
];

async function main() {
  for (const q of questions) {
    await prisma.question.upsert({
      where: { title: q.title },
      update: {},
      create: q,
    });
  }

  console.log("Seeded questions");
} 

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());