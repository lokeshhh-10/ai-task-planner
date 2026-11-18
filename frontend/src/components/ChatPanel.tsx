import { useEffect, useRef, useState, type FormEvent } from 'react'
import { format, parseISO } from 'date-fns'
import { SendHorizontal, Sparkles, X } from 'lucide-react'
import { sendChat } from '../api/client'
import type { ChatMessage, Task } from '../types'

interface ChatPanelProps {
  onTasksMutated: () => Promise<void>
  onClose?: () => void
}

const suggestions = [
  'Show tasks due on 19 November',
  'Create a high-priority review task for tomorrow',
  'List all pending tasks',
]

export function ChatPanel({ onTasksMutated, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'I can create, update, delete, or find tasks in plain English.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isFresh = messages.length <= 1 && !loading

  useEffect(() => {
    const el = scrollRef.current
    if (!el || isFresh) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, loading, isFresh])

  async function handleSend(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: trimmed },
    ])
    setInput('')
    setLoading(true)

    try {
      const result = await sendChat(trimmed)
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.reply,
          tasks: result.tasks,
        },
      ])
      await onTasksMutated()
    } catch (err: unknown) {
      const detail =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ===
          'string'
          ? (err as { response: { data: { detail: string } } }).response.data.detail
          : 'Something went wrong talking to the AI.'
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: detail },
      ])
    } finally {
      setLoading(false)
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    void handleSend(input)
  }

  return (
    <aside className="slide-in-right flex h-full min-h-0 flex-col overflow-x-hidden overflow-y-hidden border-l border-white/8 bg-panel text-surface surface-noise">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/8 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber/15 text-amber">
              <Sparkles size={14} />
            </span>
            <h2 className="font-display text-base font-bold tracking-tight text-white">Assistant</h2>
          </div>
          <p className="mt-1 text-xs text-mint/55">Groq-powered task commands</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-mint/50 transition hover:bg-white/8 hover:text-white"
            aria-label="Close assistant"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-4">
        {isFresh ? (
          <div className="fade-in flex h-full min-h-[16rem] flex-col justify-center gap-5 px-1">
            <div>
              <p className="font-display text-xl font-bold tracking-tight text-white">
                What should we tackle?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-mint/55">
                Ask in natural language — I’ll search the board and make changes for you.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void handleSend(suggestion)}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-left text-sm text-mint/80 transition hover:border-amber/35 hover:bg-white/[0.06] hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`fade-in max-w-[94%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'ml-auto bg-sea text-white'
                    : 'bg-panel-lift text-mint/90'
                }`}
              >
                <p className="break-words whitespace-pre-wrap">{message.content}</p>
                {message.tasks && message.tasks.length > 0 && <TaskPreview tasks={message.tasks} />}
              </div>
            ))}
            {loading && (
              <div className="fade-in w-fit rounded-2xl bg-panel-lift px-3.5 py-2.5 text-sm text-mint/50">
                Thinking…
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/8 px-4 py-4">
        {!isFresh && (
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void handleSend(suggestion)}
                className="max-w-full rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-left text-[11px] leading-snug text-mint/60 transition hover:border-amber/35 hover:text-mint"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your tasks…"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-mint/35 focus:border-amber/40"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-amber px-3.5 text-ink transition hover:bg-amber-deep disabled:opacity-45"
            aria-label="Send"
          >
            <SendHorizontal size={17} />
          </button>
        </form>
      </div>
    </aside>
  )
}

function formatDueLabel(value: string | null): string | null {
  if (!value) return null
  try {
    return format(parseISO(value), 'd MMM yyyy · h:mm a')
  } catch {
    return value
  }
}

function TaskPreview({ tasks }: { tasks: Task[] }) {
  return (
    <ul className="mt-2 space-y-2 border-t border-white/10 pt-2">
      {tasks.slice(0, 5).map((task) => {
        const due = formatDueLabel(task.due_date)
        return (
          <li key={task.id} className="rounded-lg bg-black/25 px-2.5 py-2 text-xs text-mint/75">
            <p className="font-semibold text-white">{task.title}</p>
            <p className="mt-0.5 text-mint/45">
              {task.status.replace('_', ' ')} · {task.priority}
              {due ? ` · ${due}` : ''}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
