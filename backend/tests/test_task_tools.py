from datetime import datetime, timezone

import pytest

from app.database import set_client
from app.tools.task_tools import _parse_datetime, search_tasks_tool, update_task_tool
from mongomock_motor import AsyncMongoMockClient


@pytest.fixture(autouse=True)
def mock_db():
    set_client(AsyncMongoMockClient())
    yield
    set_client(None)


def test_parse_natural_date():
    parsed = _parse_datetime("19 November 2026")
    assert parsed is not None
    assert parsed.year == 2026
    assert parsed.month == 11
    assert parsed.day == 19


def test_parse_iso_date():
    parsed = _parse_datetime("2026-11-19T10:30:00Z")
    assert parsed is not None
    assert parsed.day == 19


@pytest.mark.anyio
async def test_search_tasks_tool_by_date():
    from app.schemas.task import TaskCreate
    from app.services import task_service

    await task_service.create_task(
        TaskCreate(
            title="Ship release",
            due_date=datetime(2026, 11, 19, 12, 0, tzinfo=timezone.utc),
        )
    )
    await task_service.create_task(
        TaskCreate(
            title="Other day",
            due_date=datetime(2026, 11, 21, 12, 0, tzinfo=timezone.utc),
        )
    )

    raw = await search_tasks_tool.ainvoke({"date": "19 November 2026"})
    import json

    payload = json.loads(raw)
    assert payload["ok"] is True
    assert payload["count"] == 1
    assert payload["tasks"][0]["title"] == "Ship release"


@pytest.mark.anyio
async def test_update_task_tool_by_title():
    import json

    from app.schemas.task import TaskCreate
    from app.services import task_service

    await task_service.create_task(TaskCreate(title="Fyd-2", description="old"))
    raw = await update_task_tool.ainvoke({"task": "Fyd-2", "title": "Ai-session"})
    payload = json.loads(raw)
    assert payload["ok"] is True
    assert payload["task"]["title"] == "Ai-session"


@pytest.mark.anyio
async def test_update_task_tool_unknown_title():
    import json

    raw = await update_task_tool.ainvoke({"task": "Missing", "title": "Nope"})
    payload = json.loads(raw)
    assert payload["ok"] is False
    assert "No task found" in payload["error"]
