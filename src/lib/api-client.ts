// Typed API client — العقد بين الواجهة والخادم
// DO NOT REWRITE — owned by main agent
import type {
  AgentResult,
  IdeaAnalysis,
  ProjectDTO,
  ProjectSchema,
  ProjectStatus,
  ProjectSummaryDTO,
  UserDTO,
  ValidateResult,
  VersionDTO,
} from './types'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  })
  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

// ===== Auth =====
export function getMe(): Promise<{ user: UserDTO | null }> {
  return request<{ user: UserDTO | null }>('/api/auth/me')
}

export function login(email: string, password: string): Promise<{ user: UserDTO }> {
  return request<{ user: UserDTO }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function signup(payload: { name: string; email: string; password: string }): Promise<{ user: UserDTO }> {
  return request<{ user: UserDTO }>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function demoLogin(): Promise<{ user: UserDTO }> {
  return request<{ user: UserDTO }>('/api/auth/demo', { method: 'POST' })
}

export function logout(): Promise<{ ok: true }> {
  return request<{ ok: true }>('/api/auth/logout', { method: 'POST' })
}

export function completeOnboarding(payload: {
  name?: string
  projectType?: string
  idea?: string
  style?: string
}): Promise<{ user: UserDTO }> {
  return request<{ user: UserDTO }>('/api/auth/complete-onboarding', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProfile(payload: { name?: string; idea?: string; style?: string }): Promise<{ user: UserDTO }> {
  return request<{ user: UserDTO }>('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

// ===== Analyze =====
export function analyzeIdea(idea: string): Promise<{ analysis: IdeaAnalysis }> {
  return request<{ analysis: IdeaAnalysis }>('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ idea }),
  })
}

// ===== Projects =====
export function listProjects(): Promise<{ projects: ProjectSummaryDTO[] }> {
  return request<{ projects: ProjectSummaryDTO[] }>('/api/projects')
}

export function getProject(id: string): Promise<{ project: ProjectDTO }> {
  return request<{ project: ProjectDTO }>(`/api/projects/${id}`)
}

export function createProject(payload: {
  idea: string
  analysis?: IdeaAnalysis | null
  name?: string
  type?: string
  style?: string
  audience?: string
  palette?: { primary: string; secondary: string; accent: string } | null
  templateId?: string
}): Promise<{ project: ProjectDTO }> {
  return request<{ project: ProjectDTO }>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function saveProject(
  id: string,
  payload: { schema: ProjectSchema; name?: string; status?: ProjectStatus; versionLabel?: string }
): Promise<{ project: ProjectSummaryDTO }> {
  return request<{ project: ProjectSummaryDTO }>(`/api/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteProject(id: string): Promise<{ ok: true }> {
  return request<{ ok: true }>(`/api/projects/${id}`, { method: 'DELETE' })
}

// ===== Versions =====
export function listVersions(id: string): Promise<{ versions: VersionDTO[] }> {
  return request<{ versions: VersionDTO[] }>(`/api/projects/${id}/versions`)
}

export function restoreVersion(id: string, versionId: string): Promise<{ project: ProjectDTO }> {
  return request<{ project: ProjectDTO }>(`/api/projects/${id}/versions`, {
    method: 'POST',
    body: JSON.stringify({ versionId }),
  })
}

// ===== Agent =====
export interface AgentChatMessage {
  role: 'user' | 'agent'
  text: string
}

export function sendAgentMessage(
  projectId: string,
  message: string,
  history?: AgentChatMessage[]
): Promise<AgentResult> {
  return request<AgentResult>(`/api/projects/${projectId}/agent`, {
    method: 'POST',
    body: JSON.stringify({ message, history: history?.slice(-8) ?? [] }),
  })
}

// ===== Export / Build validation =====
export function validateProject(id: string): Promise<ValidateResult> {
  return request<ValidateResult>(`/api/projects/${id}/validate`)
}

/** ZIP download — navigates to the export endpoint (browser handles the file). */
export function downloadProjectZip(id: string): void {
  window.location.href = `/api/projects/${id}/export`
}
