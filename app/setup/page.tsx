"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SetupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [schoolName, setSchoolName] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { error: rpcError } = await supabase.rpc("bootstrap_school", {
      school_name: schoolName,
      full_name: fullName,
    });

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="auth-page" dir="rtl">
      <div className="auth-card">
        <div className="brand-mark">🏫</div>
        <span className="eyebrow">FIRST SETUP</span>
        <h1>مدرسه را راه‌اندازی کن</h1>
        <p className="auth-subtitle">این حساب به‌عنوان مدیر مدرسه ساخته می‌شود.</p>

        <form onSubmit={submit} className="auth-form">
          <label>
            نام شما
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="مثلاً علی رضایی" />
          </label>
          <label>
            نام مدرسه
            <input required value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="مثلاً دبیرستان ..." />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-btn" disabled={loading}>
            {loading ? "در حال راه‌اندازی..." : "راه‌اندازی مدرسه"}
          </button>
        </form>
      </div>
    </main>
  );
}
