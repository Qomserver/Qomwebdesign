import Link from "next/link";
import { ReactNode } from "react";

const nav = [
  { href: "/", label: "داشبورد" },
  { href: "/leads", label: "بانک شماره" },
  { href: "/orders", label: "سفارشات" },
  { href: "/reports", label: "گزارشات" },
  { href: "/messages", label: "مدیریت پیام‌ها" },
  { href: "/settings", label: "تنظیمات" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full">
      <aside className="hidden md:flex w-72 shrink-0 h-screen sticky top-0 flex-col gap-2 p-4 bg-white/5 border-l border-white/10">
        <div className="text-xl font-bold p-2">CRM Suite</div>
        <nav className="flex-1 space-y-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="block rounded-xl p-3 hover:bg-white/10 transition">
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 backdrop-blur bg-background/60 border-b border-white/10 p-4 flex items-center justify-between">
          <div className="font-semibold">سامانه مدیریت فروش</div>
          <div className="flex items-center gap-2">
            <Link href="/logout" className="text-sm bg-white/10 px-3 py-1.5 rounded-lg">خروج</Link>
          </div>
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}