"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const cid = localStorage.getItem("clinic_id");
    if (cid) router.replace("/patients");
    else router.replace("/login");
  }, [router]);

  // 一瞬だけ表示（遷移待ち）
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1630] via-[#0b2045] to-[#071127] px-4 py-10">
      <div className="mx-auto w-full max-w-3xl text-white/70">
        読み込み中…
      </div>
    </main>
  );
}