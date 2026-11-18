# Tasks

## Purpose
Core task CRUD for AI Task Planner — create, read, update, delete, and filter tasks stored in MongoDB.

## Functional Overview
- Users can create tasks with title, description, status, priority, and optional due date.
- Users can list all tasks or filter by status/priority.
- Users can update any field and delete a task by id.
- Search supports free-text (title/description) and due-date day/range filters (used by the AI agent).

## Technical Overview
- FastAPI router under `/api/tasks`.
- Persistence via Motor (async MongoDB) collection `tasks`.
- Pydantic schemas validate create/update payloads (`whitelist`-style field models).
- Invalid ObjectIds return 400; missing tasks return 404.

## Key Files
- `backend/app/routers/tasks.py`
- `backend/app/services/task_service.py`
- `backend/app/schemas/task.py`

## Dependencies
- FastAPI, Motor/MongoDB, Pydantic

## Change Log
- 2026-11-18: Initial tasks module with CRUD + date/text search helpers.
