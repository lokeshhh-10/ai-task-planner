import type { Task, TaskPriority, TaskStatus } from '../types'

export function filterTasks(
  tasks: Task[],
  options: {
    statusFilter: TaskStatus | 'all'
    priorityFilter: TaskPriority | 'all'
    query: string
  },
): Task[] {
  const needle = options.query.trim().toLowerCase()
  return tasks.filter((task) => {
    if (options.statusFilter !== 'all' && task.status !== options.statusFilter) return false
    if (options.priorityFilter !== 'all' && task.priority !== options.priorityFilter) return false
    if (!needle) return true
    return (
      task.title.toLowerCase().includes(needle) ||
      task.description.toLowerCase().includes(needle)
    )
  })
}
