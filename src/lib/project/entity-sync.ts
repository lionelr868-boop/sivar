// ============================================================
// SIVAR — محرّك التزامن الموازي (الجولة 14)
// صفحة الهبوط ↔ بيانات لوحة التحكم: عندما تتغيّر عناصر أقسام
// صفحة الهبوط (المعرض/الفريق) تتغيّر معها بيانات جداول لوحة
// التحكم التي تعرض نفس الكيان — والعكس عند تجديد البيانات
// التجريبية. دوال نقية (isomorphic) تُستعمل من الخادم والعميل.
// ============================================================
import type { AgentAction, EntityData, ProjectSchema } from '@/lib/types'

// ============================================================
// خرائط الربط الدقيقة — لا خلط بين العناصر
// ============================================================

/** متغيرات المعرض التي تمثّل كياناً في لوحة التحكم (معرض ← كيان) */
const GALLERY_ENTITY_BY_VARIANT: Record<string, string> = {
  products: 'products',
  services: 'services',
  properties: 'properties',
  menu: 'menuItems',
  courses: 'courses',
}

/** أنواع الكيانات التي يغطيها التزامن الموازي */
const SYNCED_ENTITIES = new Set<string>([...Object.values(GALLERY_ENTITY_BY_VARIANT), 'teamMembers'])

