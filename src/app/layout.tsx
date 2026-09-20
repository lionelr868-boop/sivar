import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/platform/theme-provider";

export const metadata: Metadata = {
  title: "SIVAR — حوّل فكرتك إلى نموذج أولي حقيقي",
  description:
    "اكتب فكرة مشروعك، ودع الذكاء الاصطناعي يساعدك على بناء موقعك ولوحة التحكم والواجهات الأساسية، ثم حمّل مشروعك وانشره بنفسك.",
  keywords: ["SIVAR", "prototype", "ذكاء اصطناعي", "مشاريع ناشئة", "الجزائر", "رائد أعمال"],
  icons: { icon: "/favicon-sivar.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Tajawal:wght@400;500;700;800&family=Cairo:wght@400;600;700;800&display=swap"
        />
      </head>
      <body className="antialiased bg-background text-foreground min-h-screen">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
