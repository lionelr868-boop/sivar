'use client'
import type { ReactElement } from 'react'

// ============================================================
// نموذج — PAvatar: دائرة الأحرف الأولى بلون ثابت مشتق من الاسم
// ============================================================

const AVATAR_TONES: string[] = ['#0d9488', '#7c5cd6', '#c2610c', '#bd4b7f', '#3d6bd6', '#6a8f1f']

function hashName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0
  }
  return h
}

/** الأحرف الأولى (حرفان كحد أقصى) من الاسم العربي */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '؟'
  if (parts.length === 1) return parts[0].slice(0, 2)
  return (parts[0][0] ?? '') + (parts[1][0] ?? '')
}

export function PAvatar({
  name,
  size = 36,
  className = '',
}: {
  name: string
  size?: number
  className?: string
}): ReactElement {
  const tone = AVATAR_TONES[hashName(name || '؟') % AVATAR_TONES.length]
  return (
    <span
      role="img"
      aria-label={name || 'مستخدم'}
      title={name || 'مستخدم'}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white select-none ${className}`}
      style={{
        width: size,
        height: size,
        background: tone,
        fontSize: Math.max(10, Math.round(size * 0.38)),
      }}
    >
      {initialsOf(name)}
    </span>
  )
}
