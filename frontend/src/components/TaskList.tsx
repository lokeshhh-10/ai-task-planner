import type { Task } from '../types'
import { TaskCard } from './TaskCard'

interface TaskListProps {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onToggleComplete: (task: Task) => void
}

export function TaskList({ tasks, onEdit, onDelete, onToggleComplete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="fade-in flex h-full min-h-[14rem] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/30 px-6 text-center">
        <p className="font-display text-lg font-bold text-ink/70">Nothing here yet</p>
        <p className="mt-1 max-w-sm text-sm text-ink-muted">
          Create a task or ask the assistant — filters may also be hiding results.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-2.5">
      {tasks.map((task, index) => (
        <li key={task.id} className="fade-up" style={{ animationDelay: `${index * 35}ms` }}>
          <TaskCard
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleComplete={onToggleComplete}
          />
        </li>
      ))}
    </ul>
  )
}
