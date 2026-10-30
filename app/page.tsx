"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Team = { id: string; name: string };
type Match = { id: string; home_team_id: string; away_team_id: string; home_score: number | null; away_score: number | null; status: string; scheduled_at: string | null };
type Row = { id: string; name: string; played: number; wins: number; draws: number; losses: number; gf: number; ga: number; gd: number; points: number };

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [schoolName, setSchoolName] = useState("مدرسه");
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [showAllTeams, setShowAllTeams] = useState(false);
  function tapSound() {
    if (!soundOn || typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = "sine"; osc.frequency.setValueAtTime(480, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(720, ctx.currentTime + 0.055);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.008); gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.07);
    osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.075); window.setTimeout(() => void ctx.close(), 120);
  }

  const load = useCallback(async () => {
    const [{ data: school }, { data: teamData }, { data: matchData }] = await Promise.all([
      supabase.from("schools").select("name").limit(1).maybeSingle(),
      supabase.from("teams").select("id,name").order("name"),
      supabase.from("matches").select("id,home_team_id,away_team_id,home_score,away_score,status,scheduled_at").order("scheduled_at", { ascending: false, nullsFirst: false }).limit(30),
    ]);

    if (school?.name) setSchoolName(school.name);
    const nextTeams = teamData ?? [];
    const nextMatches = matchData ?? [];
    setTeams(nextTeams);
    if (!selectedTeam && nextTeams[0]) setSelectedTeam(nextTeams[0].id);
    setMatches(nextMatches);

    const table = new Map<string, Row>();
    for (const team of nextTeams) table.set(team.id, { id: team.id, name: team.name, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0 });
    for (const m of nextMatches) {
      if (m.status !== "completed" || m.home_score == null || m.away_score == null) continue;
      const h = table.get(m.home_team_id), a = table.get(m.away_team_id);
      if (!h || !a) continue;
      h.played++; a.played++; h.gf += m.home_score; h.ga += m.away_score; a.gf += m.away_score; a.ga += m.home_score;
      if (m.home_score > m.away_score) { h.wins++; a.losses++; h.points += 3; }
      else if (m.home_score < m.away_score) { a.wins++; h.losses++; a.points += 3; }
      else { h.draws++; a.draws++; h.points++; a.points++; }
    }
    setRows([...table.values()].map(r => ({ ...r, gd: r.gf - r.ga })).sort((a,b) => b.points-a.points || b.gd-a.gd || b.gf-a.gf));
    setLoading(false);
  }, [selectedTeam, supabase]);

  useEffect(() => { void load(); }, [load]);

  const teamName = (id: string) => teams.find(t => t.id === id)?.name ?? "تیم";
  const myMatches = matches.filter(m => !selectedTeam || m.home_team_id === selectedTeam || m.away_team_id === selectedTeam);
  const upcoming = matches.filter(m => m.status === "scheduled").sort((a,b) => new Date(a.scheduled_at ?? 0).getTime() - new Date(b.scheduled_at ?? 0).getTime()).slice(0, 3);
  const completed = matches.filter(m => m.status === "completed").sort((a,b) => new Date(b.scheduled_at ?? 0).getTime() - new Date(a.scheduled_at ?? 0).getTime());
  const recentResults = completed.slice(0, 6);
  const displayTeams = showAllTeams ? teams : teams.slice(0, 6);
  const leader = rows[0];

  if (loading) return <main className="auth-page" dir="rtl"><div className="auth-card"><div className="brand-mark">⚽</div><h1>در حال بارگذاری لیگ مدرسه...</h1><p className="auth-subtitle">نتایج و جدول در حال دریافت است.</p></div></main>;

  return (
    <main className="public-home" dir="rtl">
      <header className="public-header">
        <div className="public-brand"><div className="brand-mark">⚽</div><div><b>School Football</b><span>{schoolName}</span></div></div>
        <div className="public-actions"><button className="sound-btn" onClick={() => { setSoundOn(v => !v); tapSound(); }}>{soundOn ? "🔊" : "🔇"}</button><button className="teacher-link" onClick={() => { tapSound(); router.push("/login"); }}>پنل معلم</button></div>
      </header>
      <section className="public-hero">
        <div className="hero-grid-glow"></div>
        <div className="public-hero-copy">
          <span className="live-badge"><i></i>{recentResults.length ? "آخرین نتایج مدرسه آماده‌اند" : "لیگ مدرسه آماده شروع است"}</span>
          <div className="hero-kicker"><span>⚽ SCHOOL LEAGUE</span><span>SEASON 01</span></div>
          <h1>فوتبال مدرسه،<br/><strong>مثل یک لیگ واقعی.</strong></h1>
          <p>تیم خودت را پیدا کن، نتیجه بازی‌ها را ببین و هر هفته جدول را دنبال کن؛ همه‌چیز برای یک فصل فوتبالی واقعی.</p>
          <div className="public-hero-actions"><a href="#matches" className="primary" onClick={tapSound}>مشاهده بازی‌ها <b>←</b></a><a href="#standings" className="ghost" onClick={tapSound}>جدول لیگ</a></div>
          <div className="hero-mini-stats"><div><b>{teams.length}</b><span>تیم</span></div><i></i><div><b>{completed.length}</b><span>نتیجه</span></div><i></i><div><b>{upcoming.length}</b><span>بازی بعدی</span></div></div>
        </div>
        <div className="public-hero-visual" aria-hidden="true">
          <div className="stadium-photo"></div><div className="stadium-vignette"></div><div className="hero-light"></div>
          <div className="hero-arc arc-one"></div><div className="hero-arc arc-two"></div>
          <div className="hero-score-card"><span>RECENT RESULT</span><b>{completed[0] ? teamName(completed[0].home_team_id) : "HOME"}</b><strong>{completed[0] ? (completed[0].home_score ?? 0) + "  —  " + (completed[0].away_score ?? 0) : "VS"}</strong><b>{completed[0] ? teamName(completed[0].away_team_id) : "AWAY"}</b></div>
          <div className="hero-float-badge"><span>🏆</span><div><b>{leader?.name ?? "رقابت شروع می‌شود"}</b><small>صدر جدول</small></div></div>
          <div className="hero-3d-ball"></div><div className="hero-ball-shadow"></div>
        </div>
      </section>
      <section className="public-stats">
        <div><span>تیم‌ها</span><strong>{teams.length}</strong><small>تیم فعال</small></div>
        <div><span>بازی‌ها</span><strong>{matches.length}</strong><small>{completed.length} نتیجه ثبت شده</small></div>
        <div><span>نتایج ثبت‌شده</span><strong>{completed.length}</strong><small>برای مرور بعد از مدرسه</small></div>
        <div><span>صدرنشین</span><strong>{leader ? "01" : "—"}</strong><small>{leader?.name ?? "هنوز مشخص نیست"}</small></div>
      </section>
      <section className="public-section" id="matches">
        <div className="section-title"><div><span className="eyebrow">MATCH CENTER</span><h2>مرکز مسابقات</h2></div><span>{matches.length} بازی</span></div>
        {recentResults.length > 0 && <div className="results-strip">{recentResults.slice(0,3).map(m => <div className="result-chip" key={m.id}><span>نتیجه</span><b>{teamName(m.home_team_id)}</b><strong>{m.home_score ?? 0} - {m.away_score ?? 0}</strong><b>{teamName(m.away_team_id)}</b></div>)}</div>}
        <div className="match-showcase">
          <div className="feature-match"><span className="eyebrow">{upcoming[0] ? "NEXT MATCH" : "LATEST RESULT"}</span>
            {upcoming[0] ? <><small>{new Date(upcoming[0].scheduled_at ?? 0).toLocaleString("fa-IR",{weekday:"long",day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"})}</small><div className="feature-teams"><b>{teamName(upcoming[0].home_team_id)}</b><strong>VS</strong><b>{teamName(upcoming[0].away_team_id)}</b></div><div className="match-pitch"><div>⚽</div></div></> : completed[0] ? <><small>آخرین نتیجه ثبت‌شده</small><div className="feature-teams"><b>{teamName(completed[0].home_team_id)}</b><strong>{completed[0].home_score} — {completed[0].away_score}</strong><b>{teamName(completed[0].away_team_id)}</b></div></> : <div className="empty-state">هنوز مسابقه‌ای ثبت نشده.</div>}
          </div>
          <div className="upcoming-list"><h3>بازی‌های پیش‌رو</h3>{upcoming.length ? upcoming.map(m => <div className="upcoming-card" key={m.id}><div className="fixture-time">{new Date(m.scheduled_at ?? 0).toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"})}</div><span>{teamName(m.home_team_id)}</span><b>VS</b><span>{teamName(m.away_team_id)}</span></div>) : <div className="empty-state">بازی بعدی هنوز مشخص نشده.</div>}</div>
        </div>
      </section>
      <section className="public-section teams-section">
        <div className="section-title"><div><span className="eyebrow">THE TEAMS</span><h2>تیم‌های مدرسه</h2></div><button className="text-btn" onClick={() => setShowAllTeams(v => !v)}>{showAllTeams ? "کمتر" : "نمایش همه"}</button></div>
        <div className="public-team-grid">{displayTeams.length ? displayTeams.map((t,i) => { const row=rows.find(r=>r.id===t.id); return <button key={t.id} className="public-team-card" onClick={() => { setSelectedTeam(t.id); tapSound(); document.getElementById("team-area")?.scrollIntoView({behavior:"smooth"}); }}><span className="jersey-number">{String(i+1).padStart(2,"0")}</span><div className="team-emblem">⚽</div><b>{t.name}</b><small>{row ? row.points + " امتیاز · رتبه " + (rows.findIndex(r=>r.id===t.id)+1) : "هنوز بدون نتیجه"}</small></button> }) : <div className="empty-state">هنوز تیمی ثبت نشده.</div>}</div>
      </section>
      <section className="public-section football-lounge">
        <div className="section-title"><div><span className="eyebrow">SEASON HUB</span><h2>نبض لیگ مدرسه</h2></div><span>هر هفته یک داستان جدید</span></div>
        <div className="lounge-grid">
          <div className="podium-card"><div className="podium-orbit orbit-a"></div><div className="podium-orbit orbit-b"></div><span className="eyebrow">TOP OF THE TABLE</span><div className="podium-cup">🏆</div><h3>{leader?.name ?? "هنوز صدرنشینی مشخص نیست"}</h3><p>{leader ? leader.points + " امتیاز · " + leader.played + " بازی" : "با ثبت اولین نتایج، اینجا روشن می‌شود."}</p><div className="podium-bars"><i></i><i></i><i></i></div></div>
          <div className="fan-card"><span className="eyebrow">FAN ZONE</span><h3>مدرسه امروز، ورزشگاه امشب.</h3><p>نتیجه بازی‌ها را بعد از مدرسه چک کن، تیم خودت را دنبال کن و ببین جدول چطور عوض شده.</p><div className="fan-tags"><span>⚽ نتایج</span><span>🏆 جدول</span><span>👕 تیم‌ها</span></div><div className="fan-ball">⚽</div></div>
        </div>
      </section>
      <section className="public-section" id="standings">
        <div className="section-title"><div><span className="eyebrow">LEAGUE TABLE</span><h2>جدول رده‌بندی</h2></div><span>با نتایج ثبت‌شده</span></div>
        <div className="public-table">{rows.length ? rows.map((r,i) => <div className={r.id === selectedTeam ? "public-row selected" : "public-row"} key={r.id} onClick={() => setSelectedTeam(r.id)}><b>{i+1}</b><span className="rank-ball"></span><strong>{r.name}</strong><span>{r.played} بازی</span><span>{r.gd > 0 ? "+" : ""}{r.gd}</span><em>{r.points}</em></div>) : <div className="empty-state">هنوز نتیجه‌ای ثبت نشده.</div>}</div>
      </section>
      <section className="public-section team-focus" id="team-area">
        <div className="section-title"><div><span className="eyebrow">TEAM FOLLOW</span><h2>{teamName(selectedTeam)}</h2></div><span>بازی‌های تیم</span></div>
        <div className="follow-card"><div className="follow-badge">⚽</div><div><b>{teamName(selectedTeam)}</b><small>{(rows.find(r=>r.id===selectedTeam)?.points ?? 0) + " امتیاز · " + (rows.find(r=>r.id===selectedTeam)?.played ?? 0) + " بازی"}</small></div><div className="follow-actions"><a href="#matches">بازی‌ها</a><a href="#standings">جدول</a></div></div>
        <div className="match-list public-match-list">{myMatches.slice(0,6).map(m => <div className="match" key={m.id}><div className="match-date">{m.scheduled_at ? new Date(m.scheduled_at).toLocaleString("fa-IR",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}) : "بدون زمان"}<span className={m.status === "completed" ? "done" : m.status === "live" ? "live-label" : "next"}>{m.status === "completed" ? "پایان" : m.status === "live" ? "LIVE" : "بعدی"}</span></div><div className="teams"><span>{teamName(m.home_team_id)}</span><b>{m.status === "scheduled" ? "—" : (m.home_score ?? 0) + " - " + (m.away_score ?? 0)}</b><span>{teamName(m.away_team_id)}</span></div></div>)}</div>
      </section>
      <section className="public-section season-ticker"><div className="ticker-track"><span>⚽ SCHOOL FOOTBALL</span><span>•</span><span>نتیجه بعدی را از دست نده</span><span>•</span><span>🏆 فصل مدرسه</span><span>•</span><span>بازی جوانمردانه، رقابت واقعی</span><span>•</span><span>⚽ SCHOOL FOOTBALL</span></div></section>
      <footer className="public-footer"><div><b>School Football</b><span>لیگ فوتبال مدرسه · نتایج و جدول در یک نگاه</span></div><button className="teacher-link" onClick={() => router.push("/login")}>ورود معلم</button></footer>
    </main>
  );
}