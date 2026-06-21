import { bufferGraphql } from "./bufferGraphql";
import type { MetricsResult, PostResult } from "./types";

type BufferPost = {
  id?: string | null;
  status?: string | null;
  text?: string | null;
  dueAt?: string | null;
  shareMode?: string | null;
  schedulingType?: string | null;
  channelId?: string | null;
  channelService?: string | null;
};

type CreatePostPayload = {
  __typename?: string;
  message?: string;
  post?: BufferPost | null;
};

type CreatePostData = {
  createPost?: CreatePostPayload | null;
};

type CreatePostInput = {
  channelId: string;
  text: string;
  schedulingType: "automatic";
  dueAt: string;
  assets: [];
  mode: "customScheduled";
  source: string;
};

const CREATE_POST_MUTATION = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      __typename
      ... on PostActionSuccess {
        post {
          id
          status
          text
          dueAt
          shareMode
          schedulingType
          channelId
          channelService
        }
      }
      ... on MutationError {
        message
      }
    }
  }
`;

export async function publishPostDirect(input: {
  title?: string;
  text: string;
}): Promise<PostResult> {
  const organizationId = process.env.BUFFER_ORGANIZATION_ID?.trim();
  const channelId = process.env.BUFFER_CHANNEL_ID?.trim();

  if (!organizationId) {
    throw new Error("Missing BUFFER_ORGANIZATION_ID environment variable.");
  }

  if (!channelId) {
    throw new Error("Missing BUFFER_CHANNEL_ID environment variable.");
  }

  const dueAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const createPostInput: CreatePostInput = {
    channelId,
    text: input.text,
    schedulingType: "automatic",
    dueAt,
    assets: [],
    mode: "customScheduled",
    source: "marketing-microsite",
  };

  const data = await bufferGraphql<CreatePostData>(CREATE_POST_MUTATION, {
    input: createPostInput,
  });

  const payload = data.createPost;

  if (!payload) {
    throw new Error("Buffer createPost response did not include a payload.");
  }

  if (payload.__typename !== "PostActionSuccess") {
    throw new Error(
      `Buffer createPost failed${
        payload.message ? `: ${payload.message}` : ` with ${payload.__typename}`
      }`,
    );
  }

  const postId = payload.post?.id;

  if (!postId) {
    throw new Error("Buffer createPost response did not include a post id.");
  }

  return {
    contentId: postId,
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
      note: "Metrics endpoint not implemented yet. Buffer createPost integration is working.",
    },
  };
}
