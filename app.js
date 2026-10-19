"use strict";
const $ = s => document.querySelector(s), main = $("#main"), modal = $("#modal");
let D = null, S = {view:"home", q:"", organ:"", cats:new Set([0,1,2,3,4,5])};
const store = {get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}}, set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
let marks = new Set(store.get("pm_bookmarks",[])), score = store.get("pm_quiz",{right:0,total:0});
const esc = s => String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ci = e => D.categories.indexOf(e.category);
const short = c => c.replace("Non-neoplastic - ","NN: ").replace("Neoplastic - ","");
function hl(t, q){ t = esc(t); if(!q) return t;
  const terms = q.trim().split(/\s+/).filter(Boolean).map(x=>esc(x).replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));
  return terms.length ? t.replace(new RegExp("("+terms.join("|")+")","gi"),"<mark>$1</mark>") : t; }
function entRow(e){ const q=S.q; return `<div class="ent c${ci(e)}" data-id="${e.id}"><div class="t">${marks.has(e.id)?"★ ":""}${hl(e.entity,q)}</div>
<div class="mut">${esc(e.organ)} · ${esc(short(e.category))}${e.subgroup?" · "+hl(e.subgroup,q):""}</div>
${e.variants&&e.variants!=="—"?`<div class="v">${hl(e.variants,q)}</div>`:""}${q&&e.remarks&&new RegExp(q.split(/\s+/)[0].replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"i").test(e.remarks)?`<div class="v mut">${hl(e.remarks,q)}</div>`:""}</div>`; }
function setView(v){ S.view=v; document.querySelectorAll("nav [data-v]").forEach(b=>b.classList.toggle("on",b.dataset.v===v)); render(); scrollTo(0,0); }
function render(){ ({home,search,bookmarks,quiz})[S.view](); }
function home(){ const done=D.organs.filter(o=>o.status==="done").length, n=D.organs.length;
  main.innerHTML=`<h2>Organs</h2><div class="mut">${done} of ${n} organs done · ${D.entities.length} entities</div><div class="bar"><i style="width:${100*done/n}%"></i></div>
  <div class="grid">${D.organs.map(o=>`<button class="organ ${o.status}" data-o="${esc(o.name)}" ${o.status==="done"?"":"disabled"}><span class="mut">${o.index}</span><b>${esc(o.name)}</b><span class="mut">${o.status==="done"?o.count+" entities":"pending"}</span></button>`).join("")}</div>`;
  main.querySelectorAll(".organ.done").forEach(b=>b.onclick=()=>{S.organ=b.dataset.o;S.q="";setView("search");}); }
function filtered(){ const terms=S.q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return D.entities.filter(e=>(!S.organ||e.organ===S.organ)&&S.cats.has(ci(e))&&
    terms.every(t=>(e.entity+" "+e.variants+" "+e.remarks+" "+e.subgroup).toLowerCase().includes(t))); }
function search(){ const doneOrgans=D.organs.filter(o=>o.status==="done");
  main.innerHTML=`<input id="q" type="search" placeholder="Search entity, variants, remarks…" value="${esc(S.q)}" autocomplete="off">
  <div class="filters"><select id="org"><option value="">All organs</option>${doneOrgans.map(o=>`<option ${o.name===S.organ?"selected":""}>${esc(o.name)}</option>`).join("")}</select></div>
  <div class="filters">${D.categories.map((c,i)=>`<span class="chip c${i} ${S.cats.has(i)?"":"off"}" data-c="${i}">${esc(short(c))}</span>`).join("")}</div><div id="res"></div>`;
  const q=$("#q"); q.oninput=()=>{S.q=q.value;results();}; $("#org").onchange=e=>{S.organ=e.target.value;results();};
  main.querySelectorAll(".chip").forEach(ch=>ch.onclick=()=>{const i=+ch.dataset.c; S.cats.has(i)?S.cats.delete(i):S.cats.add(i); ch.classList.toggle("off"); results();});
  results(); }
