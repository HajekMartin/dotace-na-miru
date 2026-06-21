"use client";

import { useState } from "react";
import type {
  ExecutionMode,
  MetricsResult,
  PostResult,
} from "../lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function apiError(payload: unknown): string | null {
  if (isRecord(payload) && typeof payload.error === "string") {
    return payload.error;
  }

  return null;
}

function isPostResult(value: unknown): value is PostResult {
  return (
    isRecord(value) &&
    typeof value.contentId === "string" &&
    typeof value.createdAt === "string" &&
    (value.executionMode === "direct" ||
      value.executionMode === "orchestrated") &&
    value.provider === "buffer"
  );
}

function isMetricsResult(value: unknown): value is MetricsResult {
  return (
    isRecord(value) &&
    typeof value.contentId === "string" &&
    typeof value.fetchedAt === "string" &&
    (value.executionMode === "direct" ||
      value.executionMode === "orchestrated") &&
    value.provider === "buffer" &&
    isRecord(value.metrics)
  );
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("API returned invalid JSON.");
  }
}

function prettyJson(value: unknown): string {
  return JSON.stringify(value ?? null, null, 2);
}

const modeLabels: Record<ExecutionMode, string> = {
  direct: "Direct Buffer API",
  orchestrated: "Make orchestration",
};

