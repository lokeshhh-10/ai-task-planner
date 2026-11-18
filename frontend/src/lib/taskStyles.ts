import type { TaskPriority, TaskStatus } from '../types'

export const priorityStyles: Record<TaskPriority, string> = {
  low: 'bg-sea/10 text-sea',
  medium: 'bg-amber/15 text-amber-deep',
  high: 'bg-coral/15 text-coral',
}

export const statusLabels: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
}

export const KANBAN_COLUMNS: TaskStatus[] = ['pending', 'in_progress', 'completed']
