// ============================================================
// نموذج — Core Type System (العقد المعماري المشترك)
// DO NOT REWRITE — owned by main agent
// ============================================================

// ===== Project classification =====
export type ProjectType =
  | 'saas'
  | 'ai'
  | 'ecommerce'
  | 'marketplace'
  | 'education'
  | 'health'
  | 'realestate'
  | 'booking'
  | 'services'
  | 'restaurant'
  | 'agency'
  | 'app'
  | 'fintech'
  | 'admin'
  | 'delivery'
  | 'other'

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  saas: 'SaaS',
  ai: 'الذكاء الاصطناعي',
  ecommerce: 'متجر إلكتروني',
  marketplace: 'Marketplace',
  education: 'منصة تعليمية',
  health: 'الصحة',
  realestate: 'العقارات',
  booking: 'منصة حجوزات',
  services: 'منصة خدمات',
  restaurant: 'مطعم',
  agency: 'وكالة',
  app: 'تطبيق ويب',
  fintech: 'FinTech',
  admin: 'منصة إدارية',
  delivery: 'مشروع توصيل',
  other: 'أخرى',
}

export type ProjectStyle = 'modern' | 'minimal' | 'professional' | 'luxury' | 'youthful' | 'tech'

export const PROJECT_STYLE_LABELS: Record<ProjectStyle, string> = {
  modern: 'حديث',
  minimal: 'Minimal',
  professional: 'احترافي',
  luxury: 'فاخر',
  youthful: 'شبابي',
  tech: 'تقني',
}

export type ProjectStatus = 'draft' | 'building' | 'ready' | 'downloaded'

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'مسودة',
  building: 'قيد البناء',
  ready: 'جاهز',
  downloaded: 'تم تحميله',
}

// ===== Pages & Blocks =====
export type PageType =
  | 'landing'
  | 'auth'
  | 'dashboard'
  | 'pricing'
  | 'table'
  | 'form'
  | 'settings'
  | 'profile'
  | 'faq'
  | 'custom'

export const PAGE_TYPE_LABELS: Record<PageType, string> = {
  landing: 'صفحة رئيسية',
  auth: 'صفحة دخول',
  dashboard: 'لوحة تحكم',
  pricing: 'صفحة تسعير',
  table: 'صفحة جدول',
  form: 'نموذج',
  settings: 'الإعدادات',
  profile: 'الملف الشخصي',
  faq: 'الأسئلة الشائعة',
  custom: 'صفحة مخصصة',
}

export type AuthVariant = 'login' | 'signup' | 'forgot'

export type BlockType =
  | 'hero'
  | 'features'
  | 'stats'
  | 'steps'
  | 'pricing'
  | 'testimonials'
  | 'faq'
  | 'cta'
  | 'contact-form'
  | 'gallery'
  | 'banner'
  | 'list'
  | 'team'
  | 'auth-card'
  | 'dashboard-header'
  | 'stats-row'
  | 'chart'
  | 'data-table'
  | 'form-fields'
  | 'settings-form'
  | 'profile-card'
  | 'empty-state'
  | 'loading-state'
  | 'error-state'
  | 'calendar'
  | 'custom-html'

export interface Block {
  id: string
  type: BlockType
  props: Record<string, unknown>
}

export interface ProjectPage {
  id: string
  name: string
  slug: string
  type: PageType
  authVariant?: AuthVariant
  /** key into ProjectMockData.entities for table pages */
  entity?: string
  title?: string
  subtitle?: string
  blocks: Block[]
}

// ===== Theme / Design System =====
export interface ProjectTheme {
  primary: string
  primaryForeground: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  mutedText: string
  border: string
  /** border radius in px */
  radius: number
  shadow: 'none' | 'sm' | 'md' | 'lg'
  fontFamily: 'IBM Plex Sans Arabic' | 'Tajawal' | 'Cairo'
  mode: 'light' | 'dark'
}

export interface ThemePalettePreset {
  id: string
  name: string
  primary: string
  secondary: string
  accent: string
}

export const COLOR_NAME_TO_HEX: Record<string, string> = {
  'ازرق': '#2563eb',
  'أزرق': '#2563eb',
  'أزرق داكن': '#1e3a8a',
  'أزرق فاتح': '#38bdf8',
  'أخضر': '#059669',
  'اخضر': '#059669',
  'أخضر داكن': '#065f46',
  'بنفسجي': '#7c3aed',
  'موف': '#7c3aed',
  'أحمر': '#dc2626',
  'برتقالي': '#ea580c',
  'وردي': '#db2777',
  'تركواز': '#0d9488',
  'ذهبي': '#d97706',
  'أسود': '#111827',
  'رمادي': '#4b5563',
  'بني': '#92400e',
}

// ===== Navigation =====
export interface NavItem {
  label: string
  pageId: string
}

export interface DashboardNavItem {
  label: string
  pageId: string
  /** lucide icon name */
  icon: string
}

export interface ProjectNavigation {
  brand: string
  items: NavItem[]
  cta?: { label: string; pageId: string }
  footerNote: string
}

export interface ProjectDashboardNav {
  items: DashboardNavItem[]
}

// ===== Mock Data =====
export type Currency = 'DZD' | 'USD' | 'EUR'

export interface StatItem {
  label: string
  value: string
  change?: string
  /** lucide icon name */
  icon?: string
}

export interface EntityColumn {
  key: string
  label: string
  type: 'text' | 'number' | 'currency' | 'date' | 'badge' | 'avatar' | 'progress' | 'email' | 'phone'
}

