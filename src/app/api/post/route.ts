import { NextResponse } from "next/server";
import { publishPostDirect } from "../../../lib/bufferDirect";
import type { ExecutionMode, PostRequest } from "../../../lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isExecutionMode(value: unknown): value is ExecutionMode {
  return value === "direct" || value === "orchestrated";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  if (!isRecord(body)) {
    return jsonError("Request body must be a JSON object.", 400);
  }

  const { mode, text, title } = body;

  if (!isExecutionMode(mode)) {
    return jsonError("mode must be either direct or orchestrated.", 400);
  }

  if (typeof text !== "string" || text.trim().length === 0) {
    return jsonError("text is required.", 400);
  }

  if (title !== undefined && typeof title !== "string") {
    return jsonError("title must be a string when provided.", 400);
  }

  const postRequest: PostRequest = {
    mode,
    title: title?.trim() || undefined,
    text: text.trim(),
  };

  if (postRequest.mode === "orchestrated") {
    return jsonError("Orchestrated mode is not implemented yet.", 501);
  }

  try {
    const result = await publishPostDirect({
      title: postRequest.title,
      text: postRequest.text,
    });

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(errorMessage(error), 500);
  }
}
