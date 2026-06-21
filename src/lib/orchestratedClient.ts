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

function formatWebhookResponse(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
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

function extractPostFromMetricsResponse(
  response: unknown,
): Record<string, unknown> | null {
  if (!isRecord(response)) {
    return null;
  }

  const dataPost = isRecord(response.data) ? response.data.post : null;

  if (isRecord(dataPost)) {
    return dataPost;
  }

  return isRecord(response.post) ? response.post : null;
}

function normalizeBufferMetrics(metrics: unknown): MetricsResult["metrics"] {
  if (!Array.isArray(metrics)) {
    return {};
  }

  return metrics.reduce<MetricsResult["metrics"]>(
    (normalizedMetrics, metric) => {
      if (!isRecord(metric) || typeof metric.value !== "number") {
        return normalizedMetrics;
      }

      const type = typeof metric.type === "string" ? metric.type : "";
      const name = typeof metric.name === "string" ? metric.name : "";
      const key = `${type} ${name}`.toLowerCase();

      if (key.includes("impression")) {
        normalizedMetrics.impressions = metric.value;
      }

      if (key.includes("click")) {
        normalizedMetrics.clicks = metric.value;
      }

      if (key.includes("engagement")) {
        normalizedMetrics.engagements = metric.value;
      }

      if (key.includes("reaction") || key.includes("like")) {
        normalizedMetrics.likes = metric.value;
      }

      if (key.includes("comment")) {
        normalizedMetrics.comments = metric.value;
      }

      return normalizedMetrics;
    },
    {},
  );
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

export async function publishPostViaMake(input: {
  title?: string;
  text: string;
}): Promise<PostResult> {
  const webhookUrl = process.env.MAKE_POST_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    throw new Error("MAKE_POST_WEBHOOK_URL is not configured.");
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
      "Make orchestration webhook response did not contain a content ID.",
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

export async function fetchMetricsViaMake(
  contentId: string,
): Promise<MetricsResult> {
  const webhookUrl = process.env.MAKE_METRICS_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    throw new Error("MAKE_METRICS_WEBHOOK_URL is not configured.");
  }

  const parsedResponse = await postWebhookJson(webhookUrl, {
    contentId,
  });

  if (isMetricsResult(parsedResponse)) {
    return parsedResponse;
  }

  const post = extractPostFromMetricsResponse(parsedResponse);

  if (!post) {
    throw new Error(
      `Make orchestration webhook response did not match MetricsResult. Received: ${formatWebhookResponse(
        parsedResponse,
      )}`,
    );
  }

  return {
    contentId: getStringProperty(post, "id") ?? contentId,
    fetchedAt: new Date().toISOString(),
    executionMode: "orchestrated",
    provider: "buffer",
    metrics: normalizeBufferMetrics(post.metrics),
    raw: parsedResponse,
  };
}
