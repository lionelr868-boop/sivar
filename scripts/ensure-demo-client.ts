// ============================================================
// SIVAR — سكربت الجولة 16: ضمان فضاء الزبون في مشاريع الحساب التجريبي
// لكل مشاريع demo@sivar.dz:
//  1) إضافة صفحة «حسابي» (audience=client + عنصر شريطها) إن لم توجد —
//     بنفس الدالة المشتركة ensureClientAreaPage المستعملة في القوالب.
//  2) جعل أول صفّين من كيان النشاط (orders→bookings→appointments)
//     للزبونة التجريبية (عمود avatar === أمينة بلقاسم) إن لم يكن
//     فيها أي صف لها.
// ثم يحفظ schemaJson ويحدّث updatedAt — ويسجل النتائج.
// تشغيل: bun scripts/ensure-demo-client.ts
// ============================================================
import { db } from '../src/lib/db'
import { clientActivityEntity, ensureClientAreaPage } from '../src/lib/project/client-area'
import { DEMO_CLIENT_NAME } from '../src/lib/content/mock-data'
import type { ProjectSchema } from '../src/lib/types'

const DEMO_EMAIL = 'demo@sivar.dz'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

async function main(): Promise<void> {
  const demoUser = await db.user.findUnique({ where: { email: DEMO_EMAIL } })
  if (!demoUser) {
    console.log(`لم أجد حساب «${DEMO_EMAIL}» — لا شيء لتحديثه.`)
    return
  }

  const projects = await db.project.findMany({
    where: { userId: demoUser.id },
    orderBy: { createdAt: 'asc' },
  })
  console.log(`مشاريع «${DEMO_EMAIL}»: ${projects.length}`)

  let touched = 0
  for (const project of projects) {
    let schema: ProjectSchema
    try {
      schema = JSON.parse(project.schemaJson) as ProjectSchema
      if (!schema || !Array.isArray(schema.pages)) throw new Error('بنية تالفة')
    } catch {
      console.log(`— «${project.name}»: مخطط تالف — تخطّيت المشروع`)
      continue
    }

    // ---- 1) صفحة «حسابي» (فضاء الزبون) ----
    const before = schema
    const ensured = ensureClientAreaPage(schema)
    const addedPage = ensured.schema !== before
    schema = ensured.schema

    // ---- 2) صفوف الزبونة التجريبية في كيان النشاط ----
    const entityKey = clientActivityEntity(schema)
    const entity = schema.mockData?.entities?.[entityKey]
    let patchedRows = 0
    if (entity && Array.isArray(entity.columns) && entity.columns.length > 0) {
      const avatarCol = entity.columns.find((c) => c && c.type === 'avatar')
      const rows = Array.isArray(entity.rows) ? entity.rows : []
      const hasClientRow = rows.some((row) => isRecord(row) && row[avatarCol?.key ?? ''] === DEMO_CLIENT_NAME)
      if (avatarCol && !hasClientRow) {
        for (const row of rows.slice(0, 2)) {
          if (isRecord(row)) {
            row[avatarCol.key] = DEMO_CLIENT_NAME
            patchedRows++
          }
        }
      }
    }

    const changed = addedPage || patchedRows > 0
    if (changed) {
      await db.project.update({
        where: { id: project.id },
        data: { schemaJson: JSON.stringify(schema), updatedAt: new Date() },
      })
      touched++
    }

    const parts: string[] = [addedPage ? 'أُضيفت صفحة «حسابي»' : 'صفحة «حسابي» موجودة مسبقاً']
    if (patchedRows > 0) parts.push(`صُبغ ${patchedRows} صفوف لكيان «${entityKey}» للزبونة التجريبية`)
    if (!changed) parts.push('لا تغيير')
    console.log(`— «${project.name}»: ${parts.join(' | ')}`)
  }

  console.log(`اكتمل: حُدّث ${touched} من ${projects.length} مشروعاً.`)
}

main()
  .catch((e) => {
    console.error('فشل السكربت:', e)
    process.exitCode = 1
  })
  .finally(() => {
    void db.$disconnect()
  })
