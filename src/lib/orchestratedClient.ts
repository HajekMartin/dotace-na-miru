import type { MetricsResult, PostResult } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPostResult(value: unknown): value is PostResult {
  return (
    isRecord(value) &&
    typeof value.contentId === "string" &&
    typeof value.createdAt === "string" &&
    value.executionMode === "orchestrated" &&
    value.provider === "buffer" &&
    "raw" in value
  );
}

function getStringProperty(
  value: Record<string, unknown>,
  property: string,
): string | null {
  const propertyValue = value[property];

  return typeof propertyValue === "string" ? propertyValue : null;
}

function getNestedPostId(response: unknown): string | null {
  if (!isRecord(response)) {
    return null;
  }

  const data = response.data;
  const firstCreatePost = isRecord(data) ? data.createPost : null;
  const createPost = isRecord(firstCreatePost)
    ? firstCreatePost
    : response.createPost;

  if (!isRecord(createPost)) {
    return null;
  }

  const post = createPost.post;

  if (!isRecord(post)) {
    return null;
  }

  return getStringProperty(post, "id");
}

function toTopLevelPostResult(response: unknown): PostResult | null {
  if (!isRecord(response)) {
    return null;
  }

  const contentId = getStringProperty(response, "contentId");

  if (!contentId) {
    return null;
  }

  if (isPostResult(response)) {
    return response;
  }

  return {
    contentId,
    createdAt:
      getStringProperty(response, "createdAt") ?? new Date().toISOString(),
    executionMode: "orchestrated",
    provider: "buffer",
    raw: "raw" in response ? response.raw : response,
  };
}

function rawPayloadForNestedPost(response: unknown): unknown {
  if (!isRecord(response)) {
    return response;
  }

  return isRecord(response.data) ? response.data : response;
}

function isMetricsResult(value: unknown): value is MetricsResult {
  return (
    isRecord(value) &&
    typeof value.contentId === "string" &&
    typeof value.fetchedAt === "string" &&
    value.executionMode === "orchestrated" &&
    value.provider === "buffer" &&
    isRecord(value.metrics) &&
    "raw" in value
  );
}

async function postWebhookJson(
  webhookUrl: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `Make orchestration webhook request failed with ${response.status} ${response.statusText}${
        responseText ? `: ${responseText}` : ""
      }`,
    );
  }

  let parsedResponse: unknown;

  try {
    parsedResponse = responseText ? JSON.parse(responseText) : null;
  } catch {
    throw new Error(
      `Make orchestration webhook returned invalid JSON: ${responseText}`,
    );
  }

  return parsedResponse;
}

async function postJson<TResponse>(
  webhookUrl: string,
  payload: Record<string, unknown>,
  responseGuard: (value: unknown) => value is TResponse,
  responseName: string,
): Promise<TResponse> {
  const parsedResponse = await postWebhookJson(webhookUrl, payload);

  if (!responseGuard(parsedResponse)) {
    throw new Error(
      `Make orchestration webhook response did not match ${responseName}.`,
    );
  }

  return parsedResponse;
}

export async function publishPostOrchestrated(input: {
  title?: string;
  text: string;
}): Promise<PostResult> {
  const webhookUrl = process.env.ORCHESTRATED_POST_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    throw new Error("ORCHESTRATED_POST_WEBHOOK_URL is not configured.");
  }

  const parsedResponse = await postWebhookJson(webhookUrl, {
    title: input.title,
    text: input.text,
  });

  const topLevelPostResult = toTopLevelPostResult(parsedResponse);

  if (topLevelPostResult) {
    return topLevelPostResult;
  }

  const contentId = getNestedPostId(parsedResponse);

  if (!contentId) {
    throw new Error(
      "Orchestrated webhook response did not contain a content ID.",
    );
  }

  return {
    contentId,
    createdAt: new Date().toISOString(),
    executionMode: "orchestrated",
    provider: "buffer",
    raw: rawPayloadForNestedPost(parsedResponse),
  };
}

export async function fetchMetricsOrchestrated(
  contentId: string,
): Promise<MetricsResult> {
  const webhookUrl = process.env.ORCHESTRATED_METRICS_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    throw new Error("ORCHESTRATED_METRICS_WEBHOOK_URL is not configured.");
  }

  return postJson<MetricsResult>(
    webhookUrl,
    {
      contentId,
    },
    isMetricsResult,
    "MetricsResult",
  );
}