function results(){ const r=filtered(); $("#res").innerHTML=`<div class="mut">${r.length} result${r.length===1?"":"s"}</div>`+r.slice(0,300).map(entRow).join(""); bindEnts($("#res")); }
function bindEnts(el){ el.querySelectorAll(".ent").forEach(x=>x.onclick=()=>detail(x.dataset.id)); }
function detail(id){ const e=D.entities.find(x=>x.id===id);
  modal.innerHTML=`<div class="sheet"><div class="chip c${ci(e)}" style="display:inline-block">${esc(e.category)}</div><h2>${esc(e.entity)}</h2>
  <dl><dt>Organ</dt><dd>${esc(e.organ)}</dd>${e.subgroup?`<dt>Subgroup</dt><dd>${esc(e.subgroup)}</dd>`:""}
  ${e.variants?`<dt>Variants / subtypes</dt><dd>${esc(e.variants)}</dd>`:""}${e.remarks?`<dt>Remarks / key features</dt><dd>${esc(e.remarks)}</dd>`:""}</dl>
  <button class="btn" id="bm">${marks.has(id)?"★ Remove bookmark":"☆ Bookmark"}</button><button class="btn alt" id="cl">Close</button></div>`;
  modal.classList.remove("hidden"); $("#cl").onclick=close;
  $("#bm").onclick=()=>{marks.has(id)?marks.delete(id):marks.add(id); store.set("pm_bookmarks",[...marks]); close(); render();}; }
function close(){ modal.classList.add("hidden"); }
modal.onclick=e=>{ if(e.target===modal) close(); };
function bookmarks(){ const r=D.entities.filter(e=>marks.has(e.id));
  main.innerHTML=`<h2>Bookmarks</h2>${r.length?r.map(entRow).join(""):'<p class="mut">No bookmarks yet. Open an entity and tap ☆ Bookmark.</p>'}`; bindEnts(main); }
function quiz(){ const pool=D.entities.filter(e=>!S.organ||e.organ===S.organ); const e=pool[Math.floor(Math.random()*pool.length)];
  main.innerHTML=`<h2>Quiz</h2><div class="mut">Score ${score.right}/${score.total} · ${S.organ||"all organs"} <a href="#" id="rs">reset</a></div>
  <div class="card" style="margin-top:8px"><div class="mut">${esc(e.organ)} — which category is:</div><h2>${esc(e.entity)}</h2>
  <div class="opts">${D.categories.map((c,i)=>`<button class="c${i}" data-i="${i}">${esc(c)}</button>`).join("")}</div><div id="ans"></div></div>`;
  $("#rs").onclick=ev=>{ev.preventDefault();score={right:0,total:0};store.set("pm_quiz",score);quiz();};
  main.querySelectorAll(".opts button").forEach(b=>b.onclick=()=>{ if($("#ans").innerHTML) return;
    const ok=+b.dataset.i===ci(e); score.total++; if(ok) score.right++; store.set("pm_quiz",score);
    b.classList.add(ok?"ok":"no"); main.querySelector(`.opts [data-i="${ci(e)}"]`).classList.add("ok");
    $("#ans").innerHTML=`<p><b>${ok?"✔ Correct":"✘ "+esc(e.category)}</b></p>${e.variants?`<p><b>Variants:</b> ${esc(e.variants)}</p>`:""}${e.remarks?`<p class="mut">${esc(e.remarks)}</p>`:""}<button class="btn" id="nx">Next →</button>`;
    $("#nx").onclick=quiz; }); }
function applyDark(d){ document.documentElement.classList.toggle("dark",d); store.set("pm_dark",d); }
$("#darkBtn").onclick=()=>applyDark(!document.documentElement.classList.contains("dark"));
document.querySelectorAll("nav [data-v]").forEach(b=>b.onclick=()=>{ if(b.dataset.v==="search"&&S.view!=="search"){} setView(b.dataset.v); });
$("#homeBtn").onclick=()=>{S.organ="";setView("home");};
applyDark(store.get("pm_dark", matchMedia("(prefers-color-scheme: dark)").matches));
fetch("data.json").then(r=>r.json()).then(d=>{D=d; setView("home");}).catch(()=>main.innerHTML="<p>Could not load data.</p>");
if("serviceWorker" in navigator) addEventListener("load",()=>navigator.serviceWorker.register("sw.js").then(r=>window.__swReg=r).catch(console.error));
