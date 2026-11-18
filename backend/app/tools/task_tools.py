"""LangChain tools that wrap task CRUD/search for the AI agent."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import HTTPException
from langchain_core.tools import tool

from app.schemas.task import TaskCreate, TaskPriority, TaskStatus, TaskUpdate
from app.services import task_service


def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    cleaned = value.strip().replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(cleaned)
    except ValueError:
        for fmt in ("%Y-%m-%d", "%d %B %Y", "%B %d %Y", "%d/%m/%Y", "%m/%d/%Y"):
            try:
                parsed = datetime.strptime(value.strip(), fmt).replace(tzinfo=timezone.utc)
                break
            except ValueError:
                continue
        else:
            raise ValueError(
                f"Could not parse date '{value}'. Use ISO format like 2026-11-19 or '19 November 2026'."
            )
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def _end_of_day(value: datetime) -> datetime:
    return value.replace(hour=23, minute=59, second=59, microsecond=999999)


def _dumps(payload: Any) -> str:
    return json.dumps(payload, default=str)


def _tool_error(exc: Exception) -> str:
    if isinstance(exc, HTTPException):
        return _dumps({"ok": False, "error": exc.detail})
    return _dumps({"ok": False, "error": str(exc)})


@tool
async def create_task_tool(
    title: str,
    description: str = "",
    status: str = "pending",
    priority: str = "medium",
    due_date: Optional[str] = None,
) -> str:
    """Create a new task.

    Args:
        title: Short task title.
        description: Optional longer description.
        status: One of pending, in_progress, completed.
        priority: One of low, medium, high.
        due_date: Optional due date (ISO or natural date like '19 November 2026').
    """
    try:
        payload = TaskCreate(
            title=title,
            description=description or "",
            status=TaskStatus(status),
            priority=TaskPriority(priority),
            due_date=_parse_datetime(due_date),
        )
        task = await task_service.create_task(payload)
        return _dumps({"ok": True, "task": task})
    except Exception as exc:  # noqa: BLE001
        return _tool_error(exc)


@tool
async def list_tasks_tool(
    status: Optional[str] = None,
    priority: Optional[str] = None,
) -> str:
    """List tasks, optionally filtered by status or priority.

    Args:
        status: Optional filter: pending, in_progress, or completed.
        priority: Optional filter: low, medium, or high.
    """
    try:
        status_filter = TaskStatus(status) if status else None
        priority_filter = TaskPriority(priority) if priority else None
        tasks = await task_service.list_tasks(status_filter=status_filter, priority_filter=priority_filter)
        return _dumps({"ok": True, "count": len(tasks), "tasks": tasks})
    except Exception as exc:  # noqa: BLE001
        return _tool_error(exc)


@tool
async def update_task_tool(
    task: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    due_date: Optional[str] = None,
) -> str:
    """Update an existing task. Prefer the task title when the user names a task.

    Args:
        task: Task title (e.g. 'Fyd-2') or internal id.
        title: New title if renaming.
        description: New description if changing.
        status: New status if changing.
        priority: New priority if changing.
        due_date: New due date if changing (ISO or natural date).
    """
    try:
        existing = await task_service.resolve_task_ref(task)
        data: dict[str, Any] = {}
        if title is not None:
            data["title"] = title
        if description is not None:
            data["description"] = description
        if status is not None:
            data["status"] = TaskStatus(status)
        if priority is not None:
            data["priority"] = TaskPriority(priority)
        if due_date is not None:
            data["due_date"] = _parse_datetime(due_date)

        updated = await task_service.update_task(existing["id"], TaskUpdate(**data))
        return _dumps({"ok": True, "task": updated})
    except Exception as exc:  # noqa: BLE001
        return _tool_error(exc)


@tool
async def delete_task_tool(task: str) -> str:
    """Delete a task by title or id.

    Args:
        task: Task title (e.g. 'Fyd-2') or internal id.
    """
    try:
        existing = await task_service.resolve_task_ref(task)
        result = await task_service.delete_task(existing["id"])
        return _dumps({"ok": True, "title": existing["title"], **result})
    except Exception as exc:  # noqa: BLE001
        return _tool_error(exc)


@tool
async def search_tasks_tool(
    query_text: Optional[str] = None,
    date: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
) -> str:
    """Search tasks by text and/or due date range.

    Use `date` for a single calendar day (e.g. '19 November 2026' or '2026-11-19').
    Use date_from/date_to for ranges. Text search matches title and description.

    Args:
        query_text: Free-text search against title/description.
        date: Single day to match due_date.
        date_from: Start of due_date range (inclusive).
        date_to: End of due_date range (inclusive).
        status: Optional status filter.
        priority: Optional priority filter.
    """
    try:
        parsed_from = _parse_datetime(date_from)
        parsed_to = _parse_datetime(date_to)

        if date:
            day = _parse_datetime(date)
            if day is None:
                raise ValueError("Invalid date")
            start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            end = _end_of_day(day)
            parsed_from = start
            parsed_to = end
        elif parsed_to is not None:
            parsed_to = _end_of_day(parsed_to)

        tasks = await task_service.search_tasks(
            query_text=query_text,
            date_from=parsed_from,
            date_to=parsed_to,
            status_filter=status,
            priority_filter=priority,
        )
        return _dumps({"ok": True, "count": len(tasks), "tasks": tasks})
    except Exception as exc:  # noqa: BLE001
        return _tool_error(exc)


TASK_TOOLS = [
    create_task_tool,
    list_tasks_tool,
    update_task_tool,
    delete_task_tool,
    search_tasks_tool,
]
