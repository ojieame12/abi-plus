# ABI+

ABI+ is an AI-assisted procurement intelligence prototype for turning complex supplier, market and risk data into decision-ready workflows.

The product explores how procurement teams can move from a natural-language question to a traceable answer, inspect supporting sources, escalate research and route higher-cost work through an approval flow. The interface includes supplier intelligence, managed categories, deep research, expert collaboration, credit controls and source-confidence states.

## Product principles

- Make AI reasoning inspectable through citations, source metadata and confidence states.
- Preserve a clear path from summary to evidence, deeper analysis and expert help.
- Design approval, credit and recovery states as part of the core workflow.
- Keep complex enterprise data usable through focused widgets and progressive disclosure.

## Technical foundation

- React 19, TypeScript and Vite
- Framer Motion for interaction and transition design
- Vitest and Testing Library for component, service and API behavior
- Drizzle ORM with PostgreSQL-compatible schemas
- Vercel serverless API routes
- Gemini, Perplexity and hybrid synthesis adapters

## Verification

The repository currently passes strict TypeScript compilation, 1,214 automated tests and a production build. GitHub Actions runs the same gates on every pull request and push to `main`.

```bash
npm ci
npm run verify
```

## Run locally

```bash
npm ci
npm run dev
```

The visual prototype and mocked product paths run without external credentials. Live provider and database paths require the corresponding local environment variables.

## Selected flows

- Conversational procurement and supplier-risk exploration
- Hybrid internal and web research with inline citation handling
- Deep-research intake, progress and report artifacts
- Managed-category setup and coverage states
- Analyst and expert escalation
- Credit ledger, holds and approval workflows
- Community questions, notifications and organization controls

## Status

ABI+ is a portfolio prototype, not a production procurement service. Its purpose is to demonstrate product thinking, interaction design and working front-end implementation for trustworthy AI workflows.
