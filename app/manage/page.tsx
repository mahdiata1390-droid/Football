"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Team={id:string;name:string;class_id:string|null};
type ClassRow={id:string;name:string;grade:string|null;section:string|null};
type Player={id:string;full_name:string;position:string|null;team_id:string|null;class_id:string|null};

export default function ManagePage(){
 const supabase=createClient();
 const [tab,setTab]=useState<"teams"|"classes"|"players">("teams");
 const [teams,setTeams]=useState<Team[]>([]);
 const [classes,setClasses]=useState<ClassRow[]>([]);
 const [players,setPlayers]=useState<Player[]>([]);
 const [name,setName]=useState(""); const [classId,setClassId]=useState("");
 const [busy,setBusy]=useState(true); const [message,setMessage]=useState(""); const [schoolId,setSchoolId]=useState("");

 const load=useCallback(async()=>{
  setBusy(true); const {data:userData}=await supabase.auth.getUser(); if(userData.user){const {data:profile}=await supabase.from("profiles").select("school_id").eq("id",userData.user.id).single(); if(profile)setSchoolId(profile.school_id);}
  const [t,c,p]=await Promise.all([
   supabase.from("teams").select("id,name,class_id").order("created_at",{ascending:false}),
   supabase.from("classes").select("id,name,grade,section").order("created_at",{ascending:false}),
   supabase.from("players").select("id,full_name,position,team_id,class_id").order("created_at",{ascending:false})
  ]);
  setTeams(t.data??[]);setClasses(c.data??[]);setPlayers(p.data??[]);setBusy(false);
 },[supabase]);
 useEffect(()=>{void load()},[load]);

 async function add(){
  if(!name.trim())return;
  setMessage("");
  let error;
  if(tab==="teams") ({error}=await supabase.from("teams").insert({school_id:schoolId,name:name.trim(),class_id:classId||null}));
  if(tab==="classes") ({error}=await supabase.from("classes").insert({school_id:schoolId,name:name.trim()}));
  if(tab==="players") ({error}=await supabase.from("players").insert({school_id:schoolId,full_name:name.trim(),team_id:classId||null}));
  if(error)setMessage(error.message); else {setName("");setClassId("");await load()}
 }
 async function remove(table:string,id:string){await supabase.from(table).delete().eq("id",id);await load()}

 return <main className="manage-page" dir="rtl">
  <header className="manage-header"><div><span className="eyebrow">SCHOOL MANAGEMENT</span><h1>مدیریت مدرسه</h1><p>کلاس‌ها، تیم‌ها و بازیکن‌ها را از همین‌جا مدیریت کن.</p></div><a href="/" className="back-link">← داشبورد</a></header>
  <div className="manage-tabs">{[["teams","تیم‌ها"],["classes","کلاس‌ها"],["players","بازیکنان"]].map(([id,label])=><button className={tab===id?"active":""} onClick={()=>setTab(id as typeof tab)} key={id}>{label}</button>)}</div>
  <section className="manage-card">
   <div className="create-row"><input value={name} onChange={e=>setName(e.target.value)} placeholder={tab==="teams"?"نام تیم":tab==="classes"?"نام کلاس":"نام بازیکن"}/>{tab==="teams"&&<select value={classId} onChange={e=>setClassId(e.target.value)}><option value="">بدون کلاس</option>{classes.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select>}{tab==="players"&&<select value={classId} onChange={e=>setClassId(e.target.value)}><option value="">تیم بازیکن</option>{teams.map(t=><option value={t.id} key={t.id}>{t.name}</option>)}</select>}<button className="primary" onClick={add}>+ افزودن</button></div>
   {message&&<div className="form-error">{message}</div>}
   {busy?<div className="empty-state">در حال بارگذاری...</div>:tab==="teams"?<List items={teams.map(t=>({id:t.id,title:t.name,sub:classes.find(c=>c.id===t.class_id)?.name||"بدون کلاس"}))} remove={id=>remove("teams",id)}/>:tab==="classes"?<List items={classes.map(c=>({id:c.id,title:c.name,sub:[c.grade,c.section].filter(Boolean).join(" • ")||"کلاس مدرسه"}))} remove={id=>remove("classes",id)}/>:<List items={players.map(p=>({id:p.id,title:p.full_name,sub:teams.find(t=>t.id===p.team_id)?.name||"بدون تیم"}))} remove={id=>remove("players",id)}/>}
  </section>
 </main>
}
function List({items,remove}:{items:{id:string;title:string;sub:string}[];remove:(id:string)=>void}){return <div className="manage-list">{items.length?items.map((x,i)=><div className="manage-item" key={x.id}><span className="item-num">{i+1}</span><div><b>{x.title}</b><small>{x.sub}</small></div><button onClick={()=>remove(x.id)}>حذف</button></div>):<div className="empty-state">هنوز چیزی ثبت نشده.</div>}</div>}
