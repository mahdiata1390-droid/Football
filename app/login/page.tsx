"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const AUTH_DOMAIN = "school-football.local";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(cleanUsername)) {
      setError("نام کاربری باید ۳ تا ۴۰ کاراکتر و فقط شامل حروف، عدد، نقطه، خط تیره یا زیرخط باشد.");
      setLoading(false);
      return;
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: `${cleanUsername}@${AUTH_DOMAIN}`,
      password,
    });

    if (authError || !data.user) {
      setError("نام کاربری یا رمز عبور اشتباه است.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile || !["admin", "teacher"].includes(profile.role)) {
      await supabase.auth.signOut();
      setError("این حساب اجازه ورود به پنل معلم را ندارد.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="auth-page" dir="rtl">
      <div className="auth-card">
        <div className="brand-mark">⚽</div>
        <span className="eyebrow">TEACHER ACCESS</span>
        <h1>ورود معلم</h1>
        <p className="auth-subtitle">فقط حساب معلم به پنل مدیریت دسترسی دارد.</p>

        <form onSubmit={submit} className="auth-form">
          <label>
            نام کاربری
            <input
              type="text"
              required
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="مثلاً teacher"
            />
          </label>

          <label>
            رمز عبور
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="رمز عبور"
            />
          </label>

          {error && <div className="form-error">{error}</div>}
          <button className="primary-btn" disabled={loading}>
            {loading ? "در حال بررسی..." : "ورود به پنل"}
          </button>
        </form>

        <button className="text-btn" onClick={() => router.push("/")}>← مشاهده نتایج مدرسه</button>
      </div>
    </main>
  );
}