"use client";
import { useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    async function run() {
      try { await axios.post("/api/auth/logout"); } catch {}
      router.replace("/login");
    }
    run();
  }, [router]);
  return <div className="p-6">در حال خروج...</div>;
}