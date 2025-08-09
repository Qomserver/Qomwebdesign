"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

type OrderRow = {
  id: string;
  amount: string;
  status: string;
  product?: { name: string } | null;
  lead?: { firstName: string | null; lastName: string | null } | null;
};

export default function OrdersPage() {
  const { data } = useQuery<OrderRow[]>({ queryKey: ["orders"], queryFn: async () => (await axios.get("/api/orders")).data as OrderRow[] });
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-bold">سفارشات</h1>
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-right opacity-70">
              <tr>
                <th className="p-3">شناسه</th>
                <th className="p-3">مشتری</th>
                <th className="p-3">محصول</th>
                <th className="p-3">مبلغ</th>
                <th className="p-3">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {(data || []).map((o) => (
                <tr key={o.id} className="border-t border-white/10">
                  <td className="p-3" dir="ltr">{o.id}</td>
                  <td className="p-3">{o.lead ? `${o.lead.firstName || ""} ${o.lead.lastName || ""}` : "—"}</td>
                  <td className="p-3">{o.product?.name || "—"}</td>
                  <td className="p-3" dir="ltr">{o.amount}</td>
                  <td className="p-3">{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}