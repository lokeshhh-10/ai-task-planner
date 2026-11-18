from typing import Optional

from fastapi import APIRouter, Query

from app.schemas.task import TaskCreate, TaskPriority, TaskResponse, TaskStatus, TaskUpdate
from app.services import task_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(payload: TaskCreate) -> dict:
    return await task_service.create_task(payload)


@router.get("", response_model=list[TaskResponse])
async def list_tasks(
    status: Optional[TaskStatus] = Query(default=None),
    priority: Optional[TaskPriority] = Query(default=None),
) -> list[dict]:
    return await task_service.list_tasks(status_filter=status, priority_filter=priority)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str) -> dict:
    return await task_service.get_task(task_id)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, payload: TaskUpdate) -> dict:
    return await task_service.update_task(task_id, payload)


@router.delete("/{task_id}")
async def delete_task(task_id: str) -> dict:
    return await task_service.delete_task(task_id)