export interface EntityData {
  columns: EntityColumn[]
  rows: Array<Record<string, unknown>>
}

export type ChartType = 'bar' | 'line' | 'donut'

export interface ChartData {
  type: ChartType
  title: string
  data: Array<{ label: string; value: number }>
}

export interface ProjectMockData {
  currency: Currency
  stats: Record<string, StatItem[]>
  entities: Record<string, EntityData>
  charts: Record<string, ChartData>
}

// ===== Project Schema =====
export interface ProjectMetadata {
  name: string
  description: string
  type: ProjectType
  style: ProjectStyle
  audience: string
  /** lucide icon name shown on project cards */
  icon: string
  createdAt: string
}

export interface ProjectSettings {
  dir: 'rtl'
  lang: 'ar'
  currency: Currency
  projectName: string
}

// ===== Landing page variants (مكتبة أنماط صفحات الهبوط) =====
export type LandingVariantId =
  | 'classic-split'
  | 'centered-bold'
  | 'gradient-cover'
  | 'dark-premium'
  | 'app-showcase'
  | 'email-capture'
  | 'video-lead'
  | 'store-promo'
  | 'agency-bold'
  | 'event-announce'
  | 'minimal-startup'
  | 'stats-lead'

// ===== Branding (الشعار) =====
export interface ProjectBranding {
  /** شعار المشروع — data URL (png) بعد تصغير العميل، أو رابط نسبي assets/logo.png عند التصدير */
  logo?: string
  logoName?: string
}

export interface ProjectSchema {
  version: 1
  metadata: ProjectMetadata
  theme: ProjectTheme
  navigation: ProjectNavigation
  dashboardNav: ProjectDashboardNav
  pages: ProjectPage[]
  mockData: ProjectMockData
  settings: ProjectSettings
  /** اختياري — التوافق مع المشاريع القديمة */
  branding?: ProjectBranding
}

// ===== Idea Analysis =====
export interface SuggestedPage {
  name: string
  type: PageType
  entity?: string
  authVariant?: AuthVariant
}

export interface IdeaAnalysis {
  name: string
  type: ProjectType
  audience: string
  description: string
  suggestedPages: SuggestedPage[]
  templateId: string
}

// ===== Agent =====
export type AgentToolName =
  | 'create_page'
  | 'delete_page'
  | 'update_page'
  | 'add_block'
  | 'update_block'
  | 'update_content'
  | 'delete_block'
  | 'move_block'
  | 'update_theme'
  | 'update_navigation'
  | 'update_dashboard_nav'
  | 'rename_project'
  | 'generate_mock_data'
  | 'change_landing_variant'

export interface AgentAction {
  tool: AgentToolName
  args: Record<string, unknown>
}

export interface AgentResult {
  explanation: string
  actions: string[]
  schema: ProjectSchema
  versionLabel: string
}

// ===== DTOs (API layer) =====
export interface UserDTO {
  id: string
  name: string
  email: string
  onboarded: boolean
  projectType?: string | null
  idea?: string | null
  style?: string | null
  createdAt: string
}

export interface ProjectSummaryDTO {
  id: string
  name: string
  type: ProjectType
  status: ProjectStatus
  icon: string
  createdAt: string
  updatedAt: string
  versionCount: number
  pageCount: number
}

export interface ProjectDTO extends ProjectSummaryDTO {
  schema: ProjectSchema
  analysis?: IdeaAnalysis | null
}

export interface VersionDTO {
  id: string
  number: number
  label: string
  createdAt: string
}

export interface ValidateCheck {
  id: string
  label: string
  status: 'pending' | 'ok' | 'error'
  detail?: string
}

export interface ValidateResult {
  ok: boolean
  checks: ValidateCheck[]
}

// ===== HTML snippets (مكتبة HTML القابلة لإعادة الاستخدام) =====
export type HtmlSnippetKind = 'landing' | 'dashboard' | 'section'

export const HTML_SNIPPET_KIND_LABELS: Record<HtmlSnippetKind, string> = {
  landing: 'صفحة هبوط',
  dashboard: 'لوحة تحكم',
  section: 'قسم صفحة',
}

// ===== Saved templates (قوالبي المحفوظة من المشاريع) =====
export interface SavedTemplateDTO {
  id: string
  name: string
  description: string
  icon: string
  type: ProjectType
  pageCount: number
  sourceProjectId?: string | null
  createdAt: string
}

export interface HtmlSnippetDTO {
  id: string
  name: string
  kind: HtmlSnippetKind
  html: string
  createdAt: string
  updatedAt: string
}

// ===== Platform helpers =====
export type DeviceMode = 'desktop' | 'tablet' | 'mobile'

export type DashboardSection =
  | 'home'
  | 'projects'
  | 'templates'
  | 'components'
  | 'new'
  | 'help'
  | 'settings'

export type AppView =
  | 'landing'
  | 'auth'
  | 'onboarding'
  | 'app'
  | 'builder'
  | 'export-guide'

/** id generator (isomorphic) */
export function uid(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 9)
  return `${prefix}${Date.now().toString(36)}${rand}`
}

/** slugify Arabic titles to safe url slugs */
export function slugify(text: string): string {
  const cleaned = text
    .trim()
    .replace(/[\s/\\]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .toLowerCase()
  return cleaned || `page-${Math.random().toString(36).slice(2, 6)}`
}
