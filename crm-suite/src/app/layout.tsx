import "./globals.css";
import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import Providers from "@/components/providers";

const vazir = Vazirmatn({ subsets: ["arabic"], variable: "--font-vazirmatn" });

export const metadata: Metadata = {
  title: "CRM Suite",
  description: "سامانه مدیریت فروش و لید",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>
          <div className="min-h-screen flex">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