/** هل الكيان مشمول بالتزامن الموازي؟ */
export function isSyncedEntity(entity: string): boolean {
  return SYNCED_ENTITIES.has(entity)
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function listOf(props: Record<string, unknown>, key: string): Array<Record<string, unknown>> {
  const v = props[key]
  return Array.isArray(v) ? v.filter(isRecord) : []
}

function strOf(rec: Record<string, unknown>, key: string): string {
  const v = rec[key]
  return typeof v === 'string' ? v.trim() : ''
}

function numOf(rec: Record<string, unknown>, key: string): number {
  const v = rec[key]
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) return Number(v)
  return NaN
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

// ============================================================
// 1) اتجاه صفحة الهبوط → لوحة التحكم (المصدر: أقسام الهبوط)
// ============================================================

/**
 * يشتق صفوف الكيانات في mockData.entities من أقسام صفحات الموقع:
 * - معرض بمتغير منتجات/خدمات/عقارات/قائمة طعام/دورات → صفوف الكيان
 *   المقابل (الاسم والسعر من العنصر؛ بقية الأعمدة تُحفظ من الصف
 *   السابق بنفس الترتيب — المخزون/الحالة/المدة لا تضيع).
 * - قسم الفريق → صفوف أعضاء الفريق (الاسم والدور؛ بقية الأعمدة تُحفظ).
 * صفوف الكيانات بلا قسم مقابل تبقى كما هي (لا حذف ولا خلط).
 * نقية ومتكرّرة الآثار (idempotent): نفس الأقسام = نفس الصفوف.
 */
export function syncEntitiesFromLanding(schema: ProjectSchema): ProjectSchema {
  const entities = schema.mockData?.entities
  if (!entities) return schema

  let changed = false
  const nextEntities: Record<string, EntityData> = { ...entities }

  // ---- المعرض ← الكيانات (اسم + سعر) ----
  const galleryItemsByEntity = new Map<string, Array<Record<string, unknown>>>()
  for (const page of schema.pages) {
    for (const block of page.blocks) {
      if (block.type !== 'gallery') continue
      const entityKey = GALLERY_ENTITY_BY_VARIANT[strOf(block.props, 'variant')]
      if (!entityKey || !entities[entityKey]) continue
      const list = galleryItemsByEntity.get(entityKey) ?? []
      list.push(...listOf(block.props, 'items'))
      galleryItemsByEntity.set(entityKey, list)
    }
  }

  for (const [entityKey, items] of galleryItemsByEntity) {
    const entity = entities[entityKey]
    if (!entity || !Array.isArray(entity.rows)) continue
    // معرض فارغ = لا اشتقاق (لا نفرّغ جدولاً كاملاً عن غير قصد)
    if (items.length === 0) continue
    const prevRows = entity.rows.filter(isRecord)
    const rows = items.map((item, i) => {
      const prev = prevRows[i] ?? prevRows[prevRows.length - 1] ?? {}
      const nextRow: Record<string, unknown> = { ...prev }
      const name = strOf(item, 'title')
      if (name) nextRow.name = name
      const price = numOf(item, 'price')
      if (Number.isFinite(price)) nextRow.price = price
      return nextRow
    })
    if (!sameJson(rows, prevRows)) {
      changed = true
      nextEntities[entityKey] = { ...entity, rows }
    }
  }

  // ---- قسم الفريق ← أعضاء الفريق (اسم + دور) ----
  if (entities.teamMembers && Array.isArray(entities.teamMembers.rows)) {
    const teamItems: Array<Record<string, unknown>> = []
    for (const page of schema.pages) {
      for (const block of page.blocks) {
        if (block.type === 'team') teamItems.push(...listOf(block.props, 'items'))
      }
    }
    if (teamItems.length > 0) {
      const prevRows = entities.teamMembers.rows.filter(isRecord)
      const rows = teamItems.map((item, i) => {
        const prev = prevRows[i] ?? prevRows[prevRows.length - 1] ?? {}
        const nextRow: Record<string, unknown> = { ...prev }
        const name = strOf(item, 'name')
        if (name) nextRow.name = name
        const role = strOf(item, 'role')
        if (role) nextRow.role = role
        return nextRow
      })
      if (!sameJson(rows, prevRows)) {
        changed = true
        nextEntities.teamMembers = { ...entities.teamMembers, rows }
      }
    }
  }

  if (!changed) return schema
  return { ...schema, mockData: { ...schema.mockData, entities: nextEntities } }
}

// ============================================================
// 2) اتجاه لوحة التحكم → صفحة الهبوط (عند تجديد البيانات)
// ============================================================

/**
 * يعكس صفوف الكيانات المُجدّدة في أقسام الموقع (بعد generate_mock_data):
 * - عناصر المعرض تأخذ اسم وسعر الصف بنفس الترتيب — الوصف والشارة
 *   والصور المرفوعة تُحفظ كما هي (لا تُمسّ أبداً).
 * - عناصر قسم الفريق تأخذ الاسم والدور من الصفوف — الصور تُحفظ.
 * يحدّث العناصر القائمة فقط (لا إضافة ولا حذف) حتى لا يتمدد القسم بلا قصد.
 */
export function syncLandingFromEntities(schema: ProjectSchema, entities: string[]): ProjectSchema {
  const entityMap = schema.mockData?.entities
  if (!entityMap) return schema

  let changed = false
  const pages = schema.pages.map((page) => {
    const blocks = page.blocks.map((block) => {
      const props = block.props ?? {}

      // ---- المعرض: اسم وسعر العنصر من صفوف الكيان ----
      if (block.type === 'gallery') {
        const entityKey = GALLERY_ENTITY_BY_VARIANT[strOf(props, 'variant')]
        if (!entityKey || !entities.includes(entityKey)) return block
        const rows = entityMap[entityKey]?.rows
        if (!Array.isArray(rows) || rows.length === 0) return block
        const items = listOf(props, 'items')
        if (items.length === 0) return block
        let listChanged = false
        const nextItems = items.map((item, i) => {
          const row = rows[i]
          if (!isRecord(row)) return item
          const next: Record<string, unknown> = { ...item }
          let itemChanged = false
          const name = strOf(row, 'name')
          if (name && name !== strOf(item, 'title')) {
            next.title = name
            itemChanged = true
          }
          const price = numOf(row, 'price')
          if (Number.isFinite(price) && price !== numOf(item, 'price')) {
            next.price = price
            itemChanged = true
          }
          if (itemChanged) listChanged = true
          return itemChanged ? next : item
        })
        if (!listChanged) return block
        changed = true
        return { ...block, props: { ...props, items: nextItems } }
      }

      // ---- الفريق: الاسم والدور من صفوف أعضاء الفريق ----
      if (block.type === 'team') {
        if (!entities.includes('teamMembers')) return block
        const rows = entityMap.teamMembers?.rows
        if (!Array.isArray(rows) || rows.length === 0) return block
        const items = listOf(props, 'items')
        if (items.length === 0) return block
        let listChanged = false
        const nextItems = items.map((item, i) => {
          const row = rows[i]
          if (!isRecord(row)) return item
          const next: Record<string, unknown> = { ...item }
          let itemChanged = false
          const name = strOf(row, 'name')
          if (name && name !== strOf(item, 'name')) {
            next.name = name
            itemChanged = true
          }
          const role = strOf(row, 'role')
          if (role && role !== strOf(item, 'role')) {
            next.role = role
            itemChanged = true
          }
          if (itemChanged) listChanged = true
          return itemChanged ? next : item
        })
        if (!listChanged) return block
        changed = true
        return { ...block, props: { ...props, items: nextItems } }
      }

      return block
    })
    return blocks === page.blocks ? page : { ...page, blocks }
  })

  if (!changed) return schema
  return { ...schema, pages }
}

// ============================================================
// 3) خطة تزامن إجراءات المساعد الذكي — اتجاه واحد لكل تشغيل
// ============================================================

const LANDING_CONTENT_TOOLS = new Set([
  'update_block', 'update_content', 'add_block', 'delete_block', 'move_block',
  'change_landing_variant', 'create_page',
])
const LANDING_CONTENT_PROPS = new Set([
  'items', 'plans', 'title', 'name', 'price', 'variant', 'subtitle',
  'description', 'role', 'badge', 'features',
])

export interface AgentSyncPlan {
  /** عدّل الوكيل محتوى الأقسام مباشرة → الأقسام هي المصدر */
  landingDirty: boolean
  /** جُدّدت بيانات تجريبية لكيانات مشمولة بالتزامن → تُعكس على الأقسام */
  regenerated: string[]
}

function strArg(args: Record<string, unknown>, key: string): string {
  const v = args[key]
  return typeof v === 'string' ? v.trim() : ''
}

/** يحلّل إجراءات الوكيل ليقرّر اتجاه التزامن الموازي (دالة نقية لا تُعدّل شيئاً) */
export function agentSyncPlan(actions: AgentAction[]): AgentSyncPlan {
  let landingDirty = false
  const regenerated = new Set<string>()
  let regeneratedAll = false

  for (const action of actions ?? []) {
    if (!action || typeof action.tool !== 'string') continue
    if (regeneratedAll) break
    if (action.tool === 'generate_mock_data') {
      const entity = strArg((action.args ?? {}) as Record<string, unknown>, 'entity')
      if (!entity) {
        regeneratedAll = true
        break
      }
      if (isSyncedEntity(entity)) regenerated.add(entity)
      continue
    }
    if (!LANDING_CONTENT_TOOLS.has(action.tool)) continue
    if (action.tool !== 'update_block' && action.tool !== 'update_content') {
      // create_page/add_block/delete_block/move_block/change_landing_variant تلمس بنية الأقسام
      landingDirty = true
      continue
    }
    // update_block/update_content: هل يلمس محتوى القسم (وليس ألوانه فقط)؟
    const args = (action.args ?? {}) as Record<string, unknown>
    const patch = (args.patch ?? args.props ?? args.content) as Record<string, unknown> | undefined
    if (patch && typeof patch === 'object') {
      for (const key of Object.keys(patch)) {
        if (LANDING_CONTENT_PROPS.has(key)) {
          landingDirty = true
          break
        }
      }
    }
  }

  if (regeneratedAll) {
    for (const key of SYNCED_ENTITIES) regenerated.add(key)
  }

  // تعديل الأقسام مباشرة يتقدّم على تجديد البيانات في نفس التشغيل
  if (landingDirty) return { landingDirty: true, regenerated: [] }
  return { landingDirty: false, regenerated: [...regenerated] }
}

// ============================================================
// 4) دمج خصائص المكوّنات غير الإتلافي (update_block الجراحي)
// ============================================================

/**
 * يدمج رقعة الخصائص في خصائص مكوّن قائم دون حذف ما لم يُذكر:
 * - القيم العددية/النصية تُستبدل مفتاحاً بمفتاح (السلوك المعتاد).
 * - المصفوفات المكوّنة من كائنات (items/plans/...): دمج بالفهرس — كل
 *   عنصر رقعة يُكمل نقائصه من العنصر القائم بنفس الفهرس (الصور
 *   والشارات والميزات لا تضيع)، والعناصر الزائدة تُضاف والنقص يقصّ الذيل.
 * هذا ما يمنع «حذف التعديلات السابقة عند كل تحديث من الذكاء الاصطناعي».
 */
export function mergeBlockProps(
  existing: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  // الأساس: كل الخصائص القائمة تبقى ما لم تُذكر في الرقعة صراحة
  const merged: Record<string, unknown> = { ...existing }
  for (const [key, patchValue] of Object.entries(patch)) {
    const existingValue = merged[key]
    if (
      Array.isArray(patchValue) && Array.isArray(existingValue) &&
      patchValue.length > 0 && existingValue.length > 0 &&
      patchValue.every(isRecord) && existingValue.every(isRecord)
    ) {
      merged[key] = patchValue.map((item, i) => {
        const prev = existingValue[i]
        return prev ? { ...prev, ...item } : item
      })
      continue
    }
    merged[key] = patchValue
  }
  return merged
}
