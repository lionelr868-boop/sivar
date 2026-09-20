'use client'

// نافذة «حفظ كقالب» — تحفظ المشروع الحالي كقالب في «قوالبي»
// تُفرِّغ أولاً التغييرات المحلية (PATCH للمخطط) لأن واجهة القوالب
// تقرأ المخطط المخزّن على الخادم.
import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import * as api from '@/lib/api-client'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Bookmark, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function SaveTemplateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const projectId = useAppStore((s) => s.projectId)
  const schema = useAppStore((s) => s.schema)
  const dirty = useAppStore((s) => s.dirty)
  const saveProject = useAppStore((s) => s.saveProject)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // تعبئة الاسم باسم المشروع الحالي عند الفتح
  useEffect(() => {
    if (open) {
      setName(schema?.metadata.name ?? '')
      setDescription('')
    }
  }, [open, schema?.metadata.name])

  const handleSave = async () => {
    if (!projectId || saving) return
    const templateName = name.trim()
    if (!templateName) {
      toast.error(t.common.required)
      return
    }
    setSaving(true)
    try {
      // 1) تفريغ التغييرات المحلية أولاً — القالب يُبنى من مخطط الخادم
      if (dirty) {
        await saveProject()
        if (useAppStore.getState().dirty) {
          // فشل الحفظ (أُظهر الخطأ بالفعل) — لا نُنشئ قالباً من نسخة قديمة
          setSaving(false)
          return
        }
      }
      // 2) حفظ القالب
      await api.saveProjectAsTemplate(projectId, {
        name: templateName,
        description: description.trim() || undefined,
      })
      toast.success(t.builder.saveTemplateSuccess)
      onOpenChange(false)
    } catch (e) {
      toast.error((e as Error).message || t.common.error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="size-4 text-primary" />
            {t.builder.saveTemplateTitle}
          </DialogTitle>
          <DialogDescription>{t.builder.saveTemplateDesc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="template-name">{t.builder.templateNameLabel}</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="template-desc" className="flex items-center gap-1.5">
              {t.builder.templateDescLabel}
              <span className="text-[11px] font-normal text-muted-foreground/70">({t.common.optional})</span>
            </Label>
            <Textarea
              id="template-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.builder.templateDescPlaceholder}
              className="min-h-20 text-xs leading-relaxed"
              maxLength={300}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving || !projectId}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Bookmark className="size-4" />}
            {saving ? t.builder.saving : t.builder.saveTemplateConfirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
