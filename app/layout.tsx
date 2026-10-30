import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "School Football | مدیریت فوتبال مدرسه",
  description: "مدیریت کلاس‌ها، تیم‌ها، مسابقات و تورنمنت‌های فوتبال مدرسه"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}