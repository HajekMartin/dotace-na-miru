# Dotace na míru — Marketing Microsite Assignment

This project was created for **Dotace na míru** as a candidate assignment.

The original assignment is attached in this repository as a PDF file:

```text
2026-06-11_mikov_marketing_candidate_assignment.pdf
```

## Assignment Summary

The assignment asks for a small deployed marketing microsite that can publish a test post to a controlled business account/channel and then fetch and display metrics for that content.

The key requirements from the PDF are:

1. Choose **one approved platform**:
   - Buffer
   - LinkedIn Company Pages
   - Pinterest Business
   - Facebook Pages
   - YouTube

2. Build a microsite UI with at least two primary actions:
   - **Post**
   - **Fetch metrics**

3. Show the following in the UI:
   - created content ID
   - timestamps
   - fetched metrics
   - execution mode used

4. Implement two execution modes:
   - **Direct mode** — custom direct API calls without an orchestration layer.
   - **Orchestrated mode** — use an existing integration/orchestration layer.

5. Deploy the application using **Infrastructure as Code**.
   Acceptable approaches include Terraform, OpenTofu, Pulumi, or provider-native infrastructure definitions.

6. Deliverables required by the assignment:
   - application source code
   - code/configuration for the orchestrated integration path
   - code for the direct API path
   - Infrastructure-as-Code files for deployment
   - short README with setup, run, and deploy instructions

7. Minimum acceptance criteria:
   - the app can publish a test post to a controlled dummy business account/page/channel
   - the app can fetch metrics for that content and display them clearly
   - both orchestrated and direct execution modes are implemented
   - the app is deployed and the deployment is reproducible using Infrastructure as Code
   - secrets are handled outside source code

## Implemented Solution

The selected approved platform is **Buffer**.

The application publishes test social posts to a controlled Buffer channel and fetches post metrics from Buffer.

The implementation was tested only with one controlled Buffer channel that publishes to **X/Twitter**. Other Buffer-supported channel types were not tested as part of this assignment.

Two execution modes are implemented:

### 1. Direct Buffer API

The application calls the Buffer GraphQL API directly from the Next.js backend.

Flow:

```text
Browser → Next.js API route → Buffer GraphQL API
```

This satisfies the direct custom API requirement.

### 2. Make Orchestration

The application calls Make.com webhooks. Make then calls the Buffer GraphQL API.

Flow:

```text
Browser → Next.js API route → Make webhook → Buffer GraphQL API
```

This satisfies the orchestrated integration path requirement.

## Main Features

- Publish a test post to a controlled Buffer channel.
- Fetch Buffer metrics for a created post.
- Switch between direct and orchestrated execution modes.
- Display:
  - content ID
  - created/fetched timestamps
  - execution mode
  - normalized metrics
  - raw provider responses
- Deploy to Vercel.
- Manage deployment infrastructure with Terraform.
- Keep secrets outside source code through environment variables.

## Tech Stack

- Next.js
- TypeScript
- Buffer GraphQL API
- Make.com webhooks for orchestration
- Vercel hosting
- Terraform for Infrastructure as Code

## Project Structure

```text
.
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── post/
│   │   │   └── metrics/
│   │   └── page.tsx
│   └── lib/
│       ├── bufferDirect.ts
│       ├── bufferGraphql.ts
│       ├── orchestratedClient.ts
│       └── types.ts
├── infra/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── terraform.tfvars.example
├── make/
│   ├── buffer-create-post.blueprint.json
│   └── buffer-fetch-metrics.blueprint.json
├── .env.example
└── README.md
```

Important parts:

- `src/lib/bufferDirect.ts` — direct Buffer API implementation.
- `src/lib/bufferGraphql.ts` — shared Buffer GraphQL client.
- `src/lib/orchestratedClient.ts` — Make orchestration client.
- `src/app/api/post/route.ts` — API endpoint for publishing posts.
- `src/app/api/metrics/route.ts` — API endpoint for fetching metrics.
- `make/` — exported Make scenario blueprints.
- `infra/` — Terraform deployment configuration.

## Environment Variables

Create a local `.env.local` file based on `.env.example`.

Expected variables:

```env
BUFFER_ACCESS_TOKEN=
BUFFER_ORGANIZATION_ID=
BUFFER_CHANNEL_ID=
MAKE_POST_WEBHOOK_URL=
MAKE_METRICS_WEBHOOK_URL=
```

Depending on the final code version, the Make webhook variables may use the more generic names:

```env
ORCHESTRATED_POST_WEBHOOK_URL=
ORCHESTRATED_METRICS_WEBHOOK_URL=
```

Use the exact names referenced in `src/lib/orchestratedClient.ts`.

### Variable Meaning

| Variable | Description |
|---|---|
| `BUFFER_ACCESS_TOKEN` | Buffer API token used by the direct API integration. |
| `BUFFER_ORGANIZATION_ID` | Buffer organization ID. |
| `BUFFER_CHANNEL_ID` | Buffer channel ID used for test posts. |
| `MAKE_POST_WEBHOOK_URL` / `ORCHESTRATED_POST_WEBHOOK_URL` | Make webhook URL for orchestrated post creation. |
| `MAKE_METRICS_WEBHOOK_URL` / `ORCHESTRATED_METRICS_WEBHOOK_URL` | Make webhook URL for orchestrated metrics fetching. |

