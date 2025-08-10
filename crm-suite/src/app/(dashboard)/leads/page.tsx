"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";

type LeadRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  status?: { name: string } | null;
  owner?: { firstName: string | null; lastName: string | null } | null;
};

export default function LeadsPage() {
  const { data } = useQuery<LeadRow[]>({
    queryKey: ["leads"],
    queryFn: async () => (await axios.get("/api/leads")).data as LeadRow[],
  });

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">بانک شماره</h1>
        <Link href="/leads/new" className="bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-2">افزودن لید</Link>
      </div>
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input placeholder="جستجو" className="rounded-xl bg-white/10 border border-white/10 p-3" />
          <select className="rounded-xl bg-white/10 border border-white/10 p-3"><option>همه وضعیت‌ها</option></select>
          <select className="rounded-xl bg-white/10 border border-white/10 p-3"><option>همه منابع</option></select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-right opacity-70">
              <tr>
                <th className="p-3">نام</th>
                <th className="p-3">ایمیل</th>
                <th className="p-3">تلفن</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3">مالک</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {(data || []).map((l) => (
                <tr key={l.id} className="border-t border-white/10">
                  <td className="p-3">{l.firstName || ""} {l.lastName || ""}</td>
                  <td className="p-3" dir="ltr">{l.email || "—"}</td>
                  <td className="p-3" dir="ltr">{l.phone || "—"}</td>
                  <td className="p-3">{l.status?.name || "—"}</td>
                  <td className="p-3">{l.owner ? (l.owner.firstName || "") + " " + (l.owner.lastName || "") : "—"}</td>
                  <td className="p-3 text-left">
                    <Link href={`/leads/${l.id}`} className="text-blue-400">جزئیات</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}