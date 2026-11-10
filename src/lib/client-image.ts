// ============================================================
// SIVAR — client-image: معالجة صور الرفع من جانب العميل
// (Task 9-a) — تصغير canvas بحد 1600px + تصدير JPEG بجودة 0.82
// مع ملء الشفافية بأبيض. ملف جديد مشترك (لا يعتمّد على أي DOM
// عند الاستيراد — كل الدوال تُستدعى داخل معالجات أحداث فقط).
// ============================================================

/** أقصى حجم مقبول للملف الخام (5 ميغابايت) */
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024
/** أقصى بُعد بعد التصغير */
export const IMAGE_MAX_DIMENSION = 1600
/** جودة تصدير JPEG */
export const IMAGE_JPEG_QUALITY = 0.82

/**
 * يحمّل ملف الصورة ويصدّره dataURL JPEG مصغّراً
 * (الشفافية تُملأ بأبيض — مناسبة لخلفيات الأقسام والمشروع).
 * تعمل فقط في المتصفح (File/Image/canvas).
 */
export function processImageFile(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        const naturalW = img.naturalWidth || IMAGE_MAX_DIMENSION
        const naturalH = img.naturalHeight || IMAGE_MAX_DIMENSION
        const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(naturalW, naturalH))
        const w = Math.max(1, Math.round(naturalW * scale))
        const h = Math.max(1, Math.round(naturalH * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('canvas-error')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        const out = canvas.toDataURL('image/jpeg', IMAGE_JPEG_QUALITY)
        if (!out || out.length < 32) throw new Error('encode-error')
        resolve(out)
      } catch (err) {
        reject(err instanceof Error ? err : new Error('resize-error'))
      } finally {
        URL.revokeObjectURL(url)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image-error'))
    }
    img.src = url
  })
}
