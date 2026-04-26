# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the **Vault** unblocked games platform plus shared infrastructure packages.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9

### Vault (artifacts/sigma-games)
- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **Animation**: `motion` (motion/react)
- **Icons**: lucide-react
- **Backend**: Express 4 (runs alongside Vite in dev, serves static + API in prod)
- **Database**: PostgreSQL via `pg` (raw SQL with auto-migrations)
- **Auth**: JWT (`jsonwebtoken`) + bcryptjs, session tokens stored in DB
- **Features**: 48 games (6 native React games + 42 iframed), user profiles, achievements, quests, daily rewards, streak system, store, social/friends, chat, admin panel, GDPR consent, i18n (EN/ES-MX), Gemini AI chat (per-user history)
- **Native Games**: Snake, Sigma Clicker (NeonClicker), 2048, Chess (chess.js + react-chessboard), TicTacToe, Sudoku (sudoku-gen)

### API Server (artifacts/api-server)
- **Framework**: Express 5
- **ORM**: Drizzle
- **Validation**: Zod v4
- **Note**: The Vault app uses its OWN Express server (port 3001 dev / PORT prod), not the shared api-server

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/sigma-games run dev` — run Vault (Vite + Express concurrently)
- `pnpm --filter @workspace/sigma-games run build` — build frontend + compile server
- `pnpm --filter @workspace/sigma-games run serve` — run production server
- `pnpm --filter @workspace/api-server run dev` — run shared API server

## Architecture Notes

- Vault's Express server runs on port 3001 in dev; Vite proxies `/api` and `/uploads` to it
- In production, Express serves static files from `dist/public/` AND handles API routes on PORT
- Database migrations run automatically on server start (no separate migration step needed)
- First registered user is automatically promoted to owner/admin
- Game state syncs to server for logged-in users, falls back to localStorage for guests
- The `attached_assets/` directory contains game thumbnail images (referenced via `@assets/` Vite alias)
- AI Chat uses Gemini (`gemini-2.5-flash`) via `@google/genai`. Route: `/api/ai-chat`. Tables: `ai_conversations`, `ai_messages`. Auth required. Streaming via SSE. History capped at 50 messages per turn. Input capped at 10K chars. HTML-escaped before markdown rendering to prevent XSS.
