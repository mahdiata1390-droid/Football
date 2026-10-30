"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DashboardTeam = { name: string; played: number; points: number };
type DashboardMatch = { home: string; away: string; score: string; status: string; date: string };

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState("داشبورد");
  const [showTeam, setShowTeam] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [schoolName, setSchoolName] = useState("مدرسه");
  const [profileName, setProfileName] = useState("معلم");
  const [teamsCount, setTeamsCount] = useState(0);
  const [playersCount, setPlayersCount] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);
  const [tournamentsCount, setTournamentsCount] = useState(0);
  const [teams, setTeams] = useState<DashboardTeam[]>([]);
  const [matches, setMatches] = useState<DashboardMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGlow, setActiveGlow] = useState(false);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      document.documentElement.style.setProperty("--mx", `${event.clientX}px`);
      document.documentElement.style.setProperty("--my", `${event.clientY}px`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const loadDashboard = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.replace("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, school_id, role, schools(name)")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (!profile || !["admin", "teacher"].includes(profile.role)) {
      router.replace("/login");
      return;
    }

    setProfileName(profile.full_name);
    const school = Array.isArray(profile.schools) ? profile.schools[0] : profile.schools;
    if (school?.name) setSchoolName(school.name);

    const [teamResult, playerResult, matchResult, tournamentResult] = await Promise.all([
      supabase.from("teams").select("id,name", { count: "exact" }).limit(100),
      supabase.from("players").select("id", { count: "exact", head: true }),
      supabase.from("matches").select("id,home_team_id,away_team_id,home_score,away_score,status,scheduled_at", { count: "exact" }).order("scheduled_at", { ascending: false, nullsFirst: false }).limit(3),
      supabase.from("tournaments").select("id", { count: "exact", head: true }),
    ]);

    setTeamsCount(teamResult.count ?? 0);
    setPlayersCount(playerResult.count ?? 0);
    setMatchesCount(matchResult.count ?? 0);
    setTournamentsCount(tournamentResult.count ?? 0);

    setTeams((teamResult.data ?? []).slice(0, 4).map((team) => ({ name: team.name, played: 0, points: 0 })));

    const ids = new Set<string>();
    for (const match of matchResult.data ?? []) {
      ids.add(match.home_team_id);
      ids.add(match.away_team_id);
    }
    let names = new Map<string, string>();
    if (ids.size) {
      const { data: matchTeams } = await supabase.from("teams").select("id,name").in("id", [...ids]);
      names = new Map((matchTeams ?? []).map((team) => [team.id, team.name]));
    }

    setMatches((matchResult.data ?? []).map((match) => ({
      home: names.get(match.home_team_id) ?? "تیم میزبان",
      away: names.get(match.away_team_id) ?? "تیم مهمان",
      score: match.status === "scheduled" ? "—" : `${match.home_score} - ${match.away_score}`,
      status: match.status === "completed" ? "پایان یافته" : match.status === "live" ? "زنده" : "برنامه‌ریزی شده",
      date: match.scheduled_at ? new Date(match.scheduled_at).toLocaleString("fa-IR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "بدون زمان",
    })));
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  async function createTeam() {
    if (!teamName.trim()) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return router.replace("/login");
    const { data: profile } = await supabase.from("profiles").select("school_id,role").eq("id", userData.user.id).single();
    if (!profile || !["admin", "teacher"].includes(profile.role)) return router.replace("/login");

    const { error } = await supabase.from("teams").insert({ school_id: profile.school_id, name: teamName.trim() });
    if (!error) {
      setShowTeam(false);
      setTeamName("");
      await loadDashboard();
    }
  }

  if (loading) return <main className="auth-page" dir="rtl"><div className="auth-card"><div className="brand-mark">⚽</div><h1>در حال اتصال به لیگ مدرسه...</h1><p className="auth-subtitle">پنل معلم در حال بارگذاری است.</p></div></main>;

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">⚽</div><div><b>School Football</b><span>پنل معلم</span></div></div>
        <div className="school-card"><span>{schoolName}</span><strong>لیگ فوتبال مدرسه</strong><small>مدیر: {profileName}</small></div>
        <nav>{["داشبورد","کلاس‌ها و تیم‌ها","مسابقات","تورنمنت‌ها","جدول رده‌بندی","بازیکنان"].map(item => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</nav>
        <div className="sidebar-bottom"><div className="teacher"><div className="avatar">{profileName.slice(0, 1)}</div><div><b>{profileName}</b><span>معلم / مدیر</span></div></div><button className="settings" onClick={async () => { await supabase.auth.signOut(); router.replace("/login"); }}>خروج</button></div>
      </aside>

      <section className="content">
        <header className="topbar"><div><span className="eyebrow">TEACHER PANEL</span><h1>{tab}</h1><p>فقط معلم می‌تواند اطلاعات مسابقات را تغییر دهد.</p></div><div className="top-actions"><button className="profile-btn">{profileName.slice(0, 1)}</button></div></header>

        {tab === "داشبورد" ? <>
          <section className={`hero ${activeGlow ? "goal-glow" : ""}`} onMouseEnter={() => setActiveGlow(true)} onMouseLeave={() => setActiveGlow(false)}><div><span className="pill">● حالت مدیریت فعال</span><h2>وقتشه لیگ مدرسه رو شروع کنیم.</h2><p>تیم‌ها، بازیکن‌ها، مسابقات و تورنمنت‌ها را از این پنل مدیریت کن.</p><div className="hero-actions"><button className="primary" onClick={() => setShowTeam(true)}>+ ساخت تیم جدید</button><button className="ghost" onClick={() => router.push("/tournaments")}>ساخت تورنمنت</button></div></div><div className="hero-ball">⚽</div></section>
          <div className="stats"><div className="stat-card"><span>تیم‌های فعال</span><strong>{teamsCount}</strong><small>از دیتابیس مدرسه</small></div><div className="stat-card"><span>مسابقات</span><strong>{matchesCount}</strong><small>برنامه‌ریزی و انجام‌شده</small></div><div className="stat-card"><span>بازیکنان</span><strong>{playersCount}</strong><small>ثبت‌شده در مدرسه</small></div><div className="stat-card"><span>تورنمنت‌ها</span><strong>{tournamentsCount}</strong><small>لیگ و جام حذفی</small></div></div>
          <div className="grid-2"><section className="panel"><div className="panel-head"><div><span className="eyebrow">LIVE BOARD</span><h3>بازی‌های اخیر</h3></div><button className="text-btn" onClick={() => router.push("/matches")}>همه مسابقات ←</button></div><div className="match-list">{matches.length ? matches.map((m, i) => <div className="match" key={i}><div className="match-date">{m.date}<span className={m.status === "پایان یافته" ? "done" : "next"}>{m.status}</span></div><div className="teams"><span>{m.home}</span><b>{m.score}</b><span>{m.away}</span></div></div>) : <div className="empty-state">هنوز مسابقه‌ای ثبت نشده.</div>}</div></section>
          <section className="panel"><div className="panel-head"><div><span className="eyebrow">TOP TABLE</span><h3>جدول رده‌بندی</h3></div><button className="text-btn" onClick={() => router.push("/standings")}>مشاهده جدول ←</button></div><div className="table">{teams.length ? teams.map((t, i) => <div className="row" key={t.name}><b className="rank">{i + 1}</b><div className="team-dot"></div><span className="team-name">{t.name}</span><span>{t.played}</span><strong>{t.points}</strong></div>) : <div className="empty-state">اولین تیم مدرسه را بساز.</div>}</div></section></div>
          <section className="panel tournaments"><div className="panel-head"><div><span className="eyebrow">COMPETITIONS</span><h3>تورنمنت‌های مدرسه</h3></div><button className="text-btn" onClick={() => setTab("تورنمنت‌ها")}>مدیریت تورنمنت‌ها ←</button></div><div className="tournament-grid"><article><span className="t-icon">🏆</span><div><b>لیگ فوتبال مدرسه</b><p>{teamsCount} تیم • {matchesCount} مسابقه</p></div><span className="status live">{tournamentsCount ? "فعال" : "آماده راه‌اندازی"}</span></article></div></section>
        </> : <section className="empty-panel"><div className="empty-icon">⚽</div><h2>{tab}</h2><p>این بخش از منوی مدیریت باز می‌شود.</p><button className="primary" onClick={() => setTab("داشبورد")}>بازگشت به داشبورد</button></section>}
      </section>

      {showTeam && <div className="modal-backdrop" onClick={() => setShowTeam(false)}><div className="modal" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setShowTeam(false)}>×</button><span className="eyebrow">TEAM SETUP</span><h2>ساخت تیم جدید</h2><p>تیم جدید مستقیماً در دیتابیس مدرسه ذخیره می‌شود.</p><label>نام تیم<input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="مثلاً کلاس ۱۰/۲" /></label><button className="primary full" onClick={createTeam}>ایجاد تیم</button></div></div>}
    </main>
  );
}