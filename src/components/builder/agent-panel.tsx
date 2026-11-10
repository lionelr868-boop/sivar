'use client'

// لوحة المساعد الذكي: محادثة + اقتراحات + مؤشّر تنفيذ + ملخّص التغييرات
import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Bot, Check, Loader2, Send, Sparkles, Trash2, User } from 'lucide-react'

const SUGGESTIONS = [t.builder.agentSuggest1, t.builder.agentSuggest2, t.builder.agentSuggest3, t.builder.agentSuggest4]

export function AgentPanel() {
  const agentMessages = useAppStore((s) => s.agentMessages)
  const agentBusy = useAppStore((s) => s.agentBusy)
  const sendAgent = useAppStore((s) => s.sendAgent)
  const clearAgentMessages = useAppStore((s) => s.clearAgentMessages)
  const dirty = useAppStore((s) => s.dirty)
  const saveProject = useAppStore((s) => s.saveProject)

  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [agentMessages, agentBusy])

  const send = (text: string) => {
    const value = text.trim()
    if (!value || agentBusy) return
    setDraft('')
    void sendAgent(value)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* رأس اللوحة */}
      <div className="flex items-start gap-3 border-b p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Bot className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-tight">{t.builder.agentTitle}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{t.builder.agentSubtitle}</p>
        </div>
        {agentMessages.length > 0 ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-md text-muted-foreground hover:text-destructive"
            onClick={clearAgentMessages}
            aria-label={t.common.delete}
            title={t.common.delete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        ) : null}
      </div>

      {/* المحادثة */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-3" aria-live="polite">
        {agentMessages.length === 0 && !agentBusy ? (
          <div className="space-y-4 py-4 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-secondary text-secondary-foreground">
              <Sparkles className="size-6" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium">{t.builder.agentSubtitle}</p>
              <p className="text-xs text-muted-foreground">{t.builder.agentPlaceholder}</p>
            </div>
            <div className="space-y-1.5 pt-1 text-start">
              <p className="text-[11px] font-medium text-muted-foreground">{t.builder.agentSuggestions}</p>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="w-full rounded-lg border bg-card px-3 py-2 text-start text-xs hover:border-primary/40 hover:bg-secondary/60"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {agentMessages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="flex justify-end gap-2">
                  <div className="max-w-[85%] rounded-xl rounded-ss-sm bg-primary px-3 py-2 text-sm leading-relaxed text-primary-foreground">
                    {m.text}
                  </div>
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                    <User className="size-3.5" />
                  </span>
                </div>
              ) : (
                <div key={m.id} className="flex gap-2">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Bot className="size-3.5" />
                  </span>
                  <div className="max-w-[85%] space-y-1.5">
                    <div className="rounded-xl rounded-se-sm bg-muted px-3 py-2 text-sm leading-relaxed text-foreground">
                      {m.text}
                    </div>
                    {m.actions && m.actions.length > 0 ? (
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-muted-foreground">{t.builder.agentActionsDone}</p>
                        {m.actions.map((a, i) => (
                          <div key={i} className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                            <Check className="size-3 shrink-0" />
                            <span className="truncate">{a}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            )}

            {agentBusy ? (
              <div className="flex gap-2">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Bot className="size-3.5" />
                </span>
                <div className="flex items-center gap-2 rounded-xl rounded-se-sm bg-muted px-3 py-2.5">
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">{t.builder.agentThinking}</span>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* حفظ بعد تعديلات المساعد */}
      {dirty && !agentBusy ? (
        <div className="border-t bg-secondary/40 px-3 py-2">
          <Button size="sm" variant="outline" className="h-8 w-full gap-1.5 text-xs" onClick={() => void saveProject()}>
            <Check className="size-3.5" />
            {t.builder.saveBtn}
          </Button>
        </div>
      ) : null}

      {/* الإدخال */}
      <form
        className="border-t p-2.5"
        onSubmit={(e) => {
          e.preventDefault()
          send(draft)
        }}
      >
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(draft)
            }
          }}
          placeholder={t.builder.agentPlaceholder}
          className="min-h-[2.75rem] resize-none bg-card text-sm"
          rows={2}
          disabled={agentBusy}
          aria-label={t.builder.agentSubtitle}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Enter = {t.builder.agentSend}</span>
          <Button type="submit" size="sm" className="h-8 gap-1.5" disabled={agentBusy || !draft.trim()}>
            {agentBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5 scale-x-[-1]" />}
            {t.builder.agentSend}
          </Button>
        </div>
      </form>
    </div>
  )
}
