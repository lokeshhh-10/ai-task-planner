from datetime import datetime, timezone

import pytest


@pytest.mark.anyio
async def test_create_list_update_delete_task(client):
    create_resp = await client.post(
        "/api/tasks",
        json={
            "title": "Prepare demo",
            "description": "Walkthrough for AI Task Planner",
            "priority": "high",
            "due_date": "2026-11-19T10:00:00Z",
        },
    )
    assert create_resp.status_code == 201
    task = create_resp.json()
    assert task["title"] == "Prepare demo"
    assert task["priority"] == "high"
    assert task["id"]

    list_resp = await client.get("/api/tasks")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1

    update_resp = await client.put(
        f"/api/tasks/{task['id']}",
        json={"status": "in_progress", "title": "Prepare live demo"},
    )
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["status"] == "in_progress"
    assert updated["title"] == "Prepare live demo"

    get_resp = await client.get(f"/api/tasks/{task['id']}")
    assert get_resp.status_code == 200
    assert get_resp.json()["title"] == "Prepare live demo"

    delete_resp = await client.delete(f"/api/tasks/{task['id']}")
    assert delete_resp.status_code == 200
    assert delete_resp.json()["id"] == task["id"]

    empty = await client.get("/api/tasks")
    assert empty.json() == []


@pytest.mark.anyio
async def test_invalid_task_id(client):
    resp = await client.get("/api/tasks/not-an-object-id")
    assert resp.status_code == 400


@pytest.mark.anyio
async def test_search_by_due_date_day(client):
    await client.post(
        "/api/tasks",
        json={
            "title": "Nov 19 meeting",
            "due_date": "2026-11-19T15:00:00Z",
        },
    )
    await client.post(
        "/api/tasks",
        json={
            "title": "Nov 20 follow-up",
            "due_date": "2026-11-20T15:00:00Z",
        },
    )

    from app.services.task_service import search_tasks

    day_start = datetime(2026, 11, 19, 0, 0, 0, tzinfo=timezone.utc)
    day_end = datetime(2026, 11, 19, 23, 59, 59, 999999, tzinfo=timezone.utc)
    results = await search_tasks(date_from=day_start, date_to=day_end)
    assert len(results) == 1
    assert results[0]["title"] == "Nov 19 meeting"


@pytest.mark.anyio
async def test_health(client):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
