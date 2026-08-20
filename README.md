# KQ Personal Planner

**AI-powered personal planner for Kevin Quinn — owner of AI Bridge Solutions.**

A professional, full-stack planner application built with Next.js 15, Neon Postgres, and OpenAI GPT-4o. Control your entire work life with natural language: "Schedule a meeting with John tomorrow at 3pm", "Create an urgent task to review the proposal", "Show me today's agenda".

---

## Features

- **AI Command Center** — Chat with GPT-4o in natural language. The AI creates tasks, schedules events, drafts notes, and summarises your day automatically.
- **Smart Calendar** — Full calendar with Google Calendar sync. View today's events, upcoming meetings, join Google Meet calls directly.
- **Task Manager** — Priority-based task tracking (Urgent / High / Medium / Low). Filter, complete, delete tasks with one click.
- **Notes & Documents** — Rich notes with tags, pinning, and full-text search.
- **Integrations Hub** — Connect Google Calendar, Google Meet, Gmail, Slack, LinkedIn, Notion and more.
- **Activity Feed** — Real-time feed of everything happening across your planner.
- **Reports** — Productivity analytics (coming soon).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Neon (PostgreSQL) via Prisma v7 |
| AI | OpenAI GPT-4o |
| Calendar | Google Calendar API |
| Deployment | Vercel |

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/kevin21quirk/kqpersonalplanner.git
cd kqpersonalplanner
npm install
```

### 2. Set Environment Variables

Create a `.env.local` file (copy from `env.example`):

```bash
cp env.example .env.local
```

Edit `.env.local`:

```env
# Database (Neon.tech — already configured for this project)
DATABASE_URL="postgresql://..."

# OpenAI — get your key at https://platform.openai.com
OPENAI_API_KEY="sk-..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"

# Google OAuth — https://console.cloud.google.com
GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
```

### 3. Set up the Database

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo data will be seeded automatically on first load.

---

## Deployment to Vercel

1. Push to GitHub (already done)
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in the Vercel dashboard:
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Vercel URL)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

---

## Google Calendar Integration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable **Google Calendar API** and **Google Meet API**
3. Create OAuth 2.0 credentials (Web application)
4. Add redirect URI: `https://your-domain.com/api/integrations/google/callback`
5. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to your env

---

## Project Structure

```
app/
  api/
    ai/          ← GPT-4o chat + action execution
    tasks/       ← Task CRUD
    events/      ← Calendar event CRUD
    notes/       ← Notes CRUD
    dashboard/   ← Aggregated dashboard data
    integrations/
      google/    ← Google OAuth + Calendar sync
  page.tsx       ← Main dashboard (single-page app)
  layout.tsx
components/
  Sidebar.tsx
  Header.tsx
  AICommandCenter.tsx
  CalendarPanel.tsx
  TasksPanel.tsx
  NotesPanel.tsx
  StatsGrid.tsx
  ActivityFeed.tsx
  IntegrationsPanel.tsx
  QuickActions.tsx
lib/
  prisma.ts      ← Prisma client singleton
  openai.ts      ← OpenAI client + system prompt
  utils.ts       ← Utility functions
  seed.ts        ← Demo data seeder
prisma/
  schema.prisma  ← Database schema
```

---

Built with ❤️ for AI Bridge Solutions.
