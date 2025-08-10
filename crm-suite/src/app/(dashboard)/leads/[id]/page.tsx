"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams } from "next/navigation";

type LeadDetail = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status?: { name: string } | null;
  events: { id: string; title: string; when: string }[];
};

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const { data } = useQuery<LeadDetail>({ queryKey: ["lead", params.id], queryFn: async () => (await axios.get(`/api/leads/${params.id}`)).data as LeadDetail });
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-bold">جزئیات لید</h1>
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
            <div className="font-semibold">اطلاعات</div>
            <div>نام: {data.firstName || ""} {data.lastName || ""}</div>
            <div>ایمیل: <span dir="ltr">{data.email || "—"}</span></div>
            <div>تلفن: <span dir="ltr">{data.phone || "—"}</span></div>
            <div>وضعیت: {data.status?.name || "—"}</div>
            <div>منبع: {data.source || "—"}</div>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 lg:col-span-2">
            <div className="font-semibold mb-2">رویدادها</div>
            <div className="space-y-2">
              {(data.events || []).map((e) => (
                <div key={e.id} className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
                  <div>{e.title}</div>
                  <div className="text-xs opacity-70" dir="ltr">{e.when}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}