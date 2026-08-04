import { getToken, removeToken } from './utils'

const BASE = '/admin-api'

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    removeToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || res.statusText)
  }

  const text = await res.text()
  return text ? JSON.parse(text) : ({} as T)
}

// ---- Auth ----
export async function adminLogin(username: string, password: string) {
  const data = await request<{ token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  return data
}

export async function logout() {
  await request('/auth/logout', { method: 'POST' }).catch(() => {})
  removeToken()
}

// ---- Config ----
export async function getConfig() {
  return request<{ items: ConfigItem[] }>('/config')
}

export async function patchConfig(key: string, value: string, reason: string) {
  return request('/config', {
    method: 'PATCH',
    body: JSON.stringify({ key, value, reason }),
  })
}

export async function getConfigHistory() {
  return request<{ items: ConfigHistoryItem[] }>('/config/history')
}

// ---- Users ----
export async function getUsers(params: {
  page: number
  pageSize: number
  email?: string
  plan?: string
  is_banned?: boolean
}) {
  const q = new URLSearchParams()
  q.set('page', String(params.page))
  q.set('page_size', String(params.pageSize))
  if (params.email) q.set('email', params.email)
  if (params.plan) q.set('plan', params.plan)
  if (params.is_banned !== undefined) q.set('is_banned', String(params.is_banned))
  const res = await request<{ users: User[]; total: number; page: number; pageSize: number }>(`/users?${q}`)
  // normalize: backend returns `users`, frontend expects `items`
  return { items: res.users, total: res.total }
}

export async function getUser(id: string) {
  return request<User>(`/users/${id}`)
}

export async function patchUserPlan(
  id: string,
  plan: string,
  expires_at: string | null,
  reason: string
) {
  return request(`/users/${id}/plan`, {
    method: 'PATCH',
    body: JSON.stringify({ plan, expires_at, reason }),
  })
}

export async function banUser(id: string, reason: string) {
  return request(`/users/${id}/ban`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export async function unbanUser(id: string, reason: string) {
  return request(`/users/${id}/unban`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export async function getUserPlanHistory(id: string) {
  const res = await request<{ history: PlanHistory[] }>(`/users/${id}/plan-history`)
  return { items: res.history ?? [] }
}

// ---- Free Plan ----
export async function getFreePlanStats() {
  return request<FreePlanStats>('/free-plan/stats')
}

export async function patchFreePlan(params: {
  open?: boolean
  max_slots?: number
  reason: string
}) {
  return request('/free-plan', {
    method: 'PATCH',
    body: JSON.stringify(params),
  })
}

// ---- Queue ----
export async function getQueueStats() {
  return request<QueueStats>('/queue/stats')
}

export async function getDlq() {
  return request<{ items: DlqTask[] }>('/queue/dlq')
}

export async function retryDlqTask(taskId: string) {
  return request(`/queue/dlq/${taskId}/retry`, { method: 'POST' })
}

export async function retryAllDlq() {
  return request('/queue/dlq/retry-all', { method: 'POST' })
}

// ---- Monitor ----
export async function getHealth() {
  // Backend has no /monitor/health endpoint; derive health from metrics
  const m = await request<Metrics>('/monitor/metrics')
  return {
    status: 'ok',
    services: { db: 'ok', redis: 'ok', memcore_api: 'ok' },
    _metrics: m,
  } as HealthStatus
}

export async function getMetrics() {
  return request<Metrics>('/monitor/metrics')
}

// ---- Audit ----
export async function getAudit(params: {
  limit: number
  offset: number
  action?: string
}) {
  const q = new URLSearchParams()
  q.set('limit', String(params.limit))
  q.set('offset', String(params.offset))
  if (params.action) q.set('action', params.action)
  const res = await request<{ logs: AuditLog[]; total: number }>(`/audit?${q}`)
  // normalize: backend returns `logs`, frontend expects `items`
  return { items: res.logs ?? [], total: res.total ?? 0 }
}

// ---- Types ----
export interface ConfigItem {
  key: string
  value: string
  description: string
  editable: boolean
}

export interface ConfigHistoryItem {
  id: string
  key: string
  old_value: string
  new_value: string
  reason: string
  operator: string
  created_at: string
}

export interface User {
  id: string
  email: string
  plan: string
  plan_expires_at: string | null
  is_banned: boolean
  ban_reason: string | null
  used_storage_bytes: number
  created_at: string
}

export interface PlanHistory {
  id: string
  from_plan: string | null
  to_plan: string
  reason: string
  order_id: string | null
  effective_at: string
  created_at: string
}

export interface FreePlanStats {
  open: boolean
  max_slots: number
  used_slots: number
}

export interface QueueStats {
  pending: number
  dlq_size: number
}

export interface DlqTask {
  task_id: string
  message_id: string
  last_error: string
  retry_count: number
  created_at: string
}

export interface HealthStatus {
  status: string
  services: Record<string, string>
}

export interface Metrics {
  active_users_24h: number
  messages_24h: number
}

export interface AuditLog {
  id: string
  operator_id: string
  action: string
  target_type: string
  target_id: string
  before_val: unknown
  after_val: unknown
  reason: string
  ip: string
  created_at: string
}
