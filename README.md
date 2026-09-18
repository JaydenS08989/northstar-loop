# Northstar Loop

Northstar Loop is a production-oriented goal execution workspace that turns ambitious goals into milestones, actionable tasks, daily priorities, focused work, visible progress, and explicit replanning proposals. Its core product question is: **What should I focus on next?**

The project extends the required `JaydenTheDevStar/nextjs-typescript-production-template` foundation and preserves its Pages Router, strict TypeScript, Tailwind CSS v4, `src/` architecture, ESLint/PostCSS setup, and `@/*` path alias.

## Technology

- Next.js 16 Pages Router, React 19, TypeScript 6
- Tailwind CSS v4 and Inter via `next/font`
- TanStack React Query for canonical server state
- Redux Toolkit + thunks for cross-page focus/UI workflow state
- Clerk Core APIs for custom authentication, OAuth, sessions, and MFA
- React Hook Form + Zod for forms and shared validation
- MongoDB official Node.js driver
- OpenAI JavaScript SDK using the Responses API with Zod-validated structured output
- Resend with React Email templates
- Lucide React plus recognizable OAuth provider icons

## Product areas

- Public marketing landing page
- Custom sign-up, sign-in, email verification, password recovery, OAuth, MFA challenge, logout, and account deletion flows
- Action-oriented onboarding with editable AI milestone suggestions and planning preferences
- Dashboard with deterministic **Next Focus** prioritization and optional AI guidance
- Goal, milestone, and task creation, editing, completion, archiving, deletion, ownership checks, and progress roll-up
- Today execution view with completion, reopening, rescheduling, and focus-session entry
- Sparse Focus mode with timer workflow, blocked/skip/complete actions, and task-specific Northstar guidance
- Insights with useful workload/progress metrics and non-destructive AI replan previews
- Settings for profile, planning cadence, working days, notification preferences, TOTP MFA, logout, and account deletion
- Branded transactional welcome, milestone-completed, and goal-completed emails

## Architecture

### Server state

React Query owns API-backed state: goals, milestones, tasks, dashboard data, profile/settings, insights, and AI responses. Query keys are centralized in `src/lib/queryKeys.ts`; mutations invalidate only related resources.

### Client workflow state

Redux Toolkit owns focus-session and responsive navigation workflow state. Focus start/end operations use thunks because they coordinate local workflow state with persistence rather than duplicating general API state.

### Data model and authorization

Clerk is the authentication identity source. MongoDB stores Northstar-specific user/profile information keyed by the Clerk user ID. Every protected API derives the current identity server-side; clients never choose the owning user ID. Resource reads/writes include ownership filters. Goal deletion cascades dependent milestones/tasks, while milestone deletion intentionally detaches tasks so executable work is not lost.

`src/lib/mongodb.ts` caches the connection across development hot reloads and establishes indexes for the actual user/status/date query patterns. A TTL-backed `rateLimits` collection supports AI and email rate limiting.

### Recommendations

`src/utils/scoreTaskRecommendation.ts` ranks work deterministically using understandable urgency, priority, feasibility, momentum/status, and blocked/completed penalties. The app remains useful when OpenAI is unavailable. AI is a planning-assistance layer, not the canonical prioritizer and never silently applies consequential changes.

### AI safety and failure behavior

All OpenAI calls run server-side through `src/lib/ai.ts`. Requests send only planning context required for the feature. Structured responses are parsed and validated with Zod. Provider failures return calm application-level errors or fall back to deterministic recommendations. Raw provider errors, prompts, secrets, and stack traces are never returned to users.

### Forms and validation

Meaningful forms use React Hook Form with `zodResolver`. Validation schemas live in `src/validation`; compatible rules are reused by API routes. Native-style fields prefer `register()`, with local React state reserved for non-form flow state such as MFA stages or modal visibility.

### Alerts and feedback

`src/components/Alert.tsx` is the persistent contextual feedback primitive. Every alert has a title and content, supports restrained semantic variants, and selects `alert` versus `status` semantics based on urgency. Short-lived success interactions remain suited to transient feedback rather than persistent alerts.

## Local setup

### Prerequisites

- Node.js 20.19 or newer
- npm 10 or newer
- MongoDB database
- Clerk application
- OpenAI API key for AI assistance
- Resend API key and verified sender for transactional email

### Install

```bash
npm install
```

Copy the environment template:

```bash
cp .env.example .env.local
```

Fill every value required by the integrations you enable.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public application origin |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk browser publishable key |
| `CLERK_SECRET_KEY` | Clerk server secret |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Svix signing secret for Clerk webhooks |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in route |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign-up route |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Post-sign-in destination |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Post-sign-up destination |
| `NEXT_PUBLIC_CLERK_OAUTH_STRATEGIES` | Comma-separated enabled Clerk strategies, e.g. `oauth_google,oauth_github` |
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB_NAME` | Database name |
| `OPENAI_API_KEY` | Server-only OpenAI key |
| `OPENAI_MODEL` | Optional Responses API model override |
| `RESEND_API_KEY` | Server-only Resend key |
| `RESEND_FROM_EMAIL` | Verified transactional sender |

Only OAuth providers explicitly listed in `NEXT_PUBLIC_CLERK_OAUTH_STRATEGIES` are rendered. They must also be enabled in the active Clerk instance.

### Clerk webhook

Point a Clerk webhook at:

```text
/api/webhooks/clerk
```

Subscribe to the user lifecycle events used by the application (`user.created`, `user.updated`, and `user.deleted`). Copy the endpoint signing secret into `CLERK_WEBHOOK_SIGNING_SECRET`. The route verifies the Svix signature against the raw request body before processing any event.

### Run

```bash
npm run dev
```

Then open `http://localhost:3000` (or the port reported by Next.js).

## Quality commands

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

The unit tests cover deterministic goal-progress roll-up and recommendation behavior. The application code is intentionally structured so additional integration tests can be added around API ownership, validation, and provider adapters without changing product architecture.

## API shape

Successful endpoints use a predictable data envelope and errors use a stable structure like:

```ts
type ApiError = {
  error: {
    code: string
    message: string
  }
}
```

Mutations validate input server-side with Zod and return appropriate HTTP status codes instead of normalizing all outcomes to `200`.

## Design system

The product is deliberately black/white-first, with neutral grays for hierarchy and restrained semantic colors only for status. Inter provides typography. Layouts rely primarily on Flexbox, whitespace, concise cards, subtle borders, small radii, visible keyboard focus, semantic controls, and reduced visual noise. Dialogs trap focus, restore the previously focused element, support Escape, and lock background scroll.

See `DESIGN_RESEARCH.md` for the product-design research summary.

## Deployment

The app can be deployed anywhere that supports Next.js server rendering/API routes and outbound connections to Clerk, MongoDB, OpenAI, and Resend. Configure the same environment variables in the deployment platform, set `NEXT_PUBLIC_APP_URL` to the production origin, register the production Clerk webhook, enable only the intended OAuth strategies, and verify the Resend sender/domain.

Before release, run the full quality-command sequence against installed dependencies and production environment configuration.
