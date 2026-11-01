import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://school-football.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "لیگ فوتبال مدرسه | School Football",
    template: "%s | لیگ فوتبال مدرسه"
  },
  description: "سایت رسمی لیگ فوتبال مدرسه؛ تیم‌ها، نتایج مسابقات، جدول رده‌بندی و تورنمنت‌های مدرسه.",
  keywords: ["فوتبال مدرسه", "لیگ فوتبال مدرسه", "مسابقات فوتبال مدرسه", "جدول فوتبال مدرسه", "School Football"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "School Football",
    title: "لیگ فوتبال مدرسه | School Football",
    description: "نتایج، جدول، تیم‌ها و مسابقات فوتبال مدرسه در یک صفحه.",
    locale: "fa_IR"
  },
  twitter: {
    card: "summary",
    title: "لیگ فوتبال مدرسه | School Football",
    description: "نتایج، جدول، تیم‌ها و مسابقات فوتبال مدرسه."
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
