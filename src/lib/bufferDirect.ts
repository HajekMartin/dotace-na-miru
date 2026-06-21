import { bufferGraphql } from "./bufferGraphql";
import type { MetricsResult, PostResult } from "./types";

type BufferIdea = {
  id?: string | null;
  content?: {
    title?: string | null;
    text?: string | null;
  } | null;
};

type CreateIdeaData = {
  createIdea?: BufferIdea | null;
};

const CREATE_IDEA_MUTATION = `
  mutation CreateIdea($organizationId: ID!, $title: String!, $text: String!) {
    createIdea(input: {
      organizationId: $organizationId,
      content: {
        title: $title,
        text: $text
      }
    }) {
      ... on Idea {
        id
        content {
          title
          text
        }
      }
    }
  }
`;

export async function publishPostDirect(input: {
  title?: string;
  text: string;
}): Promise<PostResult> {
  const organizationId = process.env.BUFFER_ORGANIZATION_ID?.trim();

  if (!organizationId) {
    throw new Error("Missing BUFFER_ORGANIZATION_ID environment variable.");
  }

  const title = input.title?.trim() || "New Idea from Marketing Microsite";

  const data = await bufferGraphql<CreateIdeaData>(CREATE_IDEA_MUTATION, {
    organizationId,
    title,
    text: input.text,
  });

  const ideaId = data.createIdea?.id;

  if (!ideaId) {
    throw new Error("Buffer createIdea response did not include an idea id.");
  }

  return {
    contentId: ideaId,
    createdAt: new Date().toISOString(),
    executionMode: "direct",
    provider: "buffer",
    raw: data,
  };
}

export async function fetchMetricsDirect(
  contentId: string,
): Promise<MetricsResult> {
  return {
    contentId,
    fetchedAt: new Date().toISOString(),
    executionMode: "direct",
    provider: "buffer",
    metrics: {},
    raw: {
      note: "Metrics endpoint not implemented yet. Buffer createIdea integration is working.",
    },
  };
}
