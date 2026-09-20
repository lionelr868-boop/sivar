// ============================================================
// SIVAR — GET/POST /api/snippets
// Task 7-e — مكتبة HTML: قائمة الأكواد / إضافة كود جديد
// ============================================================
import { NextResponse } from 'next/server'
import type { HtmlSnippet } from '@prisma/client'
import { db } from '@/lib/db'
import { getSessionUserId } from '@/lib/server/session'
import type { HtmlSnippetDTO, HtmlSnippetKind } from '@/lib/types'

const MAX_BODY_BYTES = 512 * 1024 // 512KB — كود HTML لن يتجاوز ذلك
const MAX_HTML_CHARS = 200_000
const SNIPPET_KINDS: string[] = ['landing', 'dashboard', 'section']

function snippetToDTO(snippet: HtmlSnippet): HtmlSnippetDTO {
  return {
    id: snippet.id,
    name: snippet.name,
    kind: snippet.kind as HtmlSnippetKind,
    html: snippet.html,
    createdAt: snippet.createdAt.toISOString(),
    updatedAt: snippet.updatedAt.toISOString(),
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }
    const snippets = await db.htmlSnippet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ snippets: snippets.map(snippetToDTO) })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }

    const rawBody = await request.text()
    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'الكود كبير جداً (الحد 500KB)' }, { status: 413 })
    }
    const body = (JSON.parse(rawBody || '{}') as Record<string, unknown>) ?? {}

    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : ''
    if (!name) {
      return NextResponse.json({ error: 'أدخل اسماً للكود' }, { status: 400 })
    }

    const kindRaw = typeof body.kind === 'string' ? body.kind : 'section'
    const kind = SNIPPET_KINDS.includes(kindRaw) ? kindRaw : 'section'

    const html = typeof body.html === 'string' ? body.html : ''
    if (!html.trim() || !html.includes('<')) {
      return NextResponse.json({ error: 'الرجاء إدخال كود HTML صالح' }, { status: 400 })
    }
    if (html.length > MAX_HTML_CHARS) {
      return NextResponse.json({ error: 'الكود أطول من الحد المسموح (200 ألف حرف)' }, { status: 413 })
    }

    const snippet = await db.htmlSnippet.create({
      data: { userId, name, kind, html },
    })
    return NextResponse.json({ snippet: snippetToDTO(snippet) })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
