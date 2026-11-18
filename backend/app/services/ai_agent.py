"""Groq-powered LangChain agent for natural-language task management."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent

from app.config import get_settings
from app.tools.task_tools import TASK_TOOLS

SYSTEM_PROMPT = """You are the AI assistant for AI Task Planner.

You help users manage tasks using tools. You can create, list, update, delete, and search tasks.

Rules:
- Always use tools for data changes and lookups. Do not invent task data.
- When the user asks about tasks on a specific day (e.g. "19 November"), call search_tasks_tool with the `date` argument.
- Today's date is {today}. Resolve relative phrases like "today", "tomorrow", and bare day/month against this year when needed.
- Write for a human reader — clear, friendly, and easy to scan. Never show database ids.
- When presenting tasks, do NOT use tables or raw field dumps. Structure each task like this:

  **1. Task title**
  Status: … · Priority: …
  Due: … (friendly date, e.g. 19 November 2026, 6:40 AM)
  Notes: … (only if a description exists)

- Start with a short intro (e.g. "Here's what you have on 19 November:"), then the structured list, then one brief follow-up offer.
- Users usually name tasks by title (e.g. "edit Fyd-2 to Ai-session"). For update/delete, pass that title in the `task` argument — do not invent database ids.
- Never mention database ids in the reply.
- If a tool returns ok=false, explain the error clearly and ask for clarification if needed.
"""


def _extract_tasks_from_messages(messages: list[Any]) -> list[dict[str, Any]]:
    tasks: list[dict[str, Any]] = []
    seen: set[str] = set()

    for message in messages:
        if not isinstance(message, ToolMessage):
            continue
        content = message.content
        if not isinstance(content, str):
            continue
        try:
            payload = json.loads(content)
        except json.JSONDecodeError:
            continue
        for task in payload.get("tasks") or ([] if "task" not in payload else [payload["task"]]):
            task_id = str(task.get("id", ""))
            if task_id and task_id not in seen:
                seen.add(task_id)
                tasks.append(task)
    return tasks


def _final_text(messages: list[Any]) -> str:
    for message in reversed(messages):
        if isinstance(message, AIMessage) and message.content and not message.tool_calls:
            if isinstance(message.content, str):
                return message.content.strip()
            if isinstance(message.content, list):
                parts = []
                for block in message.content:
                    if isinstance(block, dict) and block.get("type") == "text":
                        parts.append(block.get("text", ""))
                    elif isinstance(block, str):
                        parts.append(block)
                text = "\n".join(p for p in parts if p).strip()
                if text:
                    return text
    return "Done."


async def run_agent(user_message: str) -> dict[str, Any]:
    get_settings.cache_clear()
    settings = get_settings()
    if not settings.groq_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GROQ_API_KEY is not configured. Add it to backend/.env to enable AI chat.",
        )

    llm = ChatGroq(
        api_key=settings.groq_api_key,
        model=settings.groq_model,
        temperature=0,
    )
    agent = create_react_agent(llm, TASK_TOOLS)

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d (%A)")
    system = SYSTEM_PROMPT.format(today=today)

    try:
        result = await agent.ainvoke(
            {
                "messages": [
                    SystemMessage(content=system),
                    HumanMessage(content=user_message.strip()),
                ]
            },
            config={"recursion_limit": 25},
        )
    except Exception as exc:  # noqa: BLE001 - surface provider/runtime failures cleanly
        detail = str(exc)
        # Avoid leaking long provider stack traces to clients
        detail = re.sub(r"\s+", " ", detail)[:400]
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider error: {detail}",
        ) from exc

    messages = result.get("messages", [])
    return {
        "reply": _final_text(messages),
        "tasks": _extract_tasks_from_messages(messages) or None,
    }
