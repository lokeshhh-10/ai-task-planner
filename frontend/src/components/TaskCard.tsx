import { format, parseISO } from 'date-fns'
import { CheckCircle2, Circle, Clock3, Pencil, Trash2 } from 'lucide-react'
import { priorityStyles, statusLabels } from '../lib/taskStyles'
import type { Task, TaskStatus } from '../types'

interface TaskCardProps {
  task: Task
  compact?: boolean
  draggable?: boolean
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onToggleComplete?: (task: Task) => void
  onDragStart?: (task: Task) => void
}

const statusIcon: Record<TaskStatus, typeof Circle> = {
  pending: Circle,
  in_progress: Clock3,
  completed: CheckCircle2,
}

function formatDue(value: string | null): string {
  if (!value) return 'No due date'
  try {
    return format(parseISO(value), 'd MMM yyyy · h:mm a')
  } catch {
    return value
  }
}

export function TaskCard({
  task,
  compact = false,
  draggable = false,
  onEdit,
  onDelete,
  onToggleComplete,
  onDragStart,
}: TaskCardProps) {
  const Icon = statusIcon[task.status]

  return (
    <article
      draggable={draggable}
      onDragStart={() => onDragStart?.(task)}
      className={`group flex gap-3 border border-line/80 bg-surface/90 transition duration-200 hover:-translate-y-0.5 hover:border-sea/30 hover:bg-white ${
        compact ? 'rounded-xl p-3' : 'rounded-2xl p-4'
      } ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {onToggleComplete && (
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          className="mt-0.5 shrink-0 text-sea transition hover:scale-105"
          aria-label={task.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
        >
          <Icon size={compact ? 18 : 20} className={task.status === 'completed' ? 'text-sea' : 'text-ink/30'} />
        </button>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={`font-semibold tracking-tight ${compact ? 'text-sm' : 'text-[15px]'} ${
              task.status === 'completed' ? 'text-ink-muted line-through' : 'text-ink'
            }`}
          >
            {task.title}
          </h3>
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] ${priorityStyles[task.priority]}`}
          >
            {task.priority}
          </span>
          {!compact && (
            <span className="rounded-md bg-ink/[0.04] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
              {statusLabels[task.status]}
            </span>
          )}
        </div>
        {task.description && (
          <p className={`mt-1 leading-relaxed text-ink-muted ${compact ? 'line-clamp-2 text-xs' : 'text-sm'}`}>
            {task.description}
          </p>
        )}
        <p className={`mt-2 font-medium text-ink/35 ${compact ? 'text-[11px]' : 'text-xs'}`}>
          {formatDue(task.due_date)}
        </p>
      </div>

      <div className="flex shrink-0 items-start gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded-lg p-1.5 text-ink/45 transition hover:bg-mint/40 hover:text-ink"
          aria-label="Edit task"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          className="rounded-lg p-1.5 text-ink/45 transition hover:bg-coral/10 hover:text-coral"
          aria-label="Delete task"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </article>
  )
}
