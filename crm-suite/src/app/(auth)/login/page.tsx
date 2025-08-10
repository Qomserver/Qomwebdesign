"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

type ApiError = { message?: string };

function LoginInner() {
  const search = useSearchParams();
  const router = useRouter();
  const next = search.get("next") || "/";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");
    try {
      await axios.post("/api/auth/login", data, { withCredentials: true });
      router.replace(next);
    } catch (err: unknown) {
      let msg = "خطا در ورود";
      if (axios.isAxiosError<ApiError>(err)) msg = err.response?.data?.message ?? msg;
      else if (err instanceof Error) msg = err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 w-full">
      <div className="w-full max-w-md bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-8">
        <h1 className="text-2xl font-bold mb-6">ورود به سامانه</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm">ایمیل</label>
            <input dir="ltr" type="email" {...register("email")} className="w-full rounded-xl bg-white/10 border border-white/10 p-3 outline-none focus:ring-2 ring-blue-500" />
            {errors.email && <p className="text-red-400 text-sm">ایمیل نامعتبر است</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm">رمز عبور</label>
            <input dir="ltr" type="password" {...register("password")} className="w-full rounded-xl bg-white/10 border border-white/10 p-3 outline-none focus:ring-2 ring-blue-500" />
            {errors.password && <p className="text-red-400 text-sm">حداقل ۶ کاراکتر</p>}
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button disabled={loading} className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 transition p-3 font-semibold">
            {loading ? "در حال ورود..." : "ورود"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}