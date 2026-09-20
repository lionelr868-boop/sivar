'use client'
import type { ReactElement } from 'react'

// ============================================================
// نموذج — مكوّنات الحالات: فارغ / تحميل / خطأ
// ============================================================
import type { Block } from '@/lib/types'
import { PEmptyState, PErrorState, PLoadingState } from '../ui/p-states'
import { S } from './shared'

export function EmptyStateBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  return (
    <PEmptyState
      title={S(p, 'title', 'لا توجد بيانات بعد')}
      subtitle={S(p, 'subtitle') || undefined}
      actionText={S(p, 'actionText') || undefined}
    />
  )
}

export function LoadingStateBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  return <PLoadingState label={S(p, 'label', 'جارٍ التحميل...')} />
}

export function ErrorStateBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  return (
    <PErrorState
      title={S(p, 'title', 'حدث خطأ ما')}
      subtitle={S(p, 'subtitle') || undefined}
      actionText={S(p, 'actionText') || undefined}
    />
  )
}
