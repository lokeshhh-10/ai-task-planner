import { Columns3, List, Search } from 'lucide-react'
import type { TaskPriority, TaskStatus } from '../types'

export type BoardView = 'list' | 'kanban'

interface TaskToolbarProps {
  view: BoardView
  onViewChange: (view: BoardView) => void
  statusFilter: TaskStatus | 'all'
  onStatusFilterChange: (value: TaskStatus | 'all') => void
  priorityFilter: TaskPriority | 'all'
  onPriorityFilterChange: (value: TaskPriority | 'all') => void
  query: string
  onQueryChange: (value: string) => void
}

export function TaskToolbar({
  view,
  onViewChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  query,
  onQueryChange,
}: TaskToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="inline-flex w-fit rounded-xl bg-ink/[0.04] p-1">
        <button
          type="button"
          onClick={() => onViewChange('list')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            view === 'list' ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <List size={15} />
          List
        </button>
        <button
          type="button"
          onClick={() => onViewChange('kanban')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            view === 'kanban' ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Columns3 size={15} />
          Kanban
        </button>
      </div>

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1 sm:w-56">
          <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink/35" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search tasks"
            className="w-full rounded-xl border border-line bg-white/80 py-2 pr-3 pl-9 text-sm outline-none transition placeholder:text-ink/35 focus:border-sea/40 focus:ring-2 focus:ring-sea/10"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as TaskStatus | 'all')}
          className="rounded-xl border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-sea/40"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => onPriorityFilterChange(e.target.value as TaskPriority | 'all')}
          className="rounded-xl border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-sea/40"
          aria-label="Filter by priority"
        >
          <option value="all">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
    </div>
  )
}
