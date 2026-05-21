# LegaLite – Agent & AI Rules Reference

> **Read `docs/RULES.md` before performing any task in this repository.**
> All code standards, UI rules, architecture constraints, and security requirements are defined there.

## Quick Reference

- **Frontend rules** → `docs/FRONTEND.md`
- **Backend rules** → `docs/BACKEND.md`
- **AI integration rules** → `docs/AI.md`
- **Full operational rules** → `docs/RULES.md`
- **DB schema** → `schema.sql`
- **Project overview** → `README.md`

## Key Constraints (always enforced)

- No emojis in code, comments, or commit messages.
- All UI components from **shadcn/ui** only.
- Every async action needs a loading state + toast notification.
- State: Zustand for UI/auth, TanStack Query for server data.
- All AI calls routed through NestJS — never directly from frontend.
- Design: gold `#C9972B` + navy `#0D1B2A` + cream `#F8F4EE`.
- Fonts: **Playfair Display** (headings) + **DM Sans** (body).

<!-- BEGIN:nextjs-agent-rules -->
This version of Next.js has breaking changes — APIs, conventions, and file structure may differ from training data.
Read the relevant guide in `node_modules/next/dist/docs/` before writing any code.
<!-- END:nextjs-agent-rules -->
