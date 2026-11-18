# Frontend

## Purpose
React UI for manual task management and AI chat against the FastAPI backend.

## Functional Overview
- Task list and Kanban board with create/edit form, complete toggle, and delete.
- Filters: search text, status, priority. View toggle: List / Kanban.
- Kanban supports drag-and-drop between Pending / In progress / Completed.
- AI assistant panel for natural-language CRUD and search (fixed viewport height, internal scroll).
- After AI actions, the task board refreshes from the API.

## Technical Overview
- Vite + React + TypeScript + Tailwind CSS v4 + Axios.
- Dev proxy: `/api` → `http://127.0.0.1:8000`.
- Components: `TaskList`, `TaskCard`, `KanbanBoard`, `TaskToolbar`, `TaskForm`, `ChatPanel`.
- Filtering helper: `lib/filterTasks.ts`.

## Key Files
- `frontend/src/App.tsx`
- `frontend/src/api/client.ts`
- `frontend/src/components/*`
- `frontend/src/lib/filterTasks.ts`

## Dependencies
- React, Vite, Tailwind, Axios, lucide-react, date-fns

## Change Log
- 2026-11-18: Full UI redesign — app shell, toggleable assistant drawer, composed chat empty state, Outfit/DM Sans theme.
- 2026-11-18: Kanban view, status/priority/search filters, fixed-height AI chat scroll.
- 2026-11-18: Chat task preview uses human-readable due dates; no ids shown.
- 2026-11-18: Initial task board + AI chat UI.
