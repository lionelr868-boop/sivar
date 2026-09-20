'use client'

// Zustand app store — العمود الفقري لحالة التطبيق
// DO NOT REWRITE — owned by main agent
import { create } from 'zustand'
import { toast } from 'sonner'
import * as api from '@/lib/api-client'
import {
  type AgentResult,
  type AppView,
  type Block,
  type BlockType,
  type DashboardSection,
  type DeviceMode,
  type PageType,
  type ProjectSchema,
  type ProjectStatus,
  type ProjectSummaryDTO,
  type ProjectTheme,
  type UserDTO,
  type ValidateCheck,
  uid,
} from '@/lib/types'

export interface AgentMessage {
  id: string
  role: 'user' | 'agent'
  text: string
  actions?: string[]
  ts: number
}

export type ExportPhase = 'idle' | 'preparing' | 'checks' | 'ready' | 'error'

export interface ExportState {
  open: boolean
  phase: ExportPhase
  checks: ValidateCheck[]
  error?: string
}

interface AppState {
  // session
  hydrated: boolean
  user: UserDTO | null
  // navigation
  view: AppView
  dashboardSection: DashboardSection
  // projects
  projects: ProjectSummaryDTO[]
  projectsLoading: boolean
  // builder
  projectId: string | null
  schema: ProjectSchema | null
  schemaLoading: boolean
  selectedPageId: string | null
  selectedBlockId: string | null
  device: DeviceMode
  rightPanel: 'agent' | 'properties' | 'history' | 'theme'
  past: ProjectSchema[]
  future: ProjectSchema[]
  dirty: boolean
  saving: boolean
  previewOpen: boolean
  // agent chat
  agentMessages: AgentMessage[]
  agentBusy: boolean
  // export flow
  exportState: ExportState

  // ===== actions =====
  init: () => Promise<void>
  setView: (view: AppView) => void
  setDashboardSection: (section: DashboardSection) => void
  refreshProjects: () => Promise<void>
  logout: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  signup: (payload: { name: string; email: string; password: string }) => Promise<void>
  demoLogin: () => Promise<void>
  completeOnboarding: (payload: { name?: string; projectType?: string; idea?: string; style?: string }) => Promise<void>

  openProject: (id: string) => Promise<void>
  closeBuilder: () => void
  setPreviewOpen: (open: boolean) => void

  mutateSchema: (mutator: (draft: ProjectSchema) => void, label?: string) => void
  applySchemaFn: (fn: (schema: ProjectSchema) => ProjectSchema) => void
  undo: () => void
  redo: () => void
  saveProject: (versionLabel?: string) => Promise<void>

  selectPage: (pageId: string) => void
  selectBlock: (blockId: string | null) => void
  setDevice: (device: DeviceMode) => void
  setRightPanel: (panel: 'agent' | 'properties' | 'history' | 'theme') => void

  deleteProject: (id: string) => Promise<void>

  sendAgent: (text: string) => Promise<void>
  clearAgentMessages: () => void

  restoreVersion: (versionId: string) => Promise<void>
  refreshVersionsMeta: () => Promise<void>

  openExport: () => void
  closeExport: () => void
  runExport: () => Promise<void>
}

const HISTORY_LIMIT = 40

function cloneSchema(schema: ProjectSchema): ProjectSchema {
  return JSON.parse(JSON.stringify(schema)) as ProjectSchema
}

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  user: null,
  view: 'landing',
  dashboardSection: 'home',
  projects: [],
  projectsLoading: false,
  projectId: null,
  schema: null,
  schemaLoading: false,
  selectedPageId: null,
  selectedBlockId: null,
  device: 'desktop',
  rightPanel: 'agent',
  past: [],
  future: [],
  dirty: false,
  saving: false,
  previewOpen: false,
  agentMessages: [],
  agentBusy: false,
  exportState: { open: false, phase: 'idle', checks: [] },

  // ---------- init ----------
  init: async () => {
    try {
      const { user } = await api.getMe()
      if (user) {
        set({ user, view: user.onboarded ? 'app' : 'onboarding', hydrated: true })
        if (user.onboarded) {
          get().refreshProjects()
        }
      } else {
        set({ user: null, view: 'landing', hydrated: true })
      }
    } catch {
      set({ hydrated: true, view: 'landing' })
    }
  },

  setView: (view) => set({ view }),
  setDashboardSection: (section) => set({ dashboardSection: section, view: 'app' }),

  // ---------- auth ----------
  login: async (email: string, password: string) => {
    const { user } = await api.login(email, password)
    set({ user, view: user.onboarded ? 'app' : 'onboarding' })
    if (user.onboarded) await get().refreshProjects()
    else set({ dashboardSection: 'home' })
  },

  signup: async (payload: { name: string; email: string; password: string }) => {
    const { user } = await api.signup(payload)
    set({ user, view: 'onboarding' })
  },

  demoLogin: async () => {
    const { user } = await api.demoLogin()
    set({ user, view: user.onboarded ? 'app' : 'onboarding' })
    if (user.onboarded) await get().refreshProjects()
  },

  completeOnboarding: async (payload: { name?: string; projectType?: string; idea?: string; style?: string }) => {
    const { user } = await api.completeOnboarding(payload)
    set({ user, view: 'app', dashboardSection: 'new' })
    await get().refreshProjects()
  },

  refreshProjects: async () => {
    set({ projectsLoading: true })
    try {
      const { projects } = await api.listProjects()
      set({ projects, projectsLoading: false })
    } catch {
      set({ projectsLoading: false })
    }
  },

  logout: async () => {
    await api.logout()
    set({
      user: null,
      view: 'landing',
      projects: [],
      projectId: null,
      schema: null,
      agentMessages: [],
      dashboardSection: 'home',
    })
  },

  // ---------- builder ----------
  openProject: async (id) => {
    set({ schemaLoading: true, view: 'builder', projectId: id, past: [], future: [], dirty: false, agentMessages: [] })
    try {
      const { project } = await api.getProject(id)
      const firstPage = project.schema.pages[0]?.id ?? null
      set({
        schema: project.schema,
        schemaLoading: false,
        selectedPageId: firstPage,
        selectedBlockId: null,
        rightPanel: 'agent',
      })
    } catch (e) {
      toast.error((e as Error).message || 'تعذّر فتح المشروع')
      set({ view: 'app', schemaLoading: false, projectId: null })
    }
  },

  closeBuilder: () => {
    set({
      view: 'app',
      dashboardSection: 'projects',
      projectId: null,
      schema: null,
      selectedPageId: null,
      selectedBlockId: null,
      past: [],
      future: [],
      previewOpen: false,
    })
    get().refreshProjects()
  },

  setPreviewOpen: (open) => set({ previewOpen: open }),

  // ---------- schema mutations (undo/redo) ----------
  mutateSchema: (mutator, _label) => {
    const { schema, past } = get()
    if (!schema) return
    const snapshot = cloneSchema(schema)
    const draft = cloneSchema(schema)
    mutator(draft)
    const nextPast = [...past, snapshot].slice(-HISTORY_LIMIT)
    set({ schema: draft, past: nextPast, future: [], dirty: true, selectedBlockId: get().selectedBlockId })
  },

  applySchemaFn: (fn) => {
    const { schema, past } = get()
    if (!schema) return
    const next = fn(schema)
    if (next === schema) return
    set({
      schema: next,
      past: [...past, cloneSchema(schema)].slice(-HISTORY_LIMIT),
      future: [],
      dirty: true,
    })
  },

  undo: () => {
    const { past, future, schema, selectedPageId } = get()
    if (past.length === 0 || !schema) return
    const previous = past[past.length - 1]
    const nextFuture = [cloneSchema(schema), ...future].slice(0, HISTORY_LIMIT)
    const pageStillExists = previous.pages.some((p) => p.id === selectedPageId)
    set({
      schema: previous,
      past: past.slice(0, -1),
      future: nextFuture,
      dirty: true,
      selectedPageId: pageStillExists ? selectedPageId : previous.pages[0]?.id ?? null,
      selectedBlockId: null,
    })
  },

  redo: () => {
    const { past, future, schema, selectedPageId } = get()
    if (future.length === 0 || !schema) return
    const next = future[0]
    const nextPast = [...past, cloneSchema(schema)].slice(-HISTORY_LIMIT)
    const pageStillExists = next.pages.some((p) => p.id === selectedPageId)
    set({
      schema: next,
      past: nextPast,
      future: future.slice(1),
      dirty: true,
      selectedPageId: pageStillExists ? selectedPageId : next.pages[0]?.id ?? null,
      selectedBlockId: null,
    })
  },

  saveProject: async (versionLabel) => {
    const { projectId, schema } = get()
    if (!projectId || !schema) return
    set({ saving: true })
    try {
      const { project } = await api.saveProject(projectId, { schema, versionLabel })
      set({ saving: false, dirty: false })
      toast.success('تم حفظ المشروع')
      get().refreshProjects()
      return void project
    } catch (e) {
      set({ saving: false })
      toast.error((e as Error).message || 'تعذّر الحفظ')
    }
  },

  selectPage: (pageId) => set({ selectedPageId: pageId, selectedBlockId: null }),
  selectBlock: (blockId) => set({ selectedBlockId: blockId, rightPanel: blockId ? 'properties' : get().rightPanel }),
  setDevice: (device) => set({ device }),
  setRightPanel: (panel) => set({ rightPanel: panel }),

  deleteProject: async (id) => {
    try {
      await api.deleteProject(id)
      set({ projects: get().projects.filter((p) => p.id !== id) })
      toast.success('تم حذف المشروع')
    } catch (e) {
      toast.error((e as Error).message || 'تعذّر الحذف')
    }
  },

  // ---------- agent ----------
  sendAgent: async (text) => {
    const { projectId, agentBusy } = get()
    if (!projectId || agentBusy || !text.trim()) return
    const userMsg: AgentMessage = { id: uid('m_'), role: 'user', text: text.trim(), ts: Date.now() }
    set({ agentMessages: [...get().agentMessages, userMsg], agentBusy: true })
    try {
      const history = get()
        .agentMessages.filter((m) => m.id !== userMsg.id)
        .slice(-8)
        .map((m) => ({ role: m.role, text: m.text }))
      const result: AgentResult = await api.sendAgentMessage(projectId, text.trim(), history)
      const agentMsg: AgentMessage = {
        id: uid('m_'),
        role: 'agent',
        text: result.explanation,
        actions: result.actions,
        ts: Date.now(),
      }
      const { schema } = get()
      set({
        agentMessages: [...get().agentMessages, agentMsg],
        agentBusy: false,
        past: schema ? [...get().past, cloneSchema(schema)].slice(-HISTORY_LIMIT) : get().past,
        schema: result.schema,
        future: [],
        dirty: true,
      })
    } catch (e) {
      const errMsg: AgentMessage = {
        id: uid('m_'),
        role: 'agent',
        text: (e as Error).message || 'تعذّر تنفيذ طلبك، حاول مرة أخرى.',
        ts: Date.now(),
      }
      set({ agentMessages: [...get().agentMessages, errMsg], agentBusy: false })
    }
  },

  clearAgentMessages: () => set({ agentMessages: [] }),

  restoreVersion: async (versionId) => {
    const { projectId } = get()
    if (!projectId) return
    try {
      const { project } = await api.restoreVersion(projectId, versionId)
      set({ schema: project.schema, dirty: true, past: [], future: [], selectedPageId: project.schema.pages[0]?.id ?? null })
      toast.success('تمت استعادة الإصدار')
    } catch (e) {
      toast.error((e as Error).message || 'تعذّرت الاستعادة')
    }
  },

  refreshVersionsMeta: async () => {
    await get().refreshProjects()
  },

  // ---------- export ----------
  openExport: () => set({ exportState: { open: true, phase: 'preparing', checks: [] } }),
  closeExport: () => set({ exportState: { open: false, phase: 'idle', checks: [] } }),

  runExport: async () => {
    const { projectId, schema } = get()
    if (!projectId || !schema) return
    set({ exportState: { open: true, phase: 'preparing', checks: [] } })
    await new Promise((r) => setTimeout(r, 700))
    set({ exportState: { open: true, phase: 'checks', checks: [] } })
    try {
      const result = await api.validateProject(projectId)
      const checks = result.checks
      // animate checks appearing one by one
      for (let i = 0; i < checks.length; i++) {
        await new Promise((r) => setTimeout(r, 450))
        set({ exportState: { open: true, phase: 'checks', checks: checks.slice(0, i + 1) } })
      }
      if (result.ok) {
        set({ exportState: { open: true, phase: 'ready', checks } })
      } else {
        set({
          exportState: {
            open: true,
            phase: 'error',
            checks,
            error: 'وجدنا مشكلة في المشروع. المساعد الذكي سيحاول إصلاحها — جرّب إرسال طلب للمساعد ثم أعد المحاولة.',
          },
        })
      }
    } catch (e) {
      set({
        exportState: {
          open: true,
          phase: 'error',
          checks: [],
          error: (e as Error).message || 'حدث خطأ أثناء تجهيز المشروع.',
        },
      })
    }
  },
}))

// ===== typed helpers used by builder UI (schema manipulation shortcuts) =====
export function findPage(schema: ProjectSchema | null, pageId: string | null) {
  return schema?.pages.find((p) => p.id === pageId) ?? null
}

export function findBlock(schema: ProjectSchema | null, pageId: string | null, blockId: string | null): Block | null {
  const page = findPage(schema, pageId)
  if (!page || !blockId) return null
  return page.blocks.find((b) => b.id === blockId) ?? null
}

export type { BlockType, PageType, ProjectStatus, ProjectTheme }
