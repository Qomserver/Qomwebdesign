"use client";
import dayjs from "dayjs";
import jalaliday from "jalaliday";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

dayjs.extend(jalaliday);

export default function Overview() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await axios.get("/api/dashboard");
      return res.data as {
        leadCount: number;
        conversionRate: number;
        daysRemaining: number;
        tasks: { id: string; title: string; status: string }[];
        events: { id: string; title: string; when: string }[];
        quotes: string[];
        conversionBySource: { source: string; rate: number }[];
      };
    },
  });

  const today = dayjs().calendar("jalali").locale("fa").format("YYYY/MM/DD");

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <div className="text-sm opacity-80 mb-2">تعداد لید</div>
          <div className="text-3xl font-bold">{data?.leadCount ?? "—"}</div>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <div className="text-sm opacity-80 mb-2">درصد تبدیل</div>
          <div className="text-3xl font-bold">{data ? Math.round(data.conversionRate * 100) + "%" : "—"}</div>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <div className="text-sm opacity-80 mb-2">تاریخ روز</div>
          <div className="text-3xl font-bold">{today}</div>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <div className="text-sm opacity-80 mb-2">روزهای مانده تا پایان ماه</div>
          <div className="text-3xl font-bold">{data?.daysRemaining ?? "—"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <div className="text-lg font-semibold mb-4">کارهای روزانه</div>
          <div className="space-y-2">
            {data?.tasks?.length ? (
              data.tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs px-2 py-1 rounded-full bg-blue-600">{t.status === "pending" ? "در انتظار" : t.status === "done" ? "انجام شد" : t.status}</div>
                </div>
              ))
            ) : (
              <div className="opacity-60">موردی برای نمایش نیست</div>
            )}
          </div>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <div className="text-lg font-semibold mb-4">رویدادها</div>
          <div className="space-y-2">
            {data?.events?.length ? (
              data.events.map((e) => (
                <div key={e.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                  <div className="font-medium">{e.title}</div>
                  <div className="text-sm opacity-80">{dayjs(e.when).calendar("jalali").locale("fa").format("YYYY/MM/DD HH:mm")}</div>
                </div>
              ))
            ) : (
              <div className="opacity-60">موردی برای نمایش نیست</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <div className="text-lg font-semibold mb-4">جملات انگیزشی فروش</div>
          <div className="space-y-2">
            {(data?.quotes || []).map((q, idx) => (
              <div key={idx} className="bg-white/5 rounded-xl p-3">{q}</div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <div className="text-lg font-semibold mb-4">نرخ تبدیل به تفکیک منبع</div>
          <div className="space-y-2">
            {(data?.conversionBySource || []).map((it) => (
              <div key={it.source} className="flex items-center gap-3">
                <div className="w-28 shrink-0 text-sm opacity-80">{it.source}</div>
                <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-3 bg-emerald-500" style={{ width: `${Math.round(it.rate * 100)}%` }} />
                </div>
                <div className="w-12 text-left text-sm">{Math.round(it.rate * 100)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}