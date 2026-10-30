"use client";

import { useState } from "react";

const teams = [
  { name: "کلاس ۱۰/۱", short: "10/1", played: 4, points: 10, color: "lime" },
  { name: "کلاس ۱۱/۲", short: "11/2", played: 4, points: 8, color: "blue" },
  { name: "کلاس ۱۰/۳", short: "10/3", played: 4, points: 6, color: "orange" },
  { name: "کلاس ۱۲/۱", short: "12/1", played: 4, points: 4, color: "purple" }
];

const matches = [
  { home: "۱۰/۱", away: "۱۱/۲", score: "۳ - ۲", status: "پایان یافته", date: "امروز • ۱۰:۳۰" },
  { home: "۱۰/۳", away: "۱۲/۱", score: "۱ - ۱", status: "پایان یافته", date: "امروز • ۱۲:۰۰" },
  { home: "۱۱/۲", away: "۱۲/۱", score: "—", status: "برنامه‌ریزی شده", date: "فردا • ۱۰:۳۰" }
];

export default function Home() {
  const [tab, setTab] = useState("داشبورد");
  const [showTeam, setShowTeam] = useState(false);
  const [teamName, setTeamName] = useState("");

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">⚽</div><div><b>School Football</b><span>مدیریت فوتبال مدرسه</span></div></div>
        <div className="school-card"><span>مدرسه نمونه</span><strong>لیگ فوتبال ۱۴۰۵</strong><small>فصل فعال</small></div>
        <nav>{["داشبورد","کلاس‌ها و تیم‌ها","مسابقات","تورنمنت‌ها","جدول رده‌بندی","بازیکنان"].map(item => <button key={item} className={tab===item?"active":""} onClick={()=>setTab(item)}>{item}</button>)}</nav>
        <div className="sidebar-bottom"><div className="teacher"><div className="avatar">م</div><div><b>مدیر مسابقات</b><span>معلم ورزش</span></div></div><button className="settings">⚙ تنظیمات</button></div>
      </aside>

      <section className="content">
        <header className="topbar"><div><span className="eyebrow">پنل مدیریت</span><h1>{tab}</h1><p>مسابقات فوتبال مدرسه را یک‌جا مدیریت کن.</p></div><div className="top-actions"><button className="icon-btn">⌕</button><button className="profile-btn">م</button></div></header>

        {tab === "داشبورد" ? <>
          <section className="hero"><div><span className="pill">● فصل ۱۴۰۵ فعال</span><h2>وقتشه لیگ مدرسه رو شروع کنیم.</h2><p>تیم‌ها را بساز، بازیکن‌ها را اضافه کن و مسابقات را مدیریت کن.</p><div className="hero-actions"><button className="primary" onClick={()=>setShowTeam(true)}>+ ساخت تیم جدید</button><button className="ghost" onClick={()=>setTab("تورنمنت‌ها")}>ساخت تورنمنت</button></div></div><div className="hero-ball">⚽</div></section>

          <div className="stats"><div><span>تیم‌های فعال</span><strong>۱۲</strong><small>+۳ این هفته</small></div><div><span>مسابقات انجام‌شده</span><strong>۲۴</strong><small>از ۳۶ مسابقه</small></div><div><span>بازیکنان ثبت‌شده</span><strong>۱۴۸</strong><small>از ۱۲ کلاس</small></div><div><span>تورنمنت‌ها</span><strong>۳</strong><small>۱ تورنمنت فعال</small></div></div>

          <div className="grid-2"><section className="panel"><div className="panel-head"><div><span className="eyebrow">LIVE BOARD</span><h3>بازی‌های اخیر</h3></div><button className="text-btn" onClick={()=>setTab("مسابقات")}>همه مسابقات ←</button></div><div className="match-list">{matches.map((m,i)=><div className="match" key={i}><div className="match-date">{m.date}<span className={m.status==="پایان یافته"?"done":"next"}>{m.status}</span></div><div className="teams"><span>{m.home}</span><b>{m.score}</b><span>{m.away}</span></div></div>)}</div></section>
          <section className="panel"><div className="panel-head"><div><span className="eyebrow">TOP TABLE</span><h3>جدول رده‌بندی</h3></div><button className="text-btn" onClick={()=>setTab("جدول رده‌بندی")}>مشاهده جدول ←</button></div><div className="table">{teams.map((t,i)=><div className="row" key={t.name}><b className="rank">{i+1}</b><div className={"team-dot "+t.color}></div><span className="team-name">{t.name}</span><span>{t.played}</span><strong>{t.points}</strong></div>)}</div></section></div>

          <section className="panel tournaments"><div className="panel-head"><div><span className="eyebrow">COMPETITIONS</span><h3>تورنمنت‌های مدرسه</h3></div><button className="text-btn" onClick={()=>setTab("تورنمنت‌ها")}>مدیریت تورنمنت‌ها ←</button></div><div className="tournament-grid"><article><span className="t-icon">🏆</span><div><b>لیگ فوتبال ۱۴۰۵</b><p>۱۲ تیم • ۳۶ مسابقه</p></div><span className="status live">در حال برگزاری</span></article><article><span className="t-icon">🥇</span><div><b>جام حذفی مدرسه</b><p>۸ تیم • مرحله یک‌هشتم</p></div><span className="status">به‌زودی</span></article><article><span className="t-icon">⚡</span><div><b>جام بین‌کلاسی</b><p>۶ تیم • ثبت‌نام باز است</p></div><span className="status">ثبت‌نام</span></article></div></section>
        </> : <section className="empty-panel"><div className="empty-icon">⚽</div><h2>{tab}</h2><p>این بخش آماده است تا امکانات کامل مدیریت {tab} را اضافه کنیم.</p><button className="primary" onClick={()=>setTab("داشبورد")}>بازگشت به داشبورد</button></section>}
      </section>

      {showTeam && <div className="modal-backdrop" onClick={()=>setShowTeam(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setShowTeam(false)}>×</button><span className="eyebrow">TEAM SETUP</span><h2>ساخت تیم جدید</h2><p>تیم را برای یکی از کلاس‌های مدرسه ایجاد کن.</p><label>نام تیم<input value={teamName} onChange={e=>setTeamName(e.target.value)} placeholder="مثلاً کلاس ۱۰/۲" /></label><button className="primary full" onClick={()=>{setShowTeam(false);setTeamName("")}}>ایجاد تیم</button></div></div>}
    </main>
  );
}