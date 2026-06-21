import { NextResponse } from "next/server";
import { fetchMetricsDirect } from "../../../lib/bufferDirect";
import { fetchMetricsOrchestrated } from "../../../lib/orchestratedClient";
import type { ExecutionMode } from "../../../lib/types";

function isExecutionMode(value: string | null): value is ExecutionMode {
  return value === "direct" || value === "orchestrated";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const contentId = searchParams.get("contentId");

  if (!isExecutionMode(mode)) {
    return jsonError("mode must be either direct or orchestrated.", 400);
  }

  if (!contentId?.trim()) {
    return jsonError("contentId is required.", 400);
  }

  try {
    const normalizedContentId = contentId.trim();
    const result =
      mode === "direct"
        ? await fetchMetricsDirect(normalizedContentId)
        : await fetchMetricsOrchestrated(normalizedContentId);

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(errorMessage(error), 500);
  }
}
