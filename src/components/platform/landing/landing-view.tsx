'use client'

// صفحة الهبوط — واجهة المتجر الرئيسية للمنصة
// تُركّب الأقسام الفرعية (شريط التنقل، الهيرو، الثقة، كيف تعمل، القوالب، الأسئلة، الدعوة، التذييل)
import { LandingNavbar } from './landing-navbar'
import { HeroSection } from './hero-section'
import { TrustStrip } from './trust-strip'
import { HowItWorks } from './how-it-works'
import { TemplatesSection } from './templates-section'
import { FaqSection } from './faq-section'
import { CtaSection } from './cta-section'
import { LandingFooter } from './landing-footer'

export function LandingView() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <LandingNavbar />
      <main className="flex-1">
        <HeroSection />
        <TrustStrip />
        <HowItWorks />
        <TemplatesSection />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  )
}
