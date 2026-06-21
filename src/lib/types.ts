export type ExecutionMode = "direct" | "orchestrated";

export type PostRequest = {
  mode: ExecutionMode;
  title?: string;
  text: string;
};

export type PostResult = {
  contentId: string;
  createdAt: string;
  executionMode: ExecutionMode;
  provider: "buffer";
  raw: unknown;
};

export type MetricsResult = {
  contentId: string;
  fetchedAt: string;
  executionMode: ExecutionMode;
  provider: "buffer";
  metrics: {
    impressions?: number;
    clicks?: number;
    engagements?: number;
    likes?: number;
    comments?: number;
  };
  raw: unknown;
};
