import { describe, expect, it } from 'vitest'
import { filterTasks } from './filterTasks'
import type { Task } from '../types'

const sample: Task[] = [
  {
    id: '1',
    title: 'Write docs',
    description: 'API overview',
    status: 'pending',
    priority: 'high',
    due_date: null,
    created_at: '',
    updated_at: '',
  },
  {
    id: '2',
    title: 'Ship release',
    description: 'tag v1',
    status: 'in_progress',
    priority: 'medium',
    due_date: null,
    created_at: '',
    updated_at: '',
  },
  {
    id: '3',
    title: 'Cleanup',
    description: 'old notes',
    status: 'completed',
    priority: 'low',
    due_date: null,
    created_at: '',
    updated_at: '',
  },
]

describe('filterTasks', () => {
  it('returns all tasks when filters are open', () => {
    expect(
      filterTasks(sample, { statusFilter: 'all', priorityFilter: 'all', query: '' }),
    ).toHaveLength(3)
  })

  it('filters by status and priority', () => {
    const result = filterTasks(sample, {
      statusFilter: 'pending',
      priorityFilter: 'high',
      query: '',
    })
    expect(result.map((t) => t.id)).toEqual(['1'])
  })

  it('searches title and description', () => {
    const byTitle = filterTasks(sample, {
      statusFilter: 'all',
      priorityFilter: 'all',
      query: 'ship',
    })
    const byDescription = filterTasks(sample, {
      statusFilter: 'all',
      priorityFilter: 'all',
      query: 'overview',
    })
    expect(byTitle.map((t) => t.id)).toEqual(['2'])
    expect(byDescription.map((t) => t.id)).toEqual(['1'])
  })
})
