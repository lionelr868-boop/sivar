'use client'

// لوحة نظام التصميم: الشعار + خلفية المشروع + ألوان/خطوط/زوايا/ظلال + أنماط جاهزة + وضع ليلي
import { useRef, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'
import { type ProjectTheme, type ProjectSchema } from '@/lib/types'
import { updateThemeInSchema } from '@/lib/project/tools'
import { IMAGE_MAX_BYTES, processImageFile } from '@/lib/client-image'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImagePlus, Loader2, Moon, Palette, Sun, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PalettePreset {
  id: string
  label: string
  theme: Partial<ProjectTheme>
}

const PRESETS: PalettePreset[] = [
  {
    id: 'violet',
    label: t.builder.presetViolet,
    theme: { primary: '#7c3aed', primaryForeground: '#ffffff', secondary: '#f2eefd', accent: '#ede9fe', background: '#fafafa', surface: '#ffffff', text: '#1c1726', mutedText: '#6e6880', border: '#eae7f0' },
  },
  {
    id: 'teal',
    label: t.builder.presetTeal,
    theme: { primary: '#0d9488', primaryForeground: '#ffffff', secondary: '#e6f5f3', accent: '#ccfbf1', background: '#f8fafa', surface: '#ffffff', text: '#12211f', mutedText: '#5d716e', border: '#d9e8e6' },
  },
  {
    id: 'bluedark',
    label: t.builder.presetBlueDark,
    theme: { primary: '#2563eb', primaryForeground: '#ffffff', secondary: '#e8eefb', accent: '#dbeafe', background: '#f7f9fc', surface: '#ffffff', text: '#0f1b2d', mutedText: '#5b6b82', border: '#dde5f0' },
  },
  {
    id: 'amber',
    label: t.builder.presetAmber,
    theme: { primary: '#b45309', primaryForeground: '#ffffff', secondary: '#fbf0dd', accent: '#fef3c7', background: '#fbfaf7', surface: '#ffffff', text: '#241a0c', mutedText: '#756447', border: '#eee2cc' },
  },
  {
    id: 'rose',
    label: t.builder.presetRose,
    theme: { primary: '#be185d', primaryForeground: '#ffffff', secondary: '#fbe9f0', accent: '#fce7f3', background: '#fdf9fb', surface: '#ffffff', text: '#27101b', mutedText: '#755663', border: '#f0dbe4' },
  },
  {
    id: 'green',
    label: t.builder.presetGreen,
    theme: { primary: '#15803d', primaryForeground: '#ffffff', secondary: '#e7f5ec', accent: '#dcfce7', background: '#f9fbf9', surface: '#ffffff', text: '#0f1f14', mutedText: '#5b7263', border: '#dbe9de' },
  },
]

const FONTS: { value: ProjectTheme['fontFamily']; label: string }[] = [
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
  { value: 'Tajawal', label: 'Tajawal' },
  { value: 'Cairo', label: 'Cairo' },
]

const SHADOWS: { value: ProjectTheme['shadow']; label: string }[] = [
  { value: 'none', label: t.builder.shadowNone },
  { value: 'sm', label: t.builder.shadowSm },
  { value: 'md', label: t.builder.shadowMd },
  { value: 'lg', label: t.builder.shadowLg },
]

// ============================================================
// الشعار — رفع/استبدال/إزالة (تصغير عبر canvas بحد 512px)
// ============================================================
const LOGO_MAX_BYTES = 3 * 1024 * 1024
const LOGO_MAX_DIMENSION = 512

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('read-error'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image-error'))
    img.src = src
  })
}

/** تصغير الصورة عبر canvas (أقصى بُعد 512px مع الحفاظ على النسبة) — SVG يُقرأ كما هو */
async function processLogoFile(file: File): Promise<string> {
  const dataUrl = await readAsDataUrl(file)
  const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)
  if (isSvg) return dataUrl
  const img = await loadImage(dataUrl)
  const naturalW = img.naturalWidth || LOGO_MAX_DIMENSION
  const naturalH = img.naturalHeight || LOGO_MAX_DIMENSION
  const scale = Math.min(1, LOGO_MAX_DIMENSION / Math.max(naturalW, naturalH))
  const w = Math.max(1, Math.round(naturalW * scale))
  const h = Math.max(1, Math.round(naturalH * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/png')
}

/** خلفية رقاعية شفافة لمعاينة الشعار (تظهر الحواف الشفافة) */
const CHECKERBOARD_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--muted)',
  backgroundImage:
    'repeating-conic-gradient(color-mix(in srgb, var(--foreground) 8%, transparent) 0% 25%, transparent 0% 50%)',
  backgroundSize: '16px 16px',
}

function LogoSection() {
  const schema = useAppStore((s) => s.schema)
  const applySchemaFn = useAppStore((s) => s.applySchemaFn)
  const [processing, setProcessing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!schema) return null
  const logo = schema.branding?.logo
  const logoName = schema.branding?.logoName

  const handleFile = async (file: File) => {
    if (file.size > LOGO_MAX_BYTES) {
      toast.error(t.builder.logoTooLarge)
      return
    }
    setProcessing(true)
    try {
      const dataUrl = await processLogoFile(file)
      applySchemaFn((s) => ({
        ...s,
        branding: { ...(s.branding ?? {}), logo: dataUrl, logoName: file.name },
      }))
      toast.success(t.builder.logoUploaded)
    } catch {
      toast.error(t.common.error)
    } finally {
      setProcessing(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeLogo = () => {
    applySchemaFn((s) => ({
      ...s,
      branding: { ...(s.branding ?? {}), logo: undefined, logoName: undefined },
    }))
  }

  return (
    <section className="space-y-3 rounded-xl border bg-card p-3" aria-label={t.builder.logoSection}>
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t.builder.logoSection}</h4>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />

      {logo ? (
        <div className="space-y-3">
          <div className="grid place-items-center rounded-lg border p-3" style={CHECKERBOARD_STYLE}>
            <img src={logo} alt={logoName ?? t.builder.logoSection} className="h-12 max-w-[180px] object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 flex-1 gap-1.5 text-xs"
              onClick={() => fileRef.current?.click()}
              disabled={processing}
            >
              {processing ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
              {t.builder.logoReplace}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-xs text-destructive hover:text-destructive"
              onClick={removeLogo}
              disabled={processing}
            >
              <Trash2 className="size-4" />
              {t.builder.logoRemove}
            </Button>
          </div>
          {logoName ? (
            <p className="truncate text-center text-[11px] text-muted-foreground" title={logoName}>
              {logoName}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full gap-2"
            onClick={() => fileRef.current?.click()}
            disabled={processing}
          >
            {processing ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {t.builder.logoUploadBtn}
          </Button>
          <p className="text-xs leading-relaxed text-muted-foreground">{t.builder.logoHint}</p>
        </div>
      )}
    </section>
  )
}

// ============================================================
// خلفية المشروع — رفع/استبدال/إزالة + قوة الظهور (Task 9-a)
// نفس معالجة الصور المشتركة (client-image): ≤5MB + تصغير 1600px
// ============================================================

type ProjectBgOverlay = NonNullable<ProjectSchema['branding']>['bgOverlay']

const PROJECT_BG_OVERLAYS: { value: Exclude<ProjectBgOverlay, undefined>; label: string }[] = [
  { value: 'strong', label: t.builder.projectBgOverlayStrong },
  { value: 'medium', label: t.builder.projectBgOverlayMedium },
  { value: 'soft', label: t.builder.projectBgOverlaySoft },
  { value: 'none', label: t.builder.projectBgOverlayNone },
]

function ProjectBgSection() {
  const schema = useAppStore((s) => s.schema)
  const applySchemaFn = useAppStore((s) => s.applySchemaFn)
  const [processing, setProcessing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!schema) return null
  const bgImage = schema.branding?.bgImage
  const bgImageName = schema.branding?.bgImageName
  const bgOverlay = schema.branding?.bgOverlay ?? 'medium'

  const handleFile = async (file: File) => {
    if (file.size > IMAGE_MAX_BYTES) {
      toast.error(t.builder.projectBgTooLarge)
      return
    }
    setProcessing(true)
    try {
      const dataUrl = await processImageFile(file)
      applySchemaFn((s) => ({
        ...s,
        branding: {
          ...(s.branding ?? {}),
          bgImage: dataUrl,
          bgImageName: file.name,
          bgOverlay: s.branding?.bgOverlay ?? 'medium',
        },
      }))
      toast.success(t.builder.projectBgUploaded)
    } catch {
      toast.error(t.builder.projectBgInvalid)
    } finally {
      setProcessing(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeBg = () => {
    applySchemaFn((s) => ({
      ...s,
      branding: { ...(s.branding ?? {}), bgImage: undefined, bgImageName: undefined },
    }))
  }

  const setOverlay = (value: string) => {
    const next = value as NonNullable<ProjectSchema['branding']>['bgOverlay']
    applySchemaFn((s) => ({
      ...s,
      branding: { ...(s.branding ?? {}), bgOverlay: next },
    }))
  }

  return (
    <section className="space-y-3 rounded-xl border bg-card p-3" aria-label={t.builder.projectBgSection}>
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t.builder.projectBgSection}</h4>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />

      {bgImage ? (
        <div className="space-y-3">
          <div
            role="img"
            aria-label={t.builder.projectBgSection}
            className="h-28 w-full rounded-lg border bg-cover bg-center bg-muted/40"
            style={{ backgroundImage: `url("${bgImage}")` }}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 flex-1 gap-1.5 text-xs"
              onClick={() => fileRef.current?.click()}
              disabled={processing}
            >
              {processing ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
              {t.builder.projectBgReplace}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-xs text-destructive hover:text-destructive"
              onClick={removeBg}
              disabled={processing}
            >
              <Trash2 className="size-4" />
              {t.builder.projectBgRemove}
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t.builder.projectBgOverlay}</Label>
            <Select value={bgOverlay} onValueChange={setOverlay}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_BG_OVERLAYS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {bgImageName ? (
            <p className="truncate text-center text-[11px] text-muted-foreground" title={bgImageName}>
              {bgImageName}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full gap-2"
            onClick={() => fileRef.current?.click()}
            disabled={processing}
          >
            {processing ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {t.builder.projectBgUploadBtn}
          </Button>
          <p className="text-xs leading-relaxed text-muted-foreground">{t.builder.projectBgHint}</p>
        </div>
      )}
    </section>
  )
}

export function ThemePanel() {
  const schema = useAppStore((s) => s.schema)
  const applySchemaFn = useAppStore((s) => s.applySchemaFn)
  if (!schema) return null
  const theme = schema.theme

  const setTheme = (patch: Partial<ProjectTheme>) => {
    applySchemaFn((s) => updateThemeInSchema(s, patch))
  }

  return (
    <div className="space-y-5 p-3">
      <div className="flex items-center gap-2.5 rounded-xl border bg-card p-3">
        <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Palette className="size-5" />
        </span>
        <div>
          <h4 className="text-sm font-semibold">{t.builder.themeTitle}</h4>
          <p className="text-[11px] text-muted-foreground">{t.builder.themeSubtitle}</p>
        </div>
      </div>

      {/* الشعار */}
      <LogoSection />

      {/* خلفية المشروع كلّه (Task 9) */}
      <ProjectBgSection />

      {/* أنماط جاهزة */}
      <section className="space-y-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t.builder.presetsGroup}</h4>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setTheme(p.theme)}
              className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-2 text-start text-xs font-medium transition-colors hover:border-primary/40 hover:bg-secondary/60"
            >
              <span
                className="size-5 shrink-0 rounded-md"
                style={{
                  background: `linear-gradient(135deg, ${(p.theme.primary ?? '#7c3aed')} 55%, ${(p.theme.accent ?? '#fff')} 55%)`,
                  border: '1px solid rgba(0,0,0,.08)',
                }}
                aria-hidden="true"
              />
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {/* الألوان */}
      <section className="space-y-3 rounded-xl border bg-card p-3">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t.builder.colorsGroup}</h4>
        <ColorRow label={t.builder.primaryColor} value={theme.primary} onChange={(v) => setTheme({ primary: v })} />
        <ColorRow label={t.builder.secondaryColor} value={theme.secondary} onChange={(v) => setTheme({ secondary: v })} />
        <ColorRow label={t.builder.accentColor} value={theme.accent} onChange={(v) => setTheme({ accent: v })} />
        <ColorRow label={t.builder.backgroundColor} value={theme.background} onChange={(v) => setTheme({ background: v })} />
        <ColorRow label={t.builder.surfaceColor} value={theme.surface} onChange={(v) => setTheme({ surface: v })} />
        <ColorRow label={t.builder.textColor} value={theme.text} onChange={(v) => setTheme({ text: v })} />
        <ColorRow label={t.builder.borderColor} value={theme.border} onChange={(v) => setTheme({ border: v })} />
      </section>

      {/* الخطوط والأشكال */}
      <section className="space-y-3 rounded-xl border bg-card p-3">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t.builder.typographyGroup}</h4>
        <div className="space-y-1.5">
          <Label className="text-xs">{t.builder.fontFamily}</Label>
          <Select value={theme.fontFamily} onValueChange={(v) => setTheme({ fontFamily: v as ProjectTheme['fontFamily'] })}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((f) => (
                <SelectItem key={f.value} value={f.value} className="text-xs">
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs flex justify-between">
            <span>{t.builder.radius}</span>
            <span className="text-muted-foreground" dir="ltr">{theme.radius}px</span>
          </Label>
          <Slider value={[theme.radius]} min={0} max={24} step={2} onValueChange={([v]) => setTheme({ radius: v })} aria-label={t.builder.radius} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t.builder.shadow}</Label>
          <Select value={theme.shadow} onValueChange={(v) => setTheme({ shadow: v as ProjectTheme['shadow'] })}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHADOWS.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* الوضع */}
      <section className="space-y-2 rounded-xl border bg-card p-3">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t.builder.modeGroup}</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant={theme.mode === 'light' ? 'default' : 'outline'} className="h-16 flex-col gap-1.5" onClick={() => setTheme({ mode: 'light' })}>
            <Sun className="size-5" />
            <span className="text-xs">{t.builder.lightMode}</span>
          </Button>
          <Button type="button" variant={theme.mode === 'dark' ? 'default' : 'outline'} className="h-16 flex-col gap-1.5" onClick={() => setTheme({ mode: 'dark' })}>
            <Moon className="size-5" />
            <span className="text-xs">{t.builder.darkMode}</span>
          </Button>
        </div>
      </section>
    </div>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const hex = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#7c3aed'
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={hex}
        onChange={(e) => onChange(e.target.value)}
        className="size-8 shrink-0 cursor-pointer rounded-md border bg-card p-0.5"
        aria-label={label}
      />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <Label className="truncate text-xs">{label}</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-24 shrink-0 font-mono text-[11px]"
          dir="ltr"
        />
      </div>
    </div>
  )
}

// تصدير للاستخدام في مكان آخر إذا لزم
export type { ProjectSchema }
export { cn }
