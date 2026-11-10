'use client'

// اللوحة اليمنى (نهاية الشاشة): تبويبات المساعد/الخصائص/التصميم/الإصدارات
import { useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'
import { Bot, History, Palette, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AgentPanel } from './agent-panel'
import { PropertiesPanel } from './properties-panel'
import { ThemePanel } from './theme-panel'
import { HistoryPanel } from './history-panel'

type Tab = 'agent' | 'properties' | 'theme' | 'history'

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'agent', label: t.builder.agentTab, icon: Bot },
  { id: 'properties', label: t.builder.propertiesTab, icon: SlidersHorizontal },
  { id: 'theme', label: t.builder.themeTab, icon: Palette },
  { id: 'history', label: t.builder.historyTab, icon: History },
]

export function RightPanel({ forceTab }: { forceTab?: Tab }) {
  const rightPanel = useAppStore((s) => s.rightPanel)
  const setRightPanel = useAppStore((s) => s.setRightPanel)
  const active = forceTab ?? rightPanel

  // عند فرض تبويب (أوراق الجوال) لا نغيّر حالة المتجر
  useEffect(() => {
    if (forceTab) return
  }, [forceTab])

  return (
    <div className="flex h-full min-h-0 flex-col bg-card/40">
      <div className="flex shrink-0 items-center gap-1 border-b px-2 py-1.5" role="tablist" aria-label={t.builder.agentTitle}>
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                if (!forceTab) setRightPanel(tab.id)
              }}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors',
                isActive ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
              )}
            >
              <Icon className="size-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto" role="tabpanel">
        {active === 'agent' ? <AgentPanel /> : null}
        {active === 'properties' ? <PropertiesPanel /> : null}
        {active === 'theme' ? <ThemePanel /> : null}
        {active === 'history' ? <HistoryPanel /> : null}
      </div>
    </div>
  )
}
