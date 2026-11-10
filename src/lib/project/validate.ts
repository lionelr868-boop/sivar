// ============================================================
// SIVAR — Schema Validator (التحقق قبل التصدير)
// Task 2-a — دالة نقية (isomorphic) تُستعمل من الخادم والعميل.
// التحقق: الصفحات، المكونات، التنقل، الألوان، البيانات،
// قائمة لوحة التحكم.
// ============================================================
import { BLOCK_REGISTRY } from '@/lib/registry/blocks'
import type {
  Block,
  ProjectPage,
  ProjectSchema,
  ProjectTheme,
  ValidateCheck,
  ValidateResult,
} from '@/lib/types'

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

const THEME_COLOR_KEYS: Array<keyof ProjectTheme> = [
  'primary',
  'primaryForeground',
  'secondary',
  'accent',
  'background',
  'surface',
  'text',
  'mutedText',
  'border',
]

function ok(id: string, label: string, detail: string): ValidateCheck {
  return { id, label, status: 'ok', detail }
}
function error(id: string, label: string, detail: string): ValidateCheck {
  return { id, label, status: 'error', detail }
}

/** جدول entities المُستعملة في الصفحات وكت data-table */
function collectEntityRefs(pages: ProjectPage[]): Array<{ entity: string; where: string }> {
  const refs: Array<{ entity: string; where: string }> = []
  for (const page of pages) {
    if (page.entity) refs.push({ entity: page.entity, where: `صفحة «${page.name}»` })
    for (const block of page.blocks) {
      if (block.type === 'data-table') {
        const entity = block.props['entity']
        if (typeof entity === 'string' && entity.trim()) {
          refs.push({ entity: entity.trim(), where: `مكوّن «${BLOCK_REGISTRY['data-table']?.label ?? 'جدول'}» في صفحة «${page.name}»` })
        }
      }
    }
  }
  return refs
}