export default function Home() {
  const [mode, setMode] = useState<ExecutionMode>("direct");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [contentId, setContentId] = useState("");
  const [postResult, setPostResult] = useState<PostResult | null>(null);
  const [metricsResult, setMetricsResult] = useState<MetricsResult | null>(
    null,
  );
  const [rawResponse, setRawResponse] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isFetchingMetrics, setIsFetchingMetrics] = useState(false);

  async function handlePost() {
    setError("");
    setIsPosting(true);

    try {
      const response = await fetch("/api/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          title: title.trim() || undefined,
          text,
        }),
      });

      const payload = await readJson(response);

      if (!response.ok) {
        throw new Error(
          apiError(payload) ?? `Post request failed with ${response.status}.`,
        );
      }

      if (!isPostResult(payload)) {
        throw new Error("Post response did not match the expected shape.");
      }

      setPostResult(payload);
      setContentId(payload.contentId);
      setRawResponse(payload.raw);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : String(caughtError),
      );
    } finally {
      setIsPosting(false);
    }
  }

  async function handleFetchMetrics() {
    setError("");
    setIsFetchingMetrics(true);

    try {
      const params = new URLSearchParams({
        mode,
        contentId,
      });

      const response = await fetch(`/api/metrics?${params.toString()}`);
      const payload = await readJson(response);

      if (!response.ok) {
        throw new Error(
          apiError(payload) ??
            `Metrics request failed with ${response.status}.`,
        );
      }

      if (!isMetricsResult(payload)) {
        throw new Error("Metrics response did not match the expected shape.");
      }

      setMetricsResult(payload);
      setRawResponse(payload.raw);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : String(caughtError),
      );
    } finally {
      setIsFetchingMetrics(false);
    }
  }

  const executionMode =
    metricsResult?.executionMode ?? postResult?.executionMode ?? mode;

  return (
    <main className="min-h-screen bg-[#f6f7f2] px-5 py-8 text-[#1b1d1f] sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-2 border-b border-[#d9ded2] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-[#4c675b]">
              Candidate Assignment
            </p>
            <h1 className="text-3xl font-semibold tracking-normal text-[#151719]">
              Buffer Direct API + Make Orchestration
            </h1>
          </div>
          <div className="text-sm font-medium text-[#506054]">
            Mode: {modeLabels[executionMode]}
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <form
            className="flex flex-col gap-5 rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              void handlePost();
            }}
          >
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {(["direct", "orchestrated"] as const).map((value) => (
                <label
                  key={value}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-4 text-sm font-medium ${
                    mode === value
                      ? "border-[#1e6f52] bg-[#e8f4ee] text-[#144b38]"
                      : "border-[#d8ddd3] bg-white text-[#4d5650]"
                  }`}
                >
                  <input
                    className="h-4 w-4 accent-[#1e6f52]"
                    type="radio"
                    name="mode"
                    value={value}
                    checked={mode === value}
                    onChange={() => setMode(value)}
                  />
                  {modeLabels[value]}
                </label>
              ))}
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-[#303632]">
              Title
              <input
                className="min-h-11 rounded-md border border-[#ccd3c7] bg-white px-3 text-base outline-none transition focus:border-[#1e6f52] focus:ring-2 focus:ring-[#c7e5d8]"
                placeholder="New Idea from Marketing Microsite"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-[#303632]">
              Text
              <textarea
                className="min-h-44 resize-y rounded-md border border-[#ccd3c7] bg-white px-3 py-3 text-base outline-none transition focus:border-[#1e6f52] focus:ring-2 focus:ring-[#c7e5d8]"
                required
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                className="min-h-11 rounded-md bg-[#1e6f52] px-4 text-sm font-semibold text-white transition hover:bg-[#185a43] disabled:cursor-not-allowed disabled:bg-[#8ca99c]"
                type="submit"
                disabled={isPosting || text.trim().length === 0}
              >
                {isPosting ? "Posting..." : "Post"}
              </button>
              <button
                className="min-h-11 rounded-md border border-[#1e6f52] bg-white px-4 text-sm font-semibold text-[#185a43] transition hover:bg-[#eef7f3] disabled:cursor-not-allowed disabled:border-[#c8d2cc] disabled:text-[#8b9891]"
                type="button"
                disabled={isFetchingMetrics || contentId.trim().length === 0}
                onClick={() => void handleFetchMetrics()}
              >
                {isFetchingMetrics ? "Fetching..." : "Fetch metrics"}
              </button>
            </div>

            {error ? (
              <div className="rounded-md border border-[#edb8ac] bg-[#fff1ee] px-3 py-2 text-sm font-medium text-[#8a2415]">
                {error}
              </div>
            ) : null}
          </form>

          <section className="grid gap-5">
            <div className="grid gap-4 rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-[#303632] sm:col-span-2">
                Content ID
                <input
                  className="min-h-11 rounded-md border border-[#ccd3c7] bg-white px-3 font-mono text-sm outline-none transition focus:border-[#1e6f52] focus:ring-2 focus:ring-[#c7e5d8]"
                  type="text"
                  value={contentId}
                  onChange={(event) => setContentId(event.target.value)}
                />
              </label>

              <div>
                <div className="text-xs font-semibold uppercase tracking-normal text-[#607167]">
                  Created at
                </div>
                <div className="mt-1 min-h-6 break-words font-mono text-sm text-[#252a27]">
                  {postResult?.createdAt ?? "-"}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-normal text-[#607167]">
                  Fetched at
                </div>
                <div className="mt-1 min-h-6 break-words font-mono text-sm text-[#252a27]">
                  {metricsResult?.fetchedAt ?? "-"}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-normal text-[#607167]">
                  Execution mode
                </div>
                <div className="mt-1 min-h-6 font-mono text-sm text-[#252a27]">
                  {modeLabels[executionMode]}
                </div>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <section className="rounded-lg border border-[#d9ded2] bg-[#171b19] p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-white">
                  Metrics JSON
                </h2>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-[#0f1211] p-3 font-mono text-xs leading-5 text-[#dfe8df]">
                  {prettyJson(metricsResult?.metrics ?? {})}
                </pre>
              </section>

              <section className="rounded-lg border border-[#d9ded2] bg-[#171b19] p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-white">
                  Raw JSON response
                </h2>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-[#0f1211] p-3 font-mono text-xs leading-5 text-[#dfe8df]">
                  {prettyJson(rawResponse)}
                </pre>
              </section>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
