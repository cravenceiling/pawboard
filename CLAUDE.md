# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pawboard is a real-time collaborative ideation board with a cat theme. Users create sessions, add idea cards, move them around a canvas, vote, and react with emojis - all synced in real-time.

## Commands

```bash
bun dev              # Start Next.js dev server
bun build            # Production build
bun format           # Format code with Biome
bun check            # Check code with Biome (linter disabled, formatter only)
bun db:push          # Sync schema directly to database (dev only)
bun db:generate      # Generate migrations from schema changes
bun db:migrate       # Apply pending migrations
bun db:studio        # Open Drizzle Studio UI
```

**Note:** No test framework is configured. Use Bun, not npm/yarn.

## Tech Stack

- Next.js 16 (App Router, RSC) with React 19 and React Compiler
- TypeScript 5 (strict mode)
- Drizzle ORM with PostgreSQL
- Supabase Realtime (channels and presence)
- Tailwind CSS 4 + shadcn/ui (new-york preset)
- Zustand for state management
- Vercel AI SDK + Groq for AI text refinement
- Biome for formatting (linter disabled)

## Architecture

### Key Files

- `app/actions.ts` - All server actions with `{ data, error }` return pattern
- `lib/permissions.ts` - Authorization logic for all user actions
- `hooks/use-realtime-cards.ts` - Main realtime sync engine with throttled broadcasts
- `db/schema.ts` - Drizzle ORM schema (users, sessions, session_participants, cards)

### Data Flow

1. User actions trigger server actions in `app/actions.ts`
2. Server actions validate, check permissions, persist to PostgreSQL via Drizzle
3. Changes broadcast via Supabase Realtime channels
4. `use-realtime-cards.ts` receives broadcasts and updates local state
5. Optimistic UI updates happen immediately, server confirms async

### Permission System

The `lib/permissions.ts` module controls all authorization:
- Session creator has full control (can delete any card, configure settings)
- Session settings control participant permissions (`movePermission`, `deletePermission`)
- Users can only edit/color their own cards
- `isLocked` session setting blocks most modifications

### Component Organization

- Server components by default (pages, layouts)
- `"use client"` for interactive components (Board, IdeaCard, dialogs)
- `components/ui/` contains shadcn/ui components - DO NOT EDIT directly
- Add new shadcn components via `bunx shadcn@latest add <component>`

## Code Style

Biome formatter settings: 2-space indent, 80 char line width, double quotes, semicolons always, trailing commas.

### Import Order

1. React/Next.js (`react`, `next/*`)
2. Third-party (`@supabase/*`, `drizzle-orm`, `lucide-react`, `motion/*`)
3. Local components (`@/components/*`)
4. Local hooks (`@/hooks/*`)
5. Local utilities (`@/lib/*`)
6. Database (`@/db/*`)
7. Types (use `type` keyword)

### TypeScript

- Never use `any` - strict mode is enabled
- Use `type` keyword for type-only imports
- Use Drizzle's `$inferSelect`/`$inferInsert` for DB types
- Dynamic route params use `Promise<{ param }>` pattern in Next.js 16

### Server Actions Pattern

```typescript
export async function createCard(data: NewCard) {
  try {
    const card = await db.insert(cards).values(data).returning();
    return { card: card[0], error: null };
  } catch (error) {
    return { card: null, error: "Failed to create card" };
  }
}
```

## Environment Variables

Required in `.env.local`:
```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJ...
GROQ_API_KEY=gsk_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Important Notes

- Only edit `db/schema.ts` for schema changes - user will apply migrations manually
- Realtime updates are throttled (50ms) in `use-realtime-cards.ts`
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes
