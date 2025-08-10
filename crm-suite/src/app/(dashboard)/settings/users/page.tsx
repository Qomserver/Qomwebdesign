"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export default function UsersPage() {
  const { data } = useQuery({ queryKey: ["users"], queryFn: async () => (await axios.get("/api/settings/users")).data as { id: string; email: string; firstName: string; lastName: string; role: { name: string } }[] });
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-bold">کاربران</h1>
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-right opacity-70">
              <tr>
                <th className="p-3">نام</th>
                <th className="p-3">ایمیل</th>
                <th className="p-3">نقش</th>
              </tr>
            </thead>
            <tbody>
              {(data || []).map((u) => (
                <tr key={u.id} className="border-t border-white/10">
                  <td className="p-3">{u.firstName} {u.lastName}</td>
                  <td className="p-3" dir="ltr">{u.email}</td>
                  <td className="p-3">{u.role?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}