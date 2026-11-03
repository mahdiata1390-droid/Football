"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Team = { id: string; name: string; class_id: string | null };
type SchoolClass = { id: string; name: string; grade: string | null; section: string | null };
type Player = { id: string; full_name: string; class_id: string | null; team_id: string | null };
type PlayerStat = { player_id: string; match_id: string; goals: number; fair_play_points: number };
type Match = { id: string; home_team_id: string; away_team_id: string; home_score: number | null; away_score: number | null; status: string; scheduled_at: string | null; tournament_id?: string | null };
type Row = { id: string; name: string; class_id: string | null; played: number; wins: number; draws: number; losses: number; gf: number; ga: number; gd: number; points: number };

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [teams, setTeams] = useState<Team[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [schoolName, setSchoolName] = useState("مدرسه");
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [showAllTeams, setShowAllTeams] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  function playSound(kind: "tap" | "whoosh" | "success" = "tap", force = false) {
    if ((!soundOn && !force) || typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const ctx = audioRef.current ?? new AudioCtx();
      audioRef.current = ctx;
      if (ctx.state === "suspended") void ctx.resume();

      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(kind === "success" ? 0.075 : 0.055, now + 0.008);
      master.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "whoosh" ? 0.16 : 0.12));
      master.connect(ctx.destination);

      if (kind === "whoosh") {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(720, now + 0.13);
        osc.connect(master);
        osc.start(now);
        osc.stop(now + 0.17);
      } else if (kind === "success") {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        osc.connect(master);
        osc.start(now);
        osc.stop(now + 0.13);

        const chime = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chime.type = "sine";
        chime.frequency.setValueAtTime(1040, now + 0.07);
        chimeGain.gain.setValueAtTime(0.0001, now);
        chimeGain.gain.exponentialRampToValueAtTime(0.045, now + 0.08);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
        chime.connect(chimeGain).connect(ctx.destination);
        chime.start(now + 0.06);
        chime.stop(now + 0.2);
      } else {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(690, now + 0.055);
        osc.connect(master);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch {
      // Audio is an enhancement; UI must still work if the browser blocks it.
    }
  }

  useEffect(() => () => {
    const ctx = audioRef.current;
    if (ctx && ctx.state !== "closed") void ctx.close();
  }, []);

  const load = useCallback(async () => {
    const [{ data: school }, { data: teamData }, { data: matchData }, { data: classData }, { data: playerData }, { data: statData }] = await Promise.all([
      supabase.from("schools").select("name").limit(1).maybeSingle(),
      supabase.from("teams").select("id,name,class_id").order("name"),
      supabase.from("matches").select("id,home_team_id,away_team_id,home_score,away_score,status,scheduled_at,tournament_id").order("scheduled_at", { ascending: false, nullsFirst: false }).limit(50),
      supabase.from("classes").select("id,name,grade,section").order("name"),
      supabase.from("players").select("id,full_name,class_id,team_id").order("full_name"),
      supabase.from("player_match_stats").select("player_id,match_id,goals,fair_play_points"),
    ]);

    if (school?.name) setSchoolName(school.name);
    const nextTeams = teamData ?? [];
    const nextMatches = matchData ?? [];
    setTeams(nextTeams);
    setClasses(classData ?? []);
    setPlayers(playerData ?? []);
    setPlayerStats(statData ?? []);
    if (!selectedTeam && nextTeams[0]) setSelectedTeam(nextTeams[0].id);
    setMatches(nextMatches);

    const table = new Map<string, Row>();
    for (const team of nextTeams) table.set(team.id, { id: team.id, name: team.name, class_id: team.class_id, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0 });
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
  const teamClass = (id: string) => { const t = teams.find(x => x.id === id); const c = classes.find(x => x.id === t?.class_id); return c?.name ?? "بدون کلاس"; };
  const playerName = (id: string) => players.find(p => p.id === id)?.full_name ?? "بازیکن";
  const className = (id: string | null) => classes.find(c => c.id === id)?.name ?? "بدون کلاس";
  const scorerTotals = new Map<string, { player_id: string; goals: number; fair: number }>();
  for (const s of playerStats) { const prev = scorerTotals.get(s.player_id) ?? { player_id: s.player_id, goals: 0, fair: 0 }; prev.goals += s.goals; prev.fair += s.fair_play_points; scorerTotals.set(s.player_id, prev); }
  const topScorers = [...scorerTotals.values()].sort((a,b) => b.goals-a.goals || b.fair-a.fair).slice(0, 8);
  const fairPlayers = [...scorerTotals.values()].sort((a,b) => b.fair-a.fair || b.goals-a.goals).slice(0, 5);
  const classGroups = classes.map(cls => ({ cls, rows: rows.filter(r => r.class_id === cls.id).sort((a,b) => b.points-a.points || b.gd-a.gd), scorer: topScorers.find(s => players.find(p => p.id === s.player_id)?.class_id === cls.id) }));
  const myMatches = matches.filter(m => !selectedTeam || m.home_team_id === selectedTeam || m.away_team_id === selectedTeam);
  const upcoming = matches.filter(m => m.status === "scheduled").sort((a,b) => new Date(a.scheduled_at ?? 0).getTime() - new Date(b.scheduled_at ?? 0).getTime()).slice(0, 3);
  const completed = matches.filter(m => m.status === "completed").sort((a,b) => new Date(b.scheduled_at ?? 0).getTime() - new Date(a.scheduled_at ?? 0).getTime());
  const recentResults = completed.slice(0, 6);
  const displayTeams = showAllTeams ? teams : teams.slice(0, 6);
  const leader = rows[0];
  const annualTournament = matches.length ? null : null;

  if (loading) return <main className="auth-page" dir="rtl"><div className="auth-card"><div className="brand-mark">⚽</div><h1>در حال بارگذاری لیگ مدرسه...</h1><p className="auth-subtitle">نتایج و جدول در حال دریافت است.</p></div></main>;

  return (
    <main className="public-home" dir="rtl">
      <header className="public-header">
        <div className="public-brand"><div className="brand-mark">⚽</div><div><b>School Football</b><span>{schoolName}</span></div></div>
        <div className="public-actions"><button className="sound-btn" onClick={() => { setSoundOn(v => !v); playSound("tap", true); }}>{soundOn ? "🔊" : "🔇"}</button><button className="teacher-link" onClick={() => { playSound("whoosh"); router.push("/login"); }}>پنل معلم</button></div>
      </header>
      <section className="public-hero elite-hero">
        <div className="hero-noise"></div>
        <div className="hero-grid-glow"></div>
        <div className="hero-copy-glass">
          <span className="live-badge"><i></i>{recentResults.length ? "آخرین نتایج مدرسه آماده‌اند" : "فصل جدید آماده شروع است"}</span>
          <div className="hero-kicker"><span>⚽ SCHOOL FOOTBALL</span><span>SEASON 01</span><span>EST. 2026</span></div>
          <h1>اینجا فقط بازی نیست،<br/><strong>لیگ مدرسه‌ست.</strong></h1>
          <p>نتیجه‌ها، جدول، تیم‌ها و بازی‌های هفته؛ همه‌چیز با حال‌وهوای یک ورزشگاه واقعی، برای بازیکن‌ها و هوادارهای مدرسه.</p>
          <div className="public-hero-actions"><a href="#matches" className="primary" onClick={() => playSound("whoosh")}>ورود به لیگ <b>←</b></a><a href="#standings" className="ghost" onClick={() => playSound("whoosh")}>مشاهده جدول</a></div>
          <div className="hero-mini-stats"><div><b>{teams.length}</b><span>تیم</span></div><i></i><div><b>{completed.length}</b><span>نتیجه</span></div><i></i><div><b>{upcoming.length}</b><span>بازی پیش‌رو</span></div></div>
        </div>
        <div className="stadium-stage" aria-hidden="true">
          <div className="stadium-sky"></div>
          <div className="stadium-lights"><i></i><i></i><i></i><i></i></div>
          <div className="stadium-stands stands-back"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
          <div className="stadium-scoreboard"><small>SCHOOL LEAGUE · SEASON 01</small><b>{completed[0] ? teamName(completed[0].home_team_id) : "HOME"} <em>{completed[0] ? (completed[0].home_score ?? 0) + " — " + (completed[0].away_score ?? 0) : "VS"}</em> {completed[0] ? teamName(completed[0].away_team_id) : "AWAY"}</b></div>
          <div className="stadium-field">
            <div className="field-half"></div><div className="field-center"></div><div className="field-box field-left"></div><div className="field-box field-right"></div>
            <div className="field-goal goal-left"></div><div className="field-goal goal-right"></div>
            <div className="hero-stadium-ball"></div>
          </div>
          <div className="stadium-crowd"></div>
          <div className="hero-float-badge"><span>🏆</span><div><b>{leader?.name ?? "رقابت شروع می‌شود"}</b><small>صدر جدول</small></div></div>
          <div className="hero-spotlight"></div>
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
        {recentResults.length > 0 && <div className="results-strip">{recentResults.slice(0,3).map(m => <div className="result-chip" key={m.id}><span>نتیجه</span><b>{teamName(m.home_team_id)}</b><strong>{m.home_score ?? 0} - {m.away_score ?? 0}</strong><b>{teamName(m.away_team_id)}</b><small>{teamClass(m.home_team_id)} · {teamClass(m.away_team_id)}</small></div>)}</div>}
        <div className="match-showcase">
          <div className="feature-match"><span className="eyebrow">{upcoming[0] ? "NEXT MATCH" : "LATEST RESULT"}</span>
            {upcoming[0] ? <><small>{new Date(upcoming[0].scheduled_at ?? 0).toLocaleString("fa-IR",{weekday:"long",day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"})}</small><div className="feature-teams"><b>{teamName(upcoming[0].home_team_id)}</b><strong>VS</strong><b>{teamName(upcoming[0].away_team_id)}</b></div><div className="match-pitch"><div>⚽</div></div></> : completed[0] ? <><small>آخرین نتیجه ثبت‌شده</small><div className="feature-teams"><b>{teamName(completed[0].home_team_id)}</b><strong>{completed[0].home_score} — {completed[0].away_score}</strong><b>{teamName(completed[0].away_team_id)}</b></div></> : <div className="empty-state">هنوز مسابقه‌ای ثبت نشده.</div>}
          </div>
          <div className="upcoming-list"><h3>بازی‌های پیش‌رو</h3>{upcoming.length ? upcoming.map(m => <div className="upcoming-card" key={m.id}><div className="fixture-time">{new Date(m.scheduled_at ?? 0).toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"})}</div><span>{teamName(m.home_team_id)}<small>{teamClass(m.home_team_id)}</small></span><b>VS</b><span>{teamName(m.away_team_id)}<small>{teamClass(m.away_team_id)}</small></span></div>) : <div className="empty-state">بازی بعدی هنوز مشخص نشده.</div>}</div>
        </div>
      </section>
      <section className="public-section teams-section">
        <div className="section-title"><div><span className="eyebrow">THE TEAMS</span><h2>تیم‌های مدرسه</h2></div><button className="text-btn" onClick={() => { setShowAllTeams(v => !v); playSound("tap"); }}>{showAllTeams ? "کمتر" : "نمایش همه"}</button></div>
        <div className="public-team-grid">{displayTeams.length ? displayTeams.map((t,i) => { const row=rows.find(r=>r.id===t.id); return <button key={t.id} className="public-team-card" onClick={() => { setSelectedTeam(t.id); playSound("success"); document.getElementById("team-area")?.scrollIntoView({behavior:"smooth"}); }}><span className="jersey-number">{String(i+1).padStart(2,"0")}</span><div className="team-emblem">⚽</div><b>{t.name}</b><small>{row ? row.points + " امتیاز · رتبه " + (rows.findIndex(r=>r.id===t.id)+1) : "هنوز بدون نتیجه"}</small></button> }) : <div className="empty-state">هنوز تیمی ثبت نشده.</div>}</div>
      </section>
      <section className="public-section football-lounge">
        <div className="section-title"><div><span className="eyebrow">SEASON HUB</span><h2>نبض لیگ مدرسه</h2></div><span>هر هفته یک داستان جدید</span></div>
        <div className="lounge-grid">
          <div className="podium-card"><div className="podium-orbit orbit-a"></div><div className="podium-orbit orbit-b"></div><span className="eyebrow">TOP OF THE TABLE</span><div className="podium-cup">🏆</div><h3>{leader?.name ?? "هنوز صدرنشینی مشخص نیست"}</h3><p>{leader ? leader.points + " امتیاز · " + leader.played + " بازی" : "با ثبت اولین نتایج، اینجا روشن می‌شود."}</p><div className="podium-bars"><i></i><i></i><i></i></div></div>
          <div className="fan-card"><span className="eyebrow">FAN ZONE</span><h3>مدرسه امروز، ورزشگاه امشب.</h3><p>نتیجه بازی‌ها را بعد از مدرسه چک کن، تیم خودت را دنبال کن و ببین جدول چطور عوض شده.</p><div className="fan-tags"><span>⚽ نتایج</span><span>🏆 جدول</span><span>👕 تیم‌ها</span></div><div className="fan-ball">⚽</div></div>
        </div>
      </section>
      <section className="public-section class-leagues">
        <div className="section-title"><div><span className="eyebrow">CLASS LEAGUES</span><h2>لیگ‌های کلاس‌ها</h2></div><span>هر کلاس، لیگ خودش</span></div>
        <div className="class-league-grid">{classGroups.filter(g => g.rows.length || g.scorer).map(g => <article className="class-league-card" key={g.cls.id}>
          <div className="class-league-head"><div><span>لیگ کلاس</span><h3>{g.cls.name}</h3></div><b>⚽</b></div>
          <div className="class-league-table">{g.rows.length ? g.rows.slice(0,4).map((r,i)=><div key={r.id}><strong>{i+1}</strong><span>{r.name}</span><b>{r.points}</b></div>) : <p>هنوز نتیجه‌ای ثبت نشده.</p>}</div>
          <div className="class-top-scorer"><span>آقای گل کلاس</span><b>{g.scorer ? playerName(g.scorer.player_id) : "هنوز مشخص نیست"}</b><small>{g.scorer ? g.scorer.goals + " گل" : "با ثبت آمار بازی‌ها مشخص می‌شود"}</small></div>
        </article>)}</div>
      </section>
      <section className="public-section awards-section">
        <div className="section-title"><div><span className="eyebrow">SEASON AWARDS</span><h2>جوایز فصل</h2></div><span>قهرمان‌ها و ستاره‌های مدرسه</span></div>
        <div className="award-grid">
          <article className="award-card gold"><span>🥇</span><small>آقای گل مدرسه</small><h3>{topScorers[0] ? playerName(topScorers[0].player_id) : "هنوز مشخص نیست"}</h3><b>{topScorers[0] ? topScorers[0].goals + " گل" : "آمار گل‌ها بعد از ثبت مسابقات"}</b></article>
          <article className="award-card fair"><span>🤝</span><small>آقای اخلاق</small><h3>{fairPlayers[0] ? playerName(fairPlayers[0].player_id) : "هنوز مشخص نیست"}</h3><b>{fairPlayers[0] ? fairPlayers[0].fair + " امتیاز اخلاق" : "امتیازهای Fair Play بعد از هر بازی"}</b></article>
          <article className="award-card cup"><span>🏆</span><small>جام سالانه مدرسه</small><h3>{leader?.name ?? "قهرمان سال"}</h3><b>تورنمنت سالانه کل مدرسه</b></article>
        </div>
      </section>
      <section className="public-section" id="standings">
        <div className="section-title"><div><span className="eyebrow">LEAGUE TABLE</span><h2>جدول رده‌بندی</h2></div><span>با نتایج ثبت‌شده</span></div>
        <div className="public-table">{rows.length ? rows.map((r,i) => <div className={r.id === selectedTeam ? "public-row selected" : "public-row"} key={r.id} onClick={() => { setSelectedTeam(r.id); playSound("tap"); }}><b>{i+1}</b><span className="rank-ball"></span><strong>{r.name}</strong><span>{r.played} بازی</span><span>{r.gd > 0 ? "+" : ""}{r.gd}</span><em>{r.points}</em></div>) : <div className="empty-state">هنوز نتیجه‌ای ثبت نشده.</div>}</div>
      </section>
      <section className="public-section team-focus" id="team-area">
        <div className="section-title"><div><span className="eyebrow">TEAM FOLLOW</span><h2>{teamName(selectedTeam)}</h2></div><span>بازی‌های تیم</span></div>
        <div className="follow-card"><div className="follow-badge">⚽</div><div><b>{teamName(selectedTeam)}</b><small>{(rows.find(r=>r.id===selectedTeam)?.points ?? 0) + " امتیاز · " + (rows.find(r=>r.id===selectedTeam)?.played ?? 0) + " بازی"}</small></div><div className="follow-actions"><a href="#matches" onClick={() => playSound("whoosh")}>بازی‌ها</a><a href="#standings" onClick={() => playSound("whoosh")}>جدول</a></div></div>
        <div className="match-list public-match-list">{myMatches.slice(0,6).map(m => <div className="match" key={m.id}><div className="match-date">{m.scheduled_at ? new Date(m.scheduled_at).toLocaleString("fa-IR",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}) : "بدون زمان"}<span className={m.status === "completed" ? "done" : m.status === "live" ? "live-label" : "next"}>{m.status === "completed" ? "پایان" : m.status === "live" ? "LIVE" : "بعدی"}</span></div><div className="teams"><span>{teamName(m.home_team_id)}<small>{teamClass(m.home_team_id)}</small></span><b>{m.status === "scheduled" ? "—" : (m.home_score ?? 0) + " - " + (m.away_score ?? 0)}</b><span>{teamName(m.away_team_id)}<small>{teamClass(m.away_team_id)}</small></span></div></div>)}</div>
      </section>
      <section className="public-section season-ticker"><div className="ticker-track"><span>⚽ SCHOOL FOOTBALL</span><span>•</span><span>نتیجه بعدی را از دست نده</span><span>•</span><span>🏆 فصل مدرسه</span><span>•</span><span>بازی جوانمردانه، رقابت واقعی</span><span>•</span><span>⚽ SCHOOL FOOTBALL</span></div></section>
      <footer className="public-footer"><div><b>School Football</b><span>لیگ فوتبال مدرسه · نتایج و جدول در یک نگاه</span></div><button className="teacher-link" onClick={() => { playSound("whoosh"); router.push("/login"); }}>ورود معلم</button></footer>
    </main>
  );
}