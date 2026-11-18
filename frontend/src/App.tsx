import { useCallback, useEffect, useMemo, useState } from 'react'
import { MessageSquare, Plus } from 'lucide-react'
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from './api/client'
import { ChatPanel } from './components/ChatPanel'
import { KanbanBoard } from './components/KanbanBoard'
import { TaskForm } from './components/TaskForm'
import { TaskList } from './components/TaskList'
import { TaskToolbar, type BoardView } from './components/TaskToolbar'
import { filterTasks } from './lib/filterTasks'
import type { Task, TaskInput, TaskPriority, TaskStatus } from './types'

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [view, setView] = useState<BoardView>('list')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all')
  const [query, setQuery] = useState('')
  const [chatOpen, setChatOpen] = useState(true)

  const loadTasks = useCallback(async () => {
    try {
      const data = await fetchTasks()
      setTasks(data)
      setError('')
    } catch {
      setError('Could not load tasks. Is the API running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setChatOpen(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const filteredTasks = useMemo(
    () => filterTasks(tasks, { statusFilter, priorityFilter, query }),
    [tasks, statusFilter, priorityFilter, query],
  )

  async function handleCreate(payload: TaskInput) {
    await createTask(payload)
    setShowForm(false)
    await loadTasks()
  }

  async function handleUpdate(payload: TaskInput) {
    if (!editing) return
    await updateTask(editing.id, payload)
    setEditing(null)
    await loadTasks()
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Delete “${task.title}”?`)) return
    await deleteTask(task.id)
    await loadTasks()
  }

  async function handleToggleComplete(task: Task) {
    const next = task.status === 'completed' ? 'pending' : 'completed'
    await updateTask(task.id, { status: next })
    await loadTasks()
  }

  async function handleStatusChange(task: Task, status: TaskStatus) {
    await updateTask(task.id, { status })
    await loadTasks()
  }

  function startEdit(task: Task) {
    setShowForm(false)
    setEditing(task)
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="fade-in shrink-0 border-b border-line/80 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-panel text-amber">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path
                    d="M3.5 8.2L6.2 10.9L12.5 4.6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="min-w-0">
                <h1 className="font-display text-lg font-extrabold tracking-tight text-ink sm:text-xl">
                  AI Task Planner
                </h1>
                <p className="truncate text-xs text-ink-muted sm:text-sm">
                  Plan by hand or talk to the assistant
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!showForm && !editing && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sea px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-sea-bright"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">New task</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setChatOpen((open) => !open)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
                chatOpen
                  ? 'border-ink/15 bg-ink text-surface'
                  : 'border-line bg-white/70 text-ink hover:border-ink/20'
              }`}
              aria-pressed={chatOpen}
            >
              <MessageSquare size={15} />
              <span className="hidden sm:inline">Assistant</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 overflow-hidden">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 space-y-4 px-4 pt-5 pb-4 sm:px-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Tasks</h2>
                <p className="mt-0.5 text-sm text-ink-muted">
                  Showing {filteredTasks.length}
                  {filteredTasks.length !== tasks.length ? ` of ${tasks.length}` : ''}
                </p>
              </div>
            </div>

            <TaskToolbar
              view={view}
              onViewChange={setView}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              priorityFilter={priorityFilter}
              onPriorityFilterChange={setPriorityFilter}
              query={query}
              onQueryChange={setQuery}
            />

            {(showForm || editing) && (
              <TaskForm
                initial={editing}
                onSubmit={editing ? handleUpdate : handleCreate}
                onCancel={() => {
                  setShowForm(false)
                  setEditing(null)
                }}
              />
            )}

            {error && (
              <p className="rounded-xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm text-coral">
                {error}
              </p>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
            {loading ? (
              <p className="text-sm text-ink-muted">Loading tasks…</p>
            ) : view === 'list' ? (
              <TaskList
                tasks={filteredTasks}
                onEdit={startEdit}
                onDelete={handleDelete}
                onToggleComplete={handleToggleComplete}
              />
            ) : (
              <div className="h-full min-h-[22rem]">
                <KanbanBoard
                  tasks={filteredTasks}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              </div>
            )}
          </div>
        </main>

        {chatOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-[2px] lg:hidden"
              aria-label="Close assistant overlay"
              onClick={() => setChatOpen(false)}
            />
            <div className="fixed inset-y-0 right-0 z-40 w-[min(100%,24rem)] shadow-[0_0_40px_rgba(18,35,31,0.25)] lg:static lg:z-auto lg:w-[22.5rem] lg:shrink-0 lg:shadow-none xl:w-[24rem]">
              <ChatPanel onTasksMutated={loadTasks} onClose={() => setChatOpen(false)} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
