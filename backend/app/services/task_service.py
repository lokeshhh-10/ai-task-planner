import re
from datetime import datetime, timezone
from typing import Any, Optional

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo import ReturnDocument

from app.database import get_database
from app.schemas.task import TaskCreate, TaskPriority, TaskStatus, TaskUpdate


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


async def resolve_task_ref(task_ref: str) -> dict[str, Any]:
    """Resolve a task by MongoDB id or by title (exact, then case-insensitive)."""
    ref = task_ref.strip()
    if not ref:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Task reference is required")

    if ObjectId.is_valid(ref):
        return await get_task(ref)

    db = get_database()
    exact = await db.tasks.find_one({"title": ref})
    if exact:
        return serialize_task(exact)

    pattern = re.escape(ref)
    matches = [
        serialize_task(doc)
        async for doc in db.tasks.find({"title": {"$regex": f"^{pattern}$", "$options": "i"}})
    ]
    if len(matches) == 1:
        return matches[0]
    if len(matches) > 1:
        titles = ", ".join(task["title"] for task in matches[:5])
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Multiple tasks match '{ref}': {titles}. Be more specific.",
        )

    partial = [
        serialize_task(doc)
        async for doc in db.tasks.find({"title": {"$regex": pattern, "$options": "i"}}).limit(5)
    ]
    if len(partial) == 1:
        return partial[0]
    if len(partial) > 1:
        titles = ", ".join(task["title"] for task in partial)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Multiple tasks match '{ref}': {titles}. Be more specific.",
        )

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"No task found matching '{ref}'")


def serialize_task(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "title": doc["title"],
        "description": doc.get("description", ""),
        "status": doc.get("status", TaskStatus.pending.value),
        "priority": doc.get("priority", TaskPriority.medium.value),
        "due_date": doc.get("due_date"),
        "created_at": doc["created_at"],
        "updated_at": doc["updated_at"],
    }


async def create_task(payload: TaskCreate) -> dict[str, Any]:
    db = get_database()
    now = _utc_now()
    document = {
        "title": payload.title.strip(),
        "description": payload.description.strip(),
        "status": payload.status.value,
        "priority": payload.priority.value,
        "due_date": payload.due_date,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.tasks.insert_one(document)
    document["_id"] = result.inserted_id
    return serialize_task(document)


async def list_tasks(
    status_filter: Optional[TaskStatus] = None,
    priority_filter: Optional[TaskPriority] = None,
) -> list[dict[str, Any]]:
    db = get_database()
    query: dict[str, Any] = {}
    if status_filter:
        query["status"] = status_filter.value
    if priority_filter:
        query["priority"] = priority_filter.value

    cursor = db.tasks.find(query).sort("created_at", -1)
    return [serialize_task(doc) async for doc in cursor]


async def get_task(task_id: str) -> dict[str, Any]:
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task id")

    db = get_database()
    doc = await db.tasks.find_one({"_id": ObjectId(task_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return serialize_task(doc)


async def update_task(task_id: str, payload: TaskUpdate) -> dict[str, Any]:
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task id")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    if "title" in updates and updates["title"] is not None:
        updates["title"] = updates["title"].strip()
    if "description" in updates and updates["description"] is not None:
        updates["description"] = updates["description"].strip()
    if "status" in updates and updates["status"] is not None:
        updates["status"] = updates["status"].value if hasattr(updates["status"], "value") else updates["status"]
    if "priority" in updates and updates["priority"] is not None:
        updates["priority"] = (
            updates["priority"].value if hasattr(updates["priority"], "value") else updates["priority"]
        )

    updates["updated_at"] = _utc_now()

    db = get_database()
    result = await db.tasks.find_one_and_update(
        {"_id": ObjectId(task_id)},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return serialize_task(result)


async def delete_task(task_id: str) -> dict[str, str]:
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task id")

    db = get_database()
    result = await db.tasks.delete_one({"_id": ObjectId(task_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return {"message": "Task deleted", "id": task_id}


async def search_tasks(
    query_text: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
) -> list[dict[str, Any]]:
    db = get_database()
    query: dict[str, Any] = {}

    if query_text:
        query["$or"] = [
            {"title": {"$regex": query_text, "$options": "i"}},
            {"description": {"$regex": query_text, "$options": "i"}},
        ]

    if status_filter:
        query["status"] = status_filter

    if priority_filter:
        query["priority"] = priority_filter

    date_clause: dict[str, Any] = {}
    if date_from is not None:
        date_clause["$gte"] = date_from
    if date_to is not None:
        date_clause["$lte"] = date_to
    if date_clause:
        query["due_date"] = date_clause

    cursor = db.tasks.find(query).sort("due_date", 1)
    return [serialize_task(doc) async for doc in cursor]