export function validateSchema(schema: ProjectSchema): ValidateResult {
  const checks: ValidateCheck[] = []

  // ---------- 1. الصفحات ----------
  {
    const id = 'pages'
    const label = 'الصفحات'
    if (!schema.pages || schema.pages.length === 0) {
      checks.push(error(id, label, 'المشروع لا يحتوي على أي صفحة'))
    } else {
      const ids = new Set<string>()
      const dupes: string[] = []
      for (const p of schema.pages) {
        if (ids.has(p.id)) dupes.push(p.name)
        ids.add(p.id)
      }
      if (dupes.length) {
        checks.push(error(id, label, `مُعرّفات صفحات مكرّرة: ${dupes.join('، ')}`))
      } else {
        let blockCount = 0
        for (const p of schema.pages) blockCount += p.blocks.length
        checks.push(ok(id, label, `${schema.pages.length} صفحات و${blockCount} مكوّناً`))
      }
    }
  }

  // ---------- 2. المكونات ----------
  {
    const id = 'blocks'
    const label = 'المكونات'
    const problems: string[] = []
    for (const page of schema.pages ?? []) {
      const seen = new Set<string>()
      for (const block of page.blocks ?? []) {
        if (!BLOCK_REGISTRY[block.type as Block['type']]) {
          problems.push(`نوع غير معروف «${String(block.type)}» في صفحة «${page.name}»`)
          continue
        }
        if (!block.id) {
          problems.push(`مكوّن بدون مُعرّف في صفحة «${page.name}»`)
        } else if (seen.has(block.id)) {
          problems.push(`مُعرّف مكوّن مكرّر في صفحة «${page.name}»`)
        }
        seen.add(block.id)
        if (!block.props || typeof block.props !== 'object') {
          problems.push(`مكوّن بدون خصائص في صفحة «${page.name}»`)
        }
      }
    }
    checks.push(
      problems.length ? error(id, label, problems.slice(0, 4).join('، ')) : ok(id, label, 'كل أنواع المكوّنات معروفة وسليمة')
    )
  }

  // ---------- 3. التنقل ----------
  {
    const id = 'navigation'
    const label = 'التنقل'
    const pageIds = new Set((schema.pages ?? []).map((p) => p.id))
    const problems: string[] = []
    for (const item of schema.navigation?.items ?? []) {
      if (!pageIds.has(item.pageId)) problems.push(`عنصر «${item.label}» يشير إلى صفحة غير موجودة`)
    }
    if (schema.navigation?.cta && !pageIds.has(schema.navigation.cta.pageId)) {
      problems.push(`زر «${schema.navigation.cta.label}» يشير إلى صفحة غير موجودة`)
    }
    if (!schema.navigation?.brand?.trim()) problems.push('اسم العلامة فارغ')
    checks.push(
      problems.length
        ? error(id, label, problems.join('، '))
        : ok(id, label, `${schema.navigation?.items?.length ?? 0} عنصراً في القائمة الرئيسية`)
    )
  }

  // ---------- 4. الألوان ----------
  {
    const id = 'theme'
    const label = 'الألوان'
    const problems: string[] = []
    for (const key of THEME_COLOR_KEYS) {
      const v = schema.theme?.[key]
      if (typeof v !== 'string' || !HEX_RE.test(v)) {
        problems.push(`${key}: «${String(v)}» ليس لوناً صالحاً`)
      }
    }
    if (typeof schema.theme?.radius !== 'number' || schema.theme.radius < 0 || schema.theme.radius > 40) {
      problems.push('نصف قطر الحواف غير صالح')
    }
    checks.push(
      problems.length ? error(id, label, problems.join('، ')) : ok(id, label, 'هوية لونية سليمة')
    )
  }

  // ---------- 5. البيانات ----------
  {
    const id = 'entities'
    const label = 'البيانات'
    const refs = collectEntityRefs(schema.pages ?? [])
    const known = schema.mockData?.entities ?? {}
    const problems: string[] = []
    const seen = new Set<string>()
    for (const ref of refs) {
      if (!known[ref.entity]) problems.push(`${ref.where} يستعمل كياناً غير موجود: «${ref.entity}»`)
      seen.add(ref.entity)
    }
    const entityCount = Object.keys(known).length
    checks.push(
      problems.length
        ? error(id, label, problems.join('، '))
        : ok(id, label, `${entityCount} كياناً متاحاً${seen.size ? ` — ${seen.size} مستعملاً` : ''}`)
    )
  }

  // ---------- 6. قائمة لوحة التحكم ----------
  {
    const id = 'dashboard-nav'
    const label = 'قائمة لوحة التحكم'
    const pageIds = new Set((schema.pages ?? []).map((p) => p.id))
    const problems: string[] = []
    const items = schema.dashboardNav?.items ?? []
    if (items.length === 0) {
      problems.push('القائمة فارغة — لا يمكن التنقل داخل لوحة التحكم')
    }
    for (const item of items) {
      if (!pageIds.has(item.pageId)) problems.push(`عنصر «${item.label}» يشير إلى صفحة غير موجودة`)
    }
    checks.push(
      problems.length ? error(id, label, problems.join('، ')) : ok(id, label, `${items.length} عنصراً في قائمة اللوحة`)
    )
  }

  // ---------- 7. أقسام HTML المخصصة ----------
  {
    const id = 'custom-html'
    const label = 'أقسام HTML المخصصة'
    const problems: string[] = []
    let count = 0
    for (const page of schema.pages ?? []) {
      for (const block of page.blocks ?? []) {
        if (block.type !== 'custom-html') continue
        count++
        const html = block.props?.['html']
        if (typeof html !== 'string' || !html.trim() || !html.includes('<')) {
          problems.push(`قسم HTML فارغ في صفحة «${page.name}»`)
        }
      }
    }
    checks.push(
      problems.length
        ? error(id, label, problems.slice(0, 4).join('، '))
        : ok(id, label, count ? `${count} قسماً بكود HTML سليم` : 'لا توجد أقسام HTML مخصصة')
    )
  }

  const okAll = checks.every((c) => c.status === 'ok')
  return { ok: okAll, checks }
}
