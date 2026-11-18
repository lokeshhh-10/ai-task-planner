import axios from 'axios'
import type { Task, TaskInput } from '../types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export async function fetchTasks(): Promise<Task[]> {
  const { data } = await api.get<Task[]>('/tasks')
  return data
}

export async function createTask(payload: TaskInput): Promise<Task> {
  const { data } = await api.post<Task>('/tasks', payload)
  return data
}

export async function updateTask(id: string, payload: Partial<TaskInput>): Promise<Task> {
  const { data } = await api.put<Task>(`/tasks/${id}`, payload)
  return data
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`)
}

export async function sendChat(message: string): Promise<{ reply: string; tasks?: Task[] }> {
  const { data } = await api.post<{ reply: string; tasks?: Task[] }>('/chat', { message })
  return data
}
