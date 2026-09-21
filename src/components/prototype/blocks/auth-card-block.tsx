'use client'

// ============================================================
// SIVAR — بطاقة الدخول / إنشاء الحساب / استعادة كلمة المرور
// (الجولة 16) محدد الأدوار في variant=login عند وجود صفحة فضاء
// الزبون: «كزبون» → حسابي، «كمدير» → لوحة تحكم المدير الكاملة.
// ============================================================
import { type ReactElement, useState } from 'react'
import type { Block } from '@/lib/types'
import { Lock, ShieldCheck, User } from 'lucide-react'
import { PAlert } from '../ui/p-alert'
import { PBadge } from '../ui/p-badge'
import { PButton } from '../ui/p-button'
import { findAdminDashboardPage, findClientPage } from '@/lib/project/nav-targets'
import { S, type BlockCtx } from './shared'

const inputClass =
  'w-full min-h-11 rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] bg-[var(--pt-bg)] px-3.5 py-2.5 text-sm text-[var(--pt-text)] placeholder:text-[var(--pt-muted)] transition-colors duration-150 focus:border-[var(--pt-primary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--pt-primary)]'

/** (الجولة 16) نصّا ملاحظة الدور — حرفياً من المواصفة */
const ROLE_NOTE_CLIENT = 'أدخل بأي بريد وكلمة مرور — سنتجول مباشرة في فضاء الزبون (وضع تجريبي).'
const ROLE_NOTE_ADMIN = 'أدخل بأي بريد وكلمة مرور — سنتجول في لوحة تحكم المدير (وضع تجريبي).'

type LoginRole = 'client' | 'admin'

/** بطاقة الدور الواحدة في محدد الأدوار */
function RoleOption({
  role,
  value,
  icon,
  name,
  hint,
  onSelect,
}: {
  role: LoginRole
  value: LoginRole
  icon: ReactElement
  name: string
  hint: string
  onSelect: (r: LoginRole) => void
}): ReactElement {
  const on = value === role
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={() => onSelect(role)}
      className="flex cursor-pointer items-center gap-2.5 rounded-[calc(var(--pt-radius)-2px)] border bg-transparent px-3 py-2.5 text-start transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pt-primary)]"
      style={{
        borderColor: on ? 'var(--pt-primary)' : 'var(--pt-border)',
        background: on ? 'color-mix(in srgb, var(--pt-primary) 10%, transparent)' : undefined,
      }}
    >
      <span
        aria-hidden
        className="flex size-4 shrink-0 items-center justify-center"
        style={{ color: on ? 'var(--pt-primary)' : 'var(--pt-muted)' }}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span
          className="block text-[13.5px] font-bold leading-tight"
          style={{ color: on ? 'var(--pt-primary)' : 'var(--pt-text)' }}
        >
          {name}
        </span>
        <span className="mt-0.5 block text-[11.5px] leading-tight text-[var(--pt-muted)]">{hint}</span>
      </span>
    </button>
  )
}

