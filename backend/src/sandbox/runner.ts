import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildJavascriptHarness, RESULT_MARKER, type TestCase } from "./harness";

const TIMEOUT_MS = 5000;
const LANGUAGE_IMAGES: Record<string, string> = {
    javascript: "node:20-alpine",
};

export interface SandboxResult {
    passCount: number;
    totalCount: number;
    results: Array<{ pass: boolean; input: unknown[]; expected: unknown; actual?: unknown; error?: string }>;
    executionTimeMs: number;
    timedOut: boolean;
    stderr: string;
}


export async function runInSandbox(code: string, functionName: string, testCases: TestCase[], language: string, submissionId: string): Promise<SandboxResult> {
    if (language !== "javascript") {
        throw new Error(`Unsupported language: ${language} (only javascript supported currently)`)
    }

    const image = LANGUAGE_IMAGES[language]!
    const harness = buildJavascriptHarness(code, functionName, testCases)

    const tempDir = await mkdtemp(join(tmpdir(), "sandbox-"))

    const scriptPath = join(tempDir, "script.js")

    await writeFile(scriptPath, harness)

    const containerName = `exec-${submissionId}`
    const startedAt = Date.now()

    const dockerArgs = [
        "run",
        "--rm",
        "--name", containerName,
        "--network", "none",
        "--memory=128m",
        "--cpus=0.5",
        "--pids-limit=64",
        "--read-only",
        "--tmpfs", "/tmp",
        "--user", "node",
        "-v", `${tempDir}:/sandbox:ro`,
        "-w", "/sandbox",
        image,
        "node", "script.js",
    ];

    return new Promise((resolve) => {
        const child = spawn("docker", dockerArgs)

        let stdout = ""
        let stderr = ""
        let timedOut = false

        const timer = setTimeout(() => {
            timedOut = true

            spawn("docker", ["kill", containerName])

        }, TIMEOUT_MS)

        child.stdout.on("data", (chunk) => (stdout += chunk.toString()))
        child.stderr.on("data", (chunk) => (stderr += chunk.toString()))

        child.on("close", async () => {
            clearTimeout(timer)
            await rm(tempDir, { recursive: true, force: true }).catch(() => { })

            const executionTimeMs = Date.now() - startedAt

            if (timedOut) {
                resolve({
                    passCount: 0,
                    totalCount: testCases.length,
                    results: [],
                    executionTimeMs,
                    timedOut: true,
                    stderr: "Execution timed out",
                })
                return
            }

            const markerLine = stdout.split("\n").find((line) => line.startsWith(RESULT_MARKER))

            if (!markerLine) {
                resolve({
                    passCount: 0,
                    totalCount: testCases.length,
                    results: [],
                    executionTimeMs,
                    timedOut: false,
                    stderr: stderr || "No result produced (likely syntax/runtime error)",
                });
                return
            }


            try {
                const parsed = JSON.parse(markerLine.replace(RESULT_MARKER, ""));
                const passCount = parsed.filter((r: { pass: boolean }) => r.pass).length;
                resolve({
                    passCount,
                    totalCount: testCases.length,
                    results: parsed,
                    executionTimeMs,
                    timedOut: false,
                    stderr,
                });
            } catch {
                resolve({
                    passCount: 0,
                    totalCount: testCases.length,
                    results: [],
                    executionTimeMs,
                    timedOut: false,
                    stderr: "Failed to parse sandbox result",
                });
            }

        })
    })
}