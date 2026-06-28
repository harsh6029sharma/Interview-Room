export interface TestCase {
    input: unknown[],
    output: unknown
}

const RESULT_MARKER = "__SANDBOX_RESULT__";

export function buildJavascriptHarness(candidateCode: string, functionName: string, testCases: TestCase[]): string {

    return `
${candidateCode}

const __testCases = ${JSON.stringify(testCases)};
const __results = [];

for (const tc of __testCases) {
  try {
    const actual = ${functionName}(...tc.input);
    const pass = JSON.stringify(actual) === JSON.stringify(tc.expected);
    __results.push({ pass, actual, expected: tc.expected, input: tc.input });
  } catch (err) {
    __results.push({
      pass: false,
      error: err instanceof Error ? err.message : String(err),
      input: tc.input,
      expected: tc.expected,
    });
  }
}

console.log("${RESULT_MARKER}" + JSON.stringify(__results));
`;

}

export { RESULT_MARKER };