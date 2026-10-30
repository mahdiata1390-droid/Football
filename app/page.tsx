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

  if (loading) return <main className="auth-page" dir="rtl"><div className="auth-card"><div className="brand-mark">⚽</div><h1>در حال بارگذاری لیگ مدرسه...</h1><p className="auth-subtitle">نتایج و جدول در حال دریافت است.</p></div></main>;

  return (
    <main className="manage-page" dir="rtl">
      <header className="manage-header">
        <div><span className="eyebrow">SCHOOL FOOTBALL</span><h1>{schoolName}</h1><p>نتایج، جدول و وضعیت تیم‌های مسابقات مدرسه</p></div>
        <button className="primary" onClick={() => router.push("/login")}>ورود معلم</button>
      </header>

      <section className="manage-card" style={{ marginBottom: 20 }}>
        <div className="panel-head"><div><span className="eyebrow">MY TEAM</span><h2>تیم خودت را انتخاب کن</h2></div></div>
        <div className="team-picker">
          {teams.length ? teams.map(t => <button className={selectedTeam === t.id ? "selected" : ""} key={t.id} onClick={() => setSelectedTeam(t.id)}>{selectedTeam === t.id ? "✓ " : ""}{t.name}</button>) : <div className="empty-state">هنوز تیمی ثبت نشده.</div>}
        </div>
      </section>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head"><div><span className="eyebrow">TEAM MATCHES</span><h3>بازی‌های تیم</h3></div></div>
          <div className="match-list">
            {myMatches.length ? myMatches.slice(0,8).map(m => <div className="match" key={m.id}>
              <div className="match-date">{m.scheduled_at ? new Date(m.scheduled_at).toLocaleString("fa-IR", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }) : "بدون زمان"}<span className={m.status === "completed" ? "done" : "next"}>{m.status === "completed" ? "پایان یافته" : "برنامه‌ریزی شده"}</span></div>
              <div className="teams"><span>{teamName(m.home_team_id)}</span><b>{m.status === "scheduled" ? "—" : `${m.home_score} - ${m.away_score}`}</b><span>{teamName(m.away_team_id)}</span></div>
            </div>) : <div className="empty-state">برای این تیم مسابقه‌ای ثبت نشده.</div>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><div><span className="eyebrow">LEAGUE TABLE</span><h3>جدول رده‌بندی</h3></div></div>
          <div className="table">
            {rows.length ? rows.map((r,i) => <div className="row" key={r.id}><b className="rank">{i+1}</b><div className="team-dot"></div><span className="team-name">{r.name}</span><span>{r.played}</span><strong>{r.points}</strong></div>) : <div className="empty-state">هنوز نتیجه‌ای ثبت نشده.</div>}
          </div>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 20 }}>
        <div className="panel-head"><div><span className="eyebrow">PUBLIC VIEW</span><h3>فقط مشاهده</h3></div><small>تغییر اطلاعات فقط از پنل معلم امکان‌پذیر است.</small></div>
      </section>
    </main>
  );
}