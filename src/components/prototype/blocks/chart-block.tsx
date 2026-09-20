'use client'
import type { ReactElement } from 'react'

// ============================================================
// SIVAR — مكوّن الرسم البياني (أعمدة / خطي / دائري)
// المصدر: props.data أو schema.mockData.charts[dataKey]
// ============================================================
import type { Block } from '@/lib/types'
import type { ChartType } from '@/lib/types'
import { BarChart } from '../charts/bar-chart'
import { ChartFrame } from '../charts/chart-frame'
import { DonutChart } from '../charts/donut-chart'
import { LineChart } from '../charts/line-chart'
import { PEmptyState } from '../ui/p-states'
import { L, N, S, iN, iS, type BlockCtx } from './shared'

function readData(block: Block, ctx: BlockCtx): Array<{ label: string; value: number }> {
  const inline = L(block.props, 'data')
  if (inline.length > 0) {
    return inline.map((d) => ({ label: iS(d, 'label'), value: iN(d, 'value') }))
  }
  const key = S(block.props, 'dataKey')
  if (key && ctx.schema.mockData.charts[key]) {
    return ctx.schema.mockData.charts[key].data.map((d) => ({ label: d.label, value: d.value }))
  }
  return []
}

export function ChartBlock({ block, ctx }: { block: Block; ctx: BlockCtx }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const dataKey = S(p, 'dataKey')
  const chartType = (['bar', 'line', 'donut'] as const).includes(S(p, 'chartType') as ChartType)
    ? (S(p, 'chartType') as ChartType)
    : 'bar'
  const height = N(p, 'height', 260)

  const data = readData(block, ctx)
  const resolvedTitle = title || (dataKey && ctx.schema.mockData.charts[dataKey]?.title) || ''

  if (data.length === 0) {
    return (
      <ChartFrame title={resolvedTitle}>
        <PEmptyState title="لا توجد بيانات للرسم" subtitle="أضف بيانات تجريبية أو اختر مصدراً آخر." />
      </ChartFrame>
    )
  }

  return (
    <ChartFrame title={resolvedTitle}>
      {chartType === 'donut' ? (
        <DonutChart data={data} />
      ) : chartType === 'line' ? (
        <LineChart data={data} height={height} />
      ) : (
        <BarChart data={data} height={height} />
      )}
    </ChartFrame>
  )
}
