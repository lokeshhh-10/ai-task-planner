import { useState } from 'react'
import { KANBAN_COLUMNS, statusLabels } from '../lib/taskStyles'
import type { Task, TaskStatus } from '../types'
import { TaskCard } from './TaskCard'

interface KanbanBoardProps {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>
}

export function KanbanBoard({ tasks, onEdit, onDelete, onStatusChange }: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null)

  async function handleDrop(status: TaskStatus) {
    const task = tasks.find((t) => t.id === draggingId)
    setOverColumn(null)
    setDraggingId(null)
    if (!task || task.status === status) return
    await onStatusChange(task, status)
  }

  return (
    <div className="grid h-full gap-3 md:grid-cols-3">
      {KANBAN_COLUMNS.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status)
        const isOver = overColumn === status

        return (
          <section
            key={status}
            onDragOver={(e) => {
              e.preventDefault()
              setOverColumn(status)
            }}
            onDragLeave={() => setOverColumn((current) => (current === status ? null : current))}
            onDrop={() => void handleDrop(status)}
            className={`flex min-h-0 flex-col rounded-2xl border p-3 transition ${
              isOver ? 'border-sea/40 bg-mint/25' : 'border-line/70 bg-white/40'
            }`}
          >
            <header className="mb-3 flex items-center justify-between px-1">
              <h3 className="font-display text-sm font-bold tracking-tight text-ink">
                {statusLabels[status]}
              </h3>
              <span className="rounded-md bg-ink/[0.05] px-2 py-0.5 text-[11px] font-bold text-ink-muted">
                {columnTasks.length}
              </span>
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5">
              {columnTasks.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line px-3 py-10 text-center text-xs text-ink/35">
                  Drop here
                </p>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    compact
                    draggable
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDragStart={(t) => setDraggingId(t.id)}
                  />
                ))
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
