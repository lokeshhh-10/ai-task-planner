import { useEffect, useState } from 'react'
import type { Task, TaskInput, TaskPriority, TaskStatus } from '../types'

const emptyForm: TaskInput = {
  title: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  due_date: null,
}

interface TaskFormProps {
  initial?: Task | null
  onSubmit: (payload: TaskInput) => Promise<void>
  onCancel: () => void
}

function toLocalInputValue(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromLocalInputValue(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const fieldClass =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-sea/40 focus:ring-2 focus:ring-sea/10'

export function TaskForm({ initial, onSubmit, onCancel }: TaskFormProps) {
  const [form, setForm] = useState<TaskInput>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title,
        description: initial.description,
        status: initial.status,
        priority: initial.priority,
        due_date: initial.due_date,
      })
    } else {
      setForm(emptyForm)
    }
  }, [initial])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.title.trim()) {
      setError('Title is required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSubmit({ ...form, title: form.title.trim(), description: form.description.trim() })
    } catch {
      setError('Could not save the task. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="fade-up space-y-4 rounded-2xl border border-line bg-white/85 p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-bold tracking-tight text-ink">
          {initial ? 'Edit task' : 'New task'}
        </h2>
        <button type="button" onClick={onCancel} className="text-sm text-ink-muted transition hover:text-ink">
          Cancel
        </button>
      </div>

      <label className="block space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">Title</span>
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className={fieldClass}
          placeholder="What needs doing?"
          autoFocus
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">Description</span>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          className={fieldClass}
          placeholder="Optional details"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">Status</span>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
            className={fieldClass}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">Priority</span>
          <select
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
            className={fieldClass}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">Due date</span>
          <input
            type="datetime-local"
            value={toLocalInputValue(form.due_date)}
            onChange={(e) => setForm((f) => ({ ...f, due_date: fromLocalInputValue(e.target.value) }))}
            className={fieldClass}
          />
        </label>
      </div>

      {error && <p className="text-sm text-coral">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-surface transition hover:bg-ink-soft disabled:opacity-60"
      >
        {saving ? 'Saving…' : initial ? 'Save changes' : 'Create task'}
      </button>
    </form>
  )
}
