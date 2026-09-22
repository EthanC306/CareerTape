# CareerTape

FairSignal is a career-fair field guide that turns an overwhelming employer roster into a focused plan. It ranks companies against a student's actual experience, explains every score, creates recruiter-ready briefing cards, captures conversations on a phone, and turns those notes into follow-up drafts.

The project started from a problem I had myself: career fairs make students research dozens of companies before the event, remember dozens of conversations during it, and follow up while the details are still fresh.

## What the MVP does

- Ranks employers using four visible factors: technical overlap, role alignment, project evidence, and location fit
- Shows the evidence behind every recommendation instead of producing a mystery AI score
- Builds a compact briefing card with talking points and stronger questions
- Captures recruiter names, notes, and interest level in a mobile-friendly workflow
- Persists starred employers and conversations in Cloudflare D1
- Creates a personalized follow-up draft from each saved conversation
- Exposes core actions as WebMCP tools so compatible AI agents can use the same workflows as the interface

## Why the scoring is hybrid

An LLM is useful for extracting structured signals from messy inputs such as résumés, job descriptions, and employer profiles. It should not silently decide which company is “best.” FairSignal keeps the final ranking deterministic:

```text
match = technical overlap × 45%
      + role alignment   × 30%
      + project evidence × 15%
      + location fit     × 10%
```

The current demo dataset contains reviewed factor values. The next data pass will constrain AI enrichment to a JSON schema, attach source evidence to every extracted signal, and feed those values into the same transparent scoring function.

## Architecture

- React 19 + TypeScript interface
- Vinext / Next-compatible routing
- Cloudflare Worker server runtime
- Cloudflare D1 with Drizzle ORM and generated migrations
- WebMCP tools for employer navigation, prioritization, and conversation capture
- Shadcn primitives and Tailwind CSS for accessible controls and responsive layout

## Local development

```bash
pnpm install
pnpm run db:generate
pnpm run build
pnpm run dev
```

Local D1 previews require applying the generated migration as described by the starter runtime. The deployed version applies committed migrations automatically.

## Immediate roadmap

1. Import the Ohio University career-fair roster and booth data.
2. Replace the demo profile with Ethan's current résumé and target roles.
3. Add source-linked company enrichment and structured extraction.
4. Test the live-capture flow on a phone before the event.
5. Measure preparation time saved and follow-up completion after the fair.
