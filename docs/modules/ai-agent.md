# AI Agent

## Purpose
Natural-language interface for task management using LangChain tools and the Groq LLM API.

## Functional Overview
- User sends a chat message (e.g. “Show the tasks listed on 19 November”).
- Agent selects tools: create, list, update, delete, or search.
- Search can target a single calendar day via the `date` tool argument.
- Response includes a natural-language reply and any tasks returned by tools.

## Technical Overview
- Endpoint: `POST /api/chat` with `{ "message": "..." }`.
- `langgraph.prebuilt.create_react_agent` + `ChatGroq`.
- Tools in `backend/app/tools/task_tools.py` call `task_service`.
- Requires `GROQ_API_KEY` in environment; returns 503 if missing.

## Key Files
- `backend/app/services/ai_agent.py`
- `backend/app/tools/task_tools.py`
- `backend/app/routers/chat.py`
- `backend/app/schemas/chat.py`

## Dependencies
- LangChain, LangGraph, langchain-groq, Groq API, task_service

## Change Log
- 2026-11-18: Update/delete resolve tasks by title (e.g. Fyd-2), not only Mongo ids; tool errors returned as JSON.
- 2026-11-18: Human-readable task replies (no ids/tables); keep ids internal for update/delete tools only.
- 2026-11-18: Initial Groq React agent with full task CRUD/search tools.
