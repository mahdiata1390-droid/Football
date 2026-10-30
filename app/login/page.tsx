"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setError("حساب ساخته شد. اگر تأیید ایمیل فعال باشد، ایمیلت را تأیید کن و بعد وارد شو.");
      setLoading(false);
      return;
    }

    router.push(mode === "signup" ? "/setup" : "/");
    router.refresh();
  }

  return (
    <main className="auth-page" dir="rtl">
      <div className="auth-card">
        <div className="brand-mark">⚽</div>
        <span className="eyebrow">SCHOOL FOOTBALL</span>
        <h1>{mode === "login" ? "ورود به پنل فوتبال مدرسه" : "ساخت حساب مدیر"}</h1>
        <p className="auth-subtitle">
          {mode === "login"
            ? "مدیریت تیم‌ها، کلاس‌ها و مسابقات از یک‌جا."
            : "اولین حساب ثبت‌نام‌شده می‌تواند مدرسه را راه‌اندازی کند."}
        </p>

        <form onSubmit={submit} className="auth-form">
          <label>
            ایمیل
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@school.ir"
            />
          </label>

          <label>
            رمز عبور
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="حداقل ۶ کاراکتر"
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <button className="primary-btn" disabled={loading}>
            {loading ? "در حال بررسی..." : mode === "login" ? "ورود" : "ساخت حساب"}
          </button>
        </form>

        <button className="text-btn" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
          {mode === "login" ? "حساب مدیر ندارید؟ ساخت حساب" : "حساب دارید؟ ورود"}
        </button>
      </div>
    </main>
  );
}
