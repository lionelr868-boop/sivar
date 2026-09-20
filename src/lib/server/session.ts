// ============================================================
// SIVAR — Server Session & DTO helpers (خادم فقط)
// Task 3-b — جلسة وهمية (cookie) + تحويلات Prisma → DTO
// ============================================================
import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import type { Project, User } from '@prisma/client'
import { db } from '@/lib/db'
import type {
  IdeaAnalysis,
  ProjectDTO,
  ProjectSchema,
  ProjectStatus,
  ProjectSummaryDTO,
  ProjectType,
  UserDTO,
} from '@/lib/types'

export const SESSION_COOKIE = 'sivar_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 يوماً

// ============================================================
// كلمة المرور
// ============================================================
export function hashPassword(password: string): string {
  return createHash('sha256').update(`${password}::sivar`).digest('hex')
}

// ============================================================
// الجلسة
// ============================================================
export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies()
  const value = store.get(SESSION_COOKIE)?.value
  return value && value.trim() ? value.trim() : null
}

export async function setSession(userId: string): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function clearSession(): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

// ============================================================
// DTO mappers
// ============================================================
export function getUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    onboarded: user.onboarded,
    projectType: user.projectType,
    idea: user.idea,
    style: user.style,
    createdAt: user.createdAt.toISOString(),
  }
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

/** يقرأ المخطط من قاعدة البيانات — يرمي خطأ عربياً إن كان تالفاً */
export function readProjectSchema(project: Project): ProjectSchema {
  const parsed = safeParseJson(project.schemaJson)
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('مخطط المشروع تالف')
  }
  return parsed as ProjectSchema
}

export function projectToSummaryDTO(project: Project, versionCount: number): ProjectSummaryDTO {
  let pageCount = 0
  let icon = 'sparkles'
  const parsed = safeParseJson(project.schemaJson)
  if (parsed && typeof parsed === 'object') {
    const schema = parsed as Partial<ProjectSchema>
    if (Array.isArray(schema.pages)) pageCount = schema.pages.length
    if (schema.metadata && typeof schema.metadata.icon === 'string' && schema.metadata.icon.trim()) {
      icon = schema.metadata.icon
    }
  }
  return {
    id: project.id,
    name: project.name,
    type: project.type as ProjectType,
    status: project.status as ProjectStatus,
    icon,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    versionCount,
    pageCount,
  }
}

export function projectToDTO(project: Project, versionCount: number): ProjectDTO {
  const summary = projectToSummaryDTO(project, versionCount)
  const schema = safeParseJson(project.schemaJson) as ProjectSchema | null
  const analysis = project.analysisJson
    ? (safeParseJson(project.analysisJson) as IdeaAnalysis | null)
    : null
  return {
    ...summary,
    schema: (schema ?? { version: 1 }) as ProjectSchema,
    analysis,
  }
}

// ============================================================
// الإصدارات — إنشاء إصدار جديد بترقيم تلقائي + سقف 50 إصداراً
// ============================================================
const MAX_VERSIONS = 50

export async function createProjectVersion(
  projectId: string,
  label: string,
  schemaJson: string
): Promise<number> {
  const agg = await db.projectVersion.aggregate({
    where: { projectId },
    _max: { number: true },
  })
  const number = (agg._max.number ?? 0) + 1
  await db.projectVersion.create({
    data: { projectId, number, label, schemaJson },
  })
  const count = await db.projectVersion.count({ where: { projectId } })
  if (count > MAX_VERSIONS) {
    const oldest = await db.projectVersion.findMany({
      where: { projectId },
      orderBy: { number: 'asc' },
      take: count - MAX_VERSIONS,
      select: { id: true },
    })
    if (oldest.length > 0) {
      await db.projectVersion.deleteMany({
        where: { id: { in: oldest.map((v) => v.id) } },
      })
    }
  }
  return number
}

/** يجلب مشروع المستخدم الحالي (مع فحص الملكية) أو null */
export async function findOwnedProject(projectId: string, userId: string): Promise<Project | null> {
  if (!projectId || typeof projectId !== 'string') return null
  const project = await db.project.findFirst({ where: { id: projectId, userId } })
  return project ?? null
}
