'use client'

// Zustand app store — العمود الفقري لحالة التطبيق
// DO NOT REWRITE — owned by main agent
import { create } from 'zustand'
import { toast } from 'sonner'
import * as api from '@/lib/api-client'
import { applyEntityRowOp, isSyncedEntity, syncEntitiesFromLanding } from '@/lib/project/entity-sync'
import { DEMO_CLIENT, DEMO_CLIENT_NAME, ENTITY_SINGULARS } from '@/lib/content/mock-data'
import type { PreviewSession } from '@/components/prototype/blocks/shared'
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

export type { PreviewSession }

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
  /** (الجولة 16) جلسة دخول تجريبية عابرة (مدير/زبون) — لا تُحفظ في المخطط */
  previewSession: PreviewSession | null
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
  // (الجولة 15) إدارة صفوف الكيانات من لوحة تحكم الموقع نفسه
  upsertEntityRow: (entityKey: string, index: number | null, row: Record<string, unknown>) => void
  deleteEntityRow: (entityKey: string, index: number) => void
  // (الجولة 16) جلسة الدخول بالأدوار في المعاينة + طلب خطة من التسعير
  loginPreviewAs: (role: 'admin' | 'client') => void
  logoutPreview: () => void
  placeClientOrder: (plan: { name: string; price: number }) => void
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
  previewSession: null,
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
      previewSession: null,
    })
  },

  // ---------- builder ----------
  openProject: async (id) => {
    // (الجولة 16) تغيير المشروع يُفرّغ جلسة المعاينة (مدير/زبون)
    set({ schemaLoading: true, view: 'builder', projectId: id, past: [], future: [], dirty: false, agentMessages: [], previewSession: null })
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
      previewSession: null,
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
    // (الجولة 14) التزامن الموازي لحظياً: أي تعديل على أقسام الموقع
    // (معرض/فريق) ينعكس فوراً على صفوف جداول لوحة التحكم في المعاينة
    const synced = syncEntitiesFromLanding(draft)
    const nextPast = [...past, snapshot].slice(-HISTORY_LIMIT)
    set({ schema: synced, past: nextPast, future: [], dirty: true, selectedBlockId: get().selectedBlockId })
  },

  applySchemaFn: (fn) => {
    const { schema, past } = get()
    if (!schema) return
    const mutated = fn(schema)
    if (mutated === schema) return
    // (الجولة 14) نفس التزامن الموازي لمسار لوحة الخصائص
    const next = syncEntitiesFromLanding(mutated)
    if (next === schema) return
    set({
      schema: next,
      past: [...past, cloneSchema(schema)].slice(-HISTORY_LIMIT),
      future: [],
      dirty: true,
    })
  },

  // ---------- (الجولة 15) صفوف الكيانات من موقع المستخدم ----------
  upsertEntityRow: (entityKey, index, row) => {
    const { schema } = get()
    if (!schema) return
    const name = ENTITY_SINGULARS[entityKey] ?? entityKey
    const label = String(row[Object.keys(row)[0] ?? ''] ?? name) || name
    // نمرّ عبر مسار التزامن الموازي نفسه: الصف + مصالحة قسم الموقع
    get().applySchemaFn((current) => applyEntityRowOp(current, entityKey, 'upsert', index, row))
    toast.success(
      index == null
        ? isSyncedEntity(entityKey)
          ? `أُضيف «${label}» وتحدّث قسم الموقع المقابل تلقائياً`
          : `أُضيف «${label}»`
        : `حُدّث «${label}»${isSyncedEntity(entityKey) ? ' وقسم الموقع المقابل' : ''}`,
    )
  },

  deleteEntityRow: (entityKey, index) => {
    const { schema } = get()
    if (!schema) return
    const name = ENTITY_SINGULARS[entityKey] ?? entityKey
    const row = schema.mockData?.entities?.[entityKey]?.rows?.[index]
    const label = String((row as Record<string, unknown> | undefined)?.name ?? (row as Record<string, unknown> | undefined)?.title ?? name) || name
    get().applySchemaFn((current) => applyEntityRowOp(current, entityKey, 'delete', index))
    toast.success(`حُذف «${label}»${isSyncedEntity(entityKey) ? ' وقسم الموقع المقابل' : ''}`)
  },

  // ---------- (الجولة 16) جلسة الدخول بالأدوار في المعاينة ----------
  loginPreviewAs: (role) => {
    set({
      previewSession:
        role === 'client'
          ? { role: 'client', name: DEMO_CLIENT.name, email: DEMO_CLIENT.email }
          : { role: 'admin', name: 'مستخدم تجريبي', email: 'demo@sivar.dz' },
    })
  },

  logoutPreview: () => set({ previewSession: null }),

  /**
   * (الجولة 16) طلب حقيقي من التسعير: زبون مسجّل يطلب خطة — صف جديد
   * آخر صفوف orders بنفس مسار الجولة 15 (applySchemaFn + applyEntityRowOp)
   * فيظهر فوراً في «طلباتي» ولوحة المدير.
   */
  placeClientOrder: (plan) => {
    const { schema } = get()
    if (!schema) return
    const orders = schema.mockData?.entities?.orders
    if (!orders || !Array.isArray(orders.columns) || orders.columns.length === 0) return
    const row: Record<string, unknown> = {
      id: 'ORD-' + Math.floor(10000 + Math.random() * 89999),
      customer: DEMO_CLIENT_NAME,
      item: plan.name,
      quantity: 1,
      total: plan.price,
      date: new Date().toISOString().slice(0, 10),
      status: 'جديد',
    }
    get().applySchemaFn((current) => applyEntityRowOp(current, 'orders', 'upsert', null, row))
    toast.success(`تم استلام طلبك «${plan.name}» — يظهر الآن في «طلباتي»`)
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
    const { projectId, agentBusy, schema, dirty, saving } = get()
    if (!projectId || agentBusy || !text.trim()) return
    const userMsg: AgentMessage = { id: uid('m_'), role: 'user', text: text.trim(), ts: Date.now() }
    set({ agentMessages: [...get().agentMessages, userMsg], agentBusy: true })
    try {
      // (الجولة 14) إصلاح حذف التعديلات السابقة: نحفظ التعديلات غير
      // المحفوظة أولاً حتى يشتغل المساعد على آخر نسخة — فلا تُمسّ تعديلات
      // المستخدم اليدوية بعد الآن
      if (dirty && schema && !saving) {
        try {
          await api.saveProject(projectId, { schema })
          set({ dirty: false })
          toast.info('حفظنا تعديلاتك الأخيرة قبل تنفيذ طلب المساعد الذكي', { duration: 4000 })
        } catch {
          // نتابع على نسخة الخادم — عدم الحفظ لا يمنع تنفيذ الطلب
        }
      }
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
      const current = get().schema
      set({
        agentMessages: [...get().agentMessages, agentMsg],
        agentBusy: false,
        past: current ? [...get().past, cloneSchema(current)].slice(-HISTORY_LIMIT) : get().past,
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
    const { projectId, schema, dirty, saving } = get()
    if (!projectId || !schema) return
    set({ exportState: { open: true, phase: 'preparing', checks: [] } })
    // (الجولة 14) نحفظ آخر التعديلات قبل الفحص والتصدير — حتى يُحمَّل
    // المشروع المعدَّل كاملاً كما يراه المستخدم لا نسخة قديمة
    if (dirty && !saving) {
      try {
        await api.saveProject(projectId, { schema })
        set({ dirty: false })
      } catch (e) {
        set({
          exportState: {
            open: true,
            phase: 'error',
            checks: [],
            error: (e as Error).message || 'تعذّر حفظ التعديلات قبل التصدير.',
          },
        })
        return
      }
    }
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
