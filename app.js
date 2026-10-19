"use strict";
const $ = s => document.querySelector(s), main = $("#main"), modal = $("#modal");
let D = null, S = {view:"home", q:"", organ:"", cats:new Set([0,1,2,3,4,5]), deep:false, qmode:"cat"};
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
${e.variants&&e.variants!=="—"?`<div class="v">${hl(e.variants,q)}</div>`:""}${S.deep&&q&&!core(e).includes(q.trim().split(/\s+/)[0].toLowerCase())?`<div class="v mut">in description: ${hl(snippet(e.histo,q)||snippet(e.ihc,q)||snippet(e.cyto,q),q)}</div>`:""}${q&&e.remarks&&new RegExp(q.split(/\s+/)[0].replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"i").test(e.remarks)?`<div class="v mut">${hl(e.remarks,q)}</div>`:""}</div>`; }
function setView(v){ S.view=v; document.querySelectorAll("nav [data-v]").forEach(b=>b.classList.toggle("on",b.dataset.v===v)); render(); scrollTo(0,0); }
function render(){ ({home,search,bookmarks,quiz})[S.view](); }
function home(){ const done=D.organs.filter(o=>o.status==="done").length, n=D.organs.length;
  main.innerHTML=`<h2>Organs</h2><div class="mut">${done} of ${n} organs done · ${D.entities.length} entities</div><div class="bar"><i style="width:${100*done/n}%"></i></div>
  <div class="grid">${D.organs.map(o=>`<button class="organ ${o.status}" data-o="${esc(o.name)}" ${o.status==="done"?"":"disabled"}><span class="mut">${o.index}</span><b>${esc(o.name)}</b><span class="mut">${o.status==="done"?o.count+" entities":"pending"}</span></button>`).join("")}</div>`;
  main.querySelectorAll(".organ.done").forEach(b=>b.onclick=()=>{S.organ=b.dataset.o;S.q="";setView("search");}); }
const core=e=>(e.entity+" "+e.variants+" "+e.remarks+" "+e.subgroup).toLowerCase();
const desc=e=>((e.histo||"")+" "+(e.cyto||"")+" "+(e.ihc||"")).toLowerCase();
function rank(e,terms,q){ const n=e.entity.toLowerCase(), nb=n.replace(/\s*\(.*?\)\s*/g," ").trim(), has=s=>terms.every(t=>s.includes(t));
  if(n===q||nb===q) return 0; if(n.startsWith(q)||nb.startsWith(q)) return 1; if(has(n)) return 2;
  if(has((e.variants||"").toLowerCase())) return 3; if(has(core(e))) return 4;
  if(S.deep&&has(core(e)+" "+desc(e))) return 5; return -1; }
function filtered(){ const q=S.q.toLowerCase().trim().replace(/\s+/g," "), terms=q.split(" ").filter(Boolean);
  const base=D.entities.filter(e=>(!S.organ||e.organ===S.organ)&&S.cats.has(ci(e)));
  if(!terms.length) return base;
  return base.map((e,i)=>[rank(e,terms,q),i,e]).filter(x=>x[0]>=0).sort((x,y)=>x[0]-y[0]||x[1]-y[1]).map(x=>x[2]); }
function snippet(text,q){ const t=q.trim().split(/\s+/)[0]; if(!t||!text) return ""; const i=text.toLowerCase().indexOf(t.toLowerCase()); if(i<0) return "";
  const s=Math.max(0,i-70); return (s?"…":"")+text.slice(s,i+130)+"…"; }
function search(){ const doneOrgans=D.organs.filter(o=>o.status==="done");
  main.innerHTML=`<input id="q" type="search" placeholder="Search entity, variants, remarks…" value="${esc(S.q)}" autocomplete="off">
  <div class="filters"><select id="org"><option value="">All organs</option>${doneOrgans.map(o=>`<option ${o.name===S.organ?"selected":""}>${esc(o.name)}</option>`).join("")}</select></div>
  <label class="mut tog"><input type="checkbox" id="deep" ${S.deep?"checked":""}> Also search histology / cytology / IHC text</label>
  <div class="filters">${D.categories.map((c,i)=>`<span class="chip c${i} ${S.cats.has(i)?"":"off"}" data-c="${i}">${esc(short(c))}</span>`).join("")}</div><div id="res"></div>`;
  const q=$("#q"); q.oninput=()=>{S.q=q.value;results();}; $("#deep").onchange=e=>{S.deep=e.target.checked;results();}; $("#org").onchange=e=>{S.organ=e.target.value;results();};
  main.querySelectorAll(".chip").forEach(ch=>ch.onclick=()=>{const i=+ch.dataset.c; S.cats.has(i)?S.cats.delete(i):S.cats.add(i); ch.classList.toggle("off"); results();});
  results(); }
function results(){ const r=filtered(); $("#res").innerHTML=`<div class="mut">${r.length} result${r.length===1?"":"s"}</div>`+r.slice(0,300).map(entRow).join(""); bindEnts($("#res")); }
function bindEnts(el){ el.querySelectorAll(".ent").forEach(x=>x.onclick=()=>detail(x.dataset.id)); }
function detail(id){ const e=D.entities.find(x=>x.id===id);
  modal.innerHTML=`<div class="sheet"><div class="chip c${ci(e)}" style="display:inline-block">${esc(e.category)}</div><h2>${esc(e.entity)}</h2>
  <dl><dt>Organ</dt><dd>${esc(e.organ)}</dd>${e.subgroup?`<dt>Subgroup</dt><dd>${esc(e.subgroup)}</dd>`:""}
  ${e.variants?`<dt>Variants / subtypes</dt><dd>${esc(e.variants)}</dd>`:""}${e.remarks?`<dt>Remarks / key features</dt><dd>${esc(e.remarks)}</dd>`:""}</dl>
  ${(e.histo||e.cyto||e.ihc)?`<div class="tabs">${[["histo","Histopathology"],["cyto","Cytology"],["ihc","IHC"]].filter(x=>e[x[0]]).map((x,i)=>`<button class="tab ${i?"":"on"}" data-t="${x[0]}">${x[1]}</button>`).join("")}</div><div class="tabbody" id="tb"></div>`:""}
  <button class="btn" id="bm">${marks.has(id)?"★ Remove bookmark":"☆ Bookmark"}</button><button class="btn alt" id="cl">Close</button></div>`;
  modal.classList.remove("hidden"); $("#cl").onclick=close; modal.scrollTop=0;
  const tabs=modal.querySelectorAll(".tab"), show=k=>{tabs.forEach(b=>b.classList.toggle("on",b.dataset.t===k)); $("#tb").innerHTML=esc(e[k]).split(/\n+/).map(p=>`<p>${p}</p>`).join("");};
  tabs.forEach(b=>b.onclick=()=>show(b.dataset.t)); if(tabs.length) show(tabs[0].dataset.t);
  $("#bm").onclick=()=>{marks.has(id)?marks.delete(id):marks.add(id); store.set("pm_bookmarks",[...marks]); close(); render();}; }
function close(){ modal.classList.add("hidden"); }
modal.onclick=e=>{ if(e.target===modal) close(); };
function bookmarks(){ const r=D.entities.filter(e=>marks.has(e.id));
  main.innerHTML=`<h2>Bookmarks</h2>${r.length?r.map(entRow).join(""):'<p class="mut">No bookmarks yet. Open an entity and tap ☆ Bookmark.</p>'}`; bindEnts(main); }
const pick=a=>a[Math.floor(Math.random()*a.length)];
function modeBar(){ return `<div class="tabs">${[["cat","Category?"],["histo","Identify from histology"],["ihc","Identify from IHC"]].map(m=>`<button class="tab qm ${S.qmode===m[0]?"on":""}" data-m="${m[0]}">${m[1]}</button>`).join("")}</div>`; }
function bindModes(){ main.querySelectorAll(".qm").forEach(b=>b.onclick=()=>{S.qmode=b.dataset.m;quiz();}); }
function maskName(text,e){ let t=text; const words=e.entity.replace(/\(.*?\)/g," ").split(/[\/,;]+/).map(x=>x.trim()).filter(x=>x.length>3);
  for(const w of words) t=t.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"gi"),"[ this entity ]"); return t; }
function idQuiz(){ const k=S.qmode, pool=D.entities.filter(e=>(!S.organ||e.organ===S.organ)&&e[k]); const e=pick(pool);
  const same=pool.filter(x=>x!==e&&x.category===e.category), other=pool.filter(x=>x!==e);
  const opts=[e]; while(opts.length<4&&(same.length||other.length)){ const src=same.length?same:other; const x=src.splice(Math.floor(Math.random()*src.length),1)[0]; if(!opts.includes(x)) opts.push(x); }
  opts.sort(()=>Math.random()-.5);
  main.innerHTML=`<h2>Quiz</h2>${modeBar()}<div class="mut">Score ${score.right}/${score.total} · ${S.organ||"all organs"}</div>
  <div class="card" style="margin-top:8px"><div class="mut">${k==="histo"?"Histopathology":"Immunohistochemistry"} description — identify the entity:</div>
  <p class="desc">${esc(maskName(e[k],e))}</p><div class="opts">${opts.map(o=>`<button class="c${ci(o)}" data-id="${o.id}">${esc(o.entity)}</button>`).join("")}</div><div id="ans"></div></div>`;
  bindModes();
  main.querySelectorAll(".opts button").forEach(b=>b.onclick=()=>{ if($("#ans").innerHTML) return; const ok=b.dataset.id===e.id;
    score.total++; if(ok) score.right++; store.set("pm_quiz",score); b.classList.add(ok?"ok":"no"); main.querySelector(`.opts [data-id="${e.id}"]`).classList.add("ok");
    $("#ans").innerHTML=`<p><b>${ok?"✔ Correct":"✘ It was: "+esc(e.entity)}</b></p><p class="mut">${esc(e.category)}</p><button class="btn alt" id="dt">Open entity</button><button class="btn" id="nx">Next →</button>`;
    $("#nx").onclick=quiz; $("#dt").onclick=()=>detail(e.id); }); }
function quiz(){ if(S.qmode!=="cat") return idQuiz(); const pool=D.entities.filter(e=>!S.organ||e.organ===S.organ); const e=pool[Math.floor(Math.random()*pool.length)];
  main.innerHTML=`<h2>Quiz</h2>${modeBar()}<div class="mut">Score ${score.right}/${score.total} · ${S.organ||"all organs"} <a href="#" id="rs">reset</a></div>
  <div class="card" style="margin-top:8px"><div class="mut">${esc(e.organ)} — which category is:</div><h2>${esc(e.entity)}</h2>
  <div class="opts">${D.categories.map((c,i)=>`<button class="c${i}" data-i="${i}">${esc(c)}</button>`).join("")}</div><div id="ans"></div></div>`;
  bindModes(); $("#rs").onclick=ev=>{ev.preventDefault();score={right:0,total:0};store.set("pm_quiz",score);quiz();};
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
fetch("data.json").then(r=>r.json()).then(d=>{D=d; setView("home"); showVersion();}).catch(()=>main.innerHTML="<p>Could not load data.</p>");
async function showVersion(){ const el=$("#ver"); if(!el) return; let v="";
  try{ const k=(await caches.keys()).filter(x=>x.startsWith("pathmates-")); v=k.length?k[k.length-1].slice(10):""; }catch{}
  el.textContent="App version "+(v||"(not cached yet)")+(D?" · data "+D.generated.slice(0,10):""); }
if("serviceWorker" in navigator){
  const hadController=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange",()=>{
    if(!hadController){ showVersion(); return; }               // first install: no reload needed
    if(sessionStorage.getItem("pm_reloaded")) return;          // loop guard
    sessionStorage.setItem("pm_reloaded","1"); location.reload(); });
  navigator.serviceWorker.addEventListener("message",e=>{ if(e.data&&e.data.version) showVersion(); });
  addEventListener("load",()=>navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).then(r=>{
    window.__swReg=r; r.update().catch(()=>{});
    document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") r.update().catch(()=>{}); });
    navigator.serviceWorker.ready.then(()=>setTimeout(()=>{showVersion(); setTimeout(()=>sessionStorage.removeItem("pm_reloaded"),3000);},300));
  }).catch(console.error));
}