Do not commit `.env.local`, Buffer tokens, Vercel tokens, Make webhook URLs, or Terraform variable files containing secrets.

## Local Setup

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## How to Use the Microsite

1. Select execution mode:
   - **Direct Buffer API**
   - **Make orchestration**

2. Enter post text.

3. Click **Post**.

4. The app displays:
   - content ID
   - creation timestamp
   - execution mode
   - raw Buffer/Make response

5. Click **Fetch metrics**.

6. The app displays:
   - fetched timestamp
   - normalized metrics
   - raw metrics response

For very new posts, Buffer metrics may be zero or delayed. This is expected for test content.

## API Endpoints

### `POST /api/post`

Publishes or schedules a test post.

Request body:

```json
{
  "mode": "direct",
  "title": "Optional title",
  "text": "Hello from the marketing microsite"
}
```

Supported modes:

```text
direct
orchestrated
```

Example response:

```json
{
  "contentId": "6a...",
  "createdAt": "2026-06-21T18:00:00.000Z",
  "executionMode": "direct",
  "provider": "buffer",
  "raw": {}
}
```

### `GET /api/metrics`

Fetches metrics for a previously created Buffer post.

Example:

```bash
curl "http://localhost:3000/api/metrics?mode=direct&contentId=POST_ID"
```

Example response:

```json
{
  "contentId": "6a...",
  "fetchedAt": "2026-06-21T18:05:00.000Z",
  "executionMode": "direct",
  "provider": "buffer",
  "metrics": {
    "likes": 0,
    "comments": 0,
    "engagements": 0,
    "impressions": 0,
    "clicks": 0
  },
  "raw": {}
}
```

## Make.com Orchestration

The orchestrated mode uses Make.com.

Expected exported blueprints:

```text
make/buffer-create-post.blueprint.json
make/buffer-fetch-metrics.blueprint.json
```

### Create Post Scenario

Expected flow:

```text
Custom Webhook → HTTP request to Buffer GraphQL → Webhook Response
```

Input from the application:

```json
{
  "title": "Optional title",
  "text": "Post text"
}
```

The scenario calls Buffer `createPost` and returns the Buffer response to the application. The application extracts the created post ID and normalizes it into the internal `PostResult` format.

### Fetch Metrics Scenario

Expected flow:

```text
Custom Webhook → HTTP request to Buffer GraphQL → Webhook Response
```

Input from the application:

```json
{
  "contentId": "6a..."
}
```

The scenario calls the Buffer post metrics query. The application normalizes Buffer's metrics array into the internal metrics format.

## Infrastructure as Code

Deployment infrastructure is described in `infra/` using Terraform.

The Terraform configuration creates/manages:

- Vercel project
- Next.js framework configuration
- Git repository link
- Vercel environment variables for Buffer and Make integration

### Terraform Variables

Copy the example file:

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
```

Fill in the real values in `terraform.tfvars`.

Do not commit `terraform.tfvars`.

### Terraform Commands

Initialize Terraform:

```bash
terraform init
```

Preview planned changes:

```bash
terraform plan
```

Apply the infrastructure changes:

```bash
terraform apply
```

Terraform creates the Vercel project and environment variables. A production deployment can be triggered through the Vercel Git integration after pushing to the production branch, or manually through the Vercel CLI.

## Deployment

### Vercel CLI

Link the local project to the Vercel project:

```bash
npx vercel link
```

Deploy to production:

```bash
npx vercel --prod
```

### Git-based Vercel Deployment

If the Vercel project is linked to GitHub, pushing to the production branch can trigger a Vercel deployment automatically.

## Build

Run:

```bash
npm run build
```

## Security Notes

- Secrets are read from environment variables.
- `.env.local` must not be committed.
- `infra/terraform.tfvars` must not be committed.
- Buffer API tokens, Vercel API tokens, and Make webhook URLs should be rotated if accidentally shared.
- Make blueprints should not contain real credentials.

## Assignment Coverage

| Assignment requirement | Implementation |
|---|---|
| Working microsite | Next.js app with UI for posting and fetching metrics. |
| Approved platform | Buffer. |
| Publish test post | Buffer `createPost` through direct and orchestrated paths. |
| Fetch metrics | Buffer post metrics query. |
| Direct mode | Next.js API route calls Buffer GraphQL directly. |
| Orchestrated mode | Next.js API route calls Make webhook, Make calls Buffer. |
| Show content ID | Displayed after successful post creation. |
| Show timestamps | Created/fetched timestamps are displayed. |
| Show metrics | Normalized metrics and raw response are displayed. |
| Show execution mode | UI and API responses include `direct` or `orchestrated`. |
| Infrastructure as Code | Terraform files in `infra/`. |
| Secrets outside source code | Environment variables and ignored local secret files. |
| Orchestration code/config | Make blueprint JSON files in `make/`. |

## Notes

The implementation is intentionally scoped as an end-to-end slice, not a full marketing product. The goal is to demonstrate integration with a real marketing platform, direct and orchestrated execution paths, metrics retrieval, deployment, and Infrastructure as Code.
