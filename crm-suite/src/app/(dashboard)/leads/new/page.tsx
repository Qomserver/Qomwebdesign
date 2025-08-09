"use client";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useRouter } from "next/navigation";

type FormData = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  source?: string;
};

export default function NewLeadPage() {
  const router = useRouter();
  const { register, handleSubmit } = useForm<FormData>();
  const onSubmit = async (data: FormData) => {
    const res = await axios.post("/api/leads", data);
    router.replace(`/leads/${res.data.id}`);
  };
  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">افزودن لید</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <input placeholder="نام" {...register("firstName")} className="rounded-xl bg-white/10 border border-white/10 p-3" />
        <input placeholder="نام خانوادگی" {...register("lastName")} className="rounded-xl bg-white/10 border border-white/10 p-3" />
        <input placeholder="ایمیل" dir="ltr" {...register("email")} className="rounded-xl bg-white/10 border border-white/10 p-3" />
        <input placeholder="تلفن" dir="ltr" {...register("phone")} className="rounded-xl bg-white/10 border border-white/10 p-3" />
        <input placeholder="منبع" {...register("source")} className="rounded-xl bg-white/10 border border-white/10 p-3" />
        <button className="md:col-span-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg px-4 py-3">ذخیره</button>
      </form>
    </main>
  );
}