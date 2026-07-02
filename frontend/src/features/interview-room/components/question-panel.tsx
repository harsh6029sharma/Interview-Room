"use client";

interface ExampleTestCase {
  input: unknown;
  expected: unknown;
}

interface QuestionPanelProps {
  title: string;
  description: string;
  functionName: string;
  difficulty: string;
  exampleTestCases: ExampleTestCase[];
}

const difficultyColor: Record<string, string> = {
  EASY: "text-green-400",
  MEDIUM: "text-yellow-400",
  HARD: "text-red-400",
};

export function QuestionPanel({
  title,
  description,
  functionName,
  difficulty,
  exampleTestCases,
}: QuestionPanelProps) {
  return (
    <div className="border-b p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base text-foreground">{title}</h2>
        <span className={`text-xs font-medium ${difficultyColor[difficulty] ?? ""}`}>
          {difficulty}
        </span>
      </div>

      <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
        {description}
      </p>

      <p className="text-xs text-gray-400">
        Function signature: <code className="text-gray-200">{functionName}</code>
      </p>

      {exampleTestCases.length > 0 && (
        <div className="space-y-2 pt-1">
          {exampleTestCases.map((tc, idx) => (
            <div key={idx} className="rounded-md bg-muted/40 p-2 text-xs font-mono">
              <p className="text-gray-300">
                <span className="text-gray-400">Input:</span> {JSON.stringify(tc.input)}
              </p>
              <p className="text-gray-300">
                <span className="text-gray-400">Output:</span> {JSON.stringify(tc.expected)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}