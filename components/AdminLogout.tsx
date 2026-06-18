"use client";

import { useRouter } from "next/navigation";

export default function AdminLogout({ className }: { className?: string }) {
  const router = useRouter();
  async function logout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // 무시
    }
    router.replace("/admin/login");
    router.refresh();
  }
  return (
    <button className={className} onClick={logout}>
      <i className="ti ti-logout" /> 로그아웃
    </button>
  );
}
