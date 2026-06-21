type BufferGraphqlError = {
  message?: string;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
};

type BufferGraphqlResponse<TData> = {
  data?: TData;
  errors?: BufferGraphqlError[];
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function bufferGraphql<TData>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<TData> {
  const accessToken = process.env.BUFFER_ACCESS_TOKEN?.trim();

  if (!accessToken) {
    throw new Error("Missing BUFFER_ACCESS_TOKEN environment variable.");
  }

  const response = await fetch("https://api.buffer.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Buffer GraphQL request failed with ${response.status} ${response.statusText}${
        details ? `: ${details}` : ""
      }`,
    );
  }

  let json: BufferGraphqlResponse<TData>;

  try {
    json = (await response.json()) as BufferGraphqlResponse<TData>;
  } catch (error) {
    throw new Error(
      `Buffer GraphQL response was not valid JSON: ${errorMessage(error)}`,
    );
  }

  if (json.errors?.length) {
    const messages = json.errors
      .map((error) => error.message ?? JSON.stringify(error))
      .join("; ");

    throw new Error(`Buffer GraphQL returned errors: ${messages}`);
  }

  if (json.data === undefined) {
    throw new Error("Buffer GraphQL response did not include data.");
  }

  return json.data;
}