export function AuthCardBlock({ block, ctx }: { block: Block; ctx: BlockCtx }): ReactElement {
  const p = block.props
  const variant = S(p, 'variant', 'login')
  const title = S(p, 'title', 'تسجيل الدخول')
  const subtitle = S(p, 'subtitle')
  const buttonText = S(p, 'buttonText', 'دخول')
  const demoHint = S(p, 'demoHint')

  const [done, setDone] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // (الجولة 16) الدور المختار — «كزبون» افتراضياً
  const [role, setRole] = useState<LoginRole>('client')

  // محدد الأدوار يظهر فقط في الدخول عند وجود صفحة فضاء الزبون
  const clientPage = findClientPage(ctx.schema)
  const adminDashboard = findAdminDashboardPage(ctx.schema)
  const showRoles = variant === 'login' && !!clientPage

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // (الجولة 16) الدخول بالأدوار: ضبط الجلسة ثم الانتقال لفضاء الدور.
    // إن لم توجد صفحة زبون فالسلوك القديم حرفياً (أول صفحة لوحة تحكم).
    if (ctx.interactive && ctx.onNavigate && (variant === 'login' || variant === 'signup')) {
      if (variant === 'login' && clientPage) {
        const target = role === 'client' ? clientPage : adminDashboard
        if (target) {
          ctx.onLoginAs?.(role)
          ctx.onNavigate(target.id)
          return
        }
      }
      // التسجيل العام يصنع حساب زبون → فضاء الزبون إن وُجد
      if (variant === 'signup' && clientPage) {
        ctx.onNavigate(clientPage.id)
        return
      }
      const dash = ctx.schema.pages.find((pg) => pg.type === 'dashboard')
      if (dash) {
        ctx.onNavigate(dash.id)
        return
      }
    }
    setDone(true)
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 md:py-14">
      <div
        className="rounded-[calc(var(--pt-radius)+4px)] border border-[var(--pt-border)] bg-[var(--pt-surface)] p-6 md:p-8"
        style={{ boxShadow: 'var(--pt-shadow)' }}
      >
        {/* الترويسة */}
        <div className="mb-6 text-center">
          <span
            className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full"
            style={{ background: 'color-mix(in srgb, var(--pt-primary) 12%, transparent)', color: 'var(--pt-primary)' }}
          >
            <Lock aria-hidden className="size-6" />
          </span>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl font-extrabold text-[var(--pt-text)] md:text-2xl">{title}</h1>
            <PBadge tone="primary">بيانات تجريبية</PBadge>
          </div>
          {subtitle ? <p className="mt-2 text-sm leading-relaxed text-[var(--pt-muted)]">{subtitle}</p> : null}
        </div>

        {done ? (
          <PAlert tone="success" title="✓ تم بنجاح">
            {variant === 'forgot'
              ? 'أرسلنا لك رابط الاستعادة — تحقق من بريدك الوارد.'
              : variant === 'signup'
                ? 'تم إنشاء حسابك التجريبي بنجاح. مرحباً بك!'
                : 'تم تسجيل الدخول بنجاح (وضع تجريبي).'}
          </PAlert>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            {/* (الجولة 16) محدد الأدوار — كزبون / كمدير */}
            {showRoles ? (
              <div className="mb-1">
                <div className="grid grid-cols-2 gap-2 max-[480px]:grid-cols-1" role="radiogroup" aria-label="نوع الدخول">
                  <RoleOption
                    role="client"
                    value={role}
                    icon={<User aria-hidden className="size-4" />}
                    name="كزبون"
                    hint="فضاء حسابي وطلباتي"
                    onSelect={setRole}
                  />
                  <RoleOption
                    role="admin"
                    value={role}
                    icon={<ShieldCheck aria-hidden className="size-4" />}
                    name="كمدير"
                    hint="لوحة تحكم الموقع الكاملة"
                    onSelect={setRole}
                  />
                </div>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-[var(--pt-muted)]">
                  {role === 'client' ? ROLE_NOTE_CLIENT : ROLE_NOTE_ADMIN}
                </p>
              </div>
            ) : null}

            {variant === 'signup' ? (
              <div>
                <label htmlFor="ac-name" className="mb-1.5 block text-sm font-semibold text-[var(--pt-text)]">
                  الاسم الكامل
                </label>
                <input
                  id="ac-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أحمد بن علي"
                  className={inputClass}
                />
              </div>
            ) : null}

            <div>
              <label htmlFor="ac-email" className="mb-1.5 block text-sm font-semibold text-[var(--pt-text)]">
                البريد الإلكتروني
              </label>
              <input
                id="ac-email"
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                className={`${inputClass} text-start`}
              />
            </div>

            {variant !== 'forgot' ? (
              <div>
                <label htmlFor="ac-pass" className="mb-1.5 block text-sm font-semibold text-[var(--pt-text)]">
                  كلمة المرور
                </label>
                <input
                  id="ac-pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
            ) : null}

            <PButton type="submit" size="lg" className="w-full">
              {buttonText}
            </PButton>
          </form>
        )}

        {demoHint ? (
          <div className="mt-5">
            <PAlert tone="info">{demoHint}</PAlert>
          </div>
        ) : null}
      </div>
    </div>
  )
}
