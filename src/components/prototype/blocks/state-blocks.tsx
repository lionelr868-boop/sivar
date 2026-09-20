'use client'
import type { ReactElement } from 'react'

// ============================================================
// نموذج — مكوّنات الحالات: فارغ / تحميل / خطأ
// Task 8-a — زر الإجراء يعمل: ينقل إلى لوحة التحكم داخل
// صفحات اللوحات، وإلا إلى الصفحة الرئيسية.
// ============================================================
import type { Block } from '@/lib/types'
import { PEmptyState, PErrorState, PLoadingState } from '../ui/p-states'
import { stateActionTarget } from '@/lib/project/nav-targets'
import { S, type BlockCtx } from './shared'

const DASHBOARD_PAGE_TYPES = ['dashboard', 'table', 'form', 'settings', 'profile']

/** هل تقع الكتلة داخل صفحة لوحة؟ */
function insideDashboard(ctx: BlockCtx, blockId: string): boolean {
  return (ctx.schema.pages ?? []).some(
    (pg) => DASHBOARD_PAGE_TYPES.includes(pg.type) && (pg.blocks ?? []).some((b) => b.id === blockId)
  )
}

/** معالج إجراء الحالة (وضع المعاينة فقط) */
function makeStateAction(ctx: BlockCtx, blockId: string): (() => void) | undefined {
  if (!ctx.interactive || !ctx.onNavigate) return undefined
  const target = stateActionTarget(ctx.schema, insideDashboard(ctx, blockId))
  if (!target) return undefined
  return () => ctx.onNavigate?.(target)
}

export function EmptyStateBlock({ block, ctx }: { block: Block; ctx: BlockCtx }): ReactElement {
  const p = block.props
  return (
    <PEmptyState
      title={S(p, 'title', 'لا توجد بيانات بعد')}
      subtitle={S(p, 'subtitle') || undefined}
      actionText={S(p, 'actionText') || undefined}
      onAction={makeStateAction(ctx, block.id)}
    />
  )
}

export function LoadingStateBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  return <PLoadingState label={S(p, 'label', 'جارٍ التحميل...')} />
}

export function ErrorStateBlock({ block, ctx }: { block: Block; ctx: BlockCtx }): ReactElement {
  const p = block.props
  return (
    <PErrorState
      title={S(p, 'title', 'حدث خطأ ما')}
      subtitle={S(p, 'subtitle') || undefined}
      actionText={S(p, 'actionText') || undefined}
      onAction={makeStateAction(ctx, block.id)}
    />
  )
}
