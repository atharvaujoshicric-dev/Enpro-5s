/* ════════════════════════════════════════════════════════════
   5S PRO — ENPRO INDUSTRIES
   Full app logic: Auth, Zones, Records (FPP/WPP/WFP),
   Stage management, CEO approval per stage, Pings
════════════════════════════════════════════════════════════ */

// ── UTILS ──────────────────────────────────────────────────
function genId() { return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

function toast(msg, type="success") {
  const t = document.getElementById("toast");
  t.textContent = msg; t.className = type; t.style.display = "block";
  clearTimeout(t._t); t._t = setTimeout(()=>{ t.style.display="none"; }, 3200);
}

function openModal(id)  { document.getElementById(id)?.classList.add("open"); }
function closeModal(id) { document.getElementById(id)?.classList.remove("open"); }

function showLightbox(src) {
  document.getElementById("lb-img").src = src;
  document.getElementById("lightbox").classList.add("open");
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
}
function fmtDT(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
}

function deadlineInfo(createdAt, workType) {
  const days = workType==="WPP" ? 2 : 90;
  const due  = new Date(createdAt); due.setDate(due.getDate()+days);
  const diff = Math.ceil((due-new Date())/86400000);
  if (diff<0)  return { label:`Overdue ${-diff}d`, cls:"over" };
  if (diff<=5) return { label:`${diff}d left`, cls:"warn" };
  return { label:`${diff}d left`, cls:"ok" };
}

function roleBadge(role) {
  const m = { admin:"badge-admin", ceo:"badge-ceo", zone_manager:"badge-manager", user:"badge-user" };
  return `<span class="badge ${m[role]||'badge-user'}">${role.replace("_"," ")}</span>`;
}

function myPings() {
  const u = AppState.currentUser;
  return AppState.pings.filter(p =>
    u.role==="admin" ||
    (u.role==="ceo" && p.toRole==="ceo") ||
    (u.role==="zone_manager" && p.toRole==="zone_manager" && (!p.toZone||p.toZone===u.zone)) ||
    (u.role==="user" && p.toRole==="user" && (!p.toZone||p.toZone===u.zone))
  );
}
function unreadCount() { return myPings().filter(p=>!p.read).length; }

function pickImage(cb) {
  const i=document.createElement("input"); i.type="file"; i.accept="image/*";
  i.onchange=e=>{ const f=e.target.files[0]; if(!f)return; const r=new FileReader();
    r.onload=ev=>cb(ev.target.result); r.readAsDataURL(f); };
  i.click();
}

// ── ICONS ──────────────────────────────────────────────────
const IC = {
  dash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  zone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>`,
  rec:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>`,
  usr:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`,
  rpt:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`,
  cog:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
};

// ── NAV ────────────────────────────────────────────────────
function buildNav() {
  const u=AppState.currentUser, cnt=unreadCount();
  const items=[
    { id:"dashboard", lbl:"Dashboard",     icon:IC.dash, roles:["admin","ceo","zone_manager","user"] },
    { id:"zones",     lbl:"Zones",         icon:IC.zone, roles:["admin","ceo","zone_manager","user"] },
    { id:"records",   lbl:"Work Records",  icon:IC.rec,  roles:["admin","ceo","zone_manager","user"] },
    { id:"users",     lbl:"Users",         icon:IC.usr,  roles:["admin"] },
    { id:"settings",  lbl:"Settings",      icon:IC.cog,  roles:["admin"] },
    { id:"reports",   lbl:"Reports",       icon:IC.rpt,  roles:["admin","ceo"] },
    { id:"pings",     lbl:`Pings${cnt>0?` <span class="ping-dot"></span>`:""}`, icon:IC.bell, roles:["admin","ceo","zone_manager","user"] },
  ];
  document.getElementById("sidebar-nav").innerHTML = items
    .filter(i=>i.roles.includes(u.role))
    .map(i=>`<div class="nav-item" data-page="${i.id}" onclick="showPage('${i.id}')">${i.icon}<span>${i.lbl}</span></div>`)
    .join("");
}

function showPage(id) {
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
  document.getElementById("page-"+id)?.classList.add("active");
  document.querySelector(`.nav-item[data-page="${id}"]`)?.classList.add("active");
  ({ dashboard:renderDashboard, zones:renderZones, records:renderRecords,
     users:renderUsers, settings:renderSettings, reports:renderReports, pings:renderPings })[id]?.();
}

// ── AUTH ───────────────────────────────────────────────────
document.getElementById("login-btn").addEventListener("click", doLogin);
document.getElementById("login-pass").addEventListener("keydown", e=>{ if(e.key==="Enter") doLogin(); });

function doLogin() {
  const email=document.getElementById("login-email").value.trim();
  const pass =document.getElementById("login-pass").value;
  const user =AppState.login(email, pass);
  if (user) initApp(); else document.getElementById("login-error").textContent="Invalid email or password.";
}

function initApp() {
  document.getElementById("auth-screen").style.display="none";
  document.getElementById("app-screen").style.display="block";
  const u=AppState.currentUser;
  document.getElementById("sidebar-uname").textContent=u.name;
  document.getElementById("sidebar-role").textContent=u.role.replace("_"," ");
  buildNav(); showPage("dashboard");
}

document.getElementById("logout-btn").addEventListener("click", ()=>{
  AppState.logout();
  document.getElementById("app-screen").style.display="none";
  document.getElementById("auth-screen").style.display="flex";
  ["login-email","login-pass"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("login-error").textContent="";
});

document.getElementById("lightbox").addEventListener("click", ()=>
  document.getElementById("lightbox").classList.remove("open"));

// ── DASHBOARD ──────────────────────────────────────────────
function renderDashboard() {
  const recs=getVisibleRecords(), zones=getVisibleZones();
  const total=recs.length;
  const approved=recs.filter(r=>r.status==="approved").length;
  const awaiting=recs.filter(r=>r.status==="awaiting_ceo").length;
  const overdue =recs.filter(r=>r.status!=="approved"&&deadlineInfo(r.createdAt,r.workType).cls==="over").length;
  document.getElementById("dash-content").innerHTML=`
    <div class="page-header"><div><div class="page-title">Dashboard</div><div class="page-sub">5S Zone Overview</div></div></div>
    <div class="stats-grid">
      <div class="stat-card"><div class="val">${zones.length}</div><div class="lbl">Zones</div></div>
      <div class="stat-card accent"><div class="val" style="color:var(--accent)">${total}</div><div class="lbl">Total Records</div></div>
      <div class="stat-card"><div class="val" style="color:var(--green)">${approved}</div><div class="lbl">Fully Approved</div></div>
      ${awaiting?`<div class="stat-card"><div class="val" style="color:var(--blue)">${awaiting}</div><div class="lbl">Awaiting CEO</div></div>`:""}
      ${overdue?`<div class="stat-card"><div class="val" style="color:var(--red)">${overdue}</div><div class="lbl">Overdue</div></div>`:""}
    </div>
    <div class="card"><div class="card-title">Recent Records</div>${summaryTable(recs.slice(-8).reverse())}</div>`;
}

// ── ZONES ──────────────────────────────────────────────────
function getVisibleZones() {
  const u=AppState.currentUser;
  if (u.role==="admin"||u.role==="ceo") return AppState.zones;
  return AppState.zones.filter(z=>z.name===u.zone);
}

function renderZones() {
  const u=AppState.currentUser, zones=getVisibleZones(), canManage=u.role==="admin";
  document.getElementById("zones-content").innerHTML=`
    <div class="page-header">
      <div><div class="page-title">Zones</div><div class="page-sub">${zones.length} zones</div></div>
      ${canManage?`<button class="btn btn-primary btn-sm" onclick="openZoneModal()">+ Add Zone</button>`:""}
    </div>
    <div class="zones-grid">${zones.map(z=>{
      const recs=AppState.records.filter(r=>r.zoneId===z.id);
      const done=recs.filter(r=>r.status==="approved").length;
      return `<div class="zone-card">
        <div class="zone-name">${z.name}</div>
        <div class="zone-desc">${z.description||""}</div>
        <div style="font-size:0.8rem;color:var(--muted);margin-bottom:12px">${done}/${recs.length} approved</div>
        <div class="zone-actions">
          <button class="btn btn-outline btn-sm" onclick="AppState._filterZone='${z.id}';showPage('records')">View Records</button>
          ${canManage?`<button class="btn btn-outline btn-sm" onclick="openZoneModal('${z.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteZone('${z.id}')">Delete</button>`:""}
        </div>
      </div>`;
    }).join("")}</div>`;
}

window.openZoneModal=function(id) {
  const z=id?AppState.zones.find(z=>z.id===id):null;
  document.getElementById("zone-modal-id").value=id||"";
  document.getElementById("zone-modal-name").value=z?.name||"";
  document.getElementById("zone-modal-desc").value=z?.description||"";
  document.getElementById("modal-zone-title").textContent=id?"Edit Zone":"Add Zone";
  openModal("modal-add-zone");
};
document.getElementById("save-zone-btn").addEventListener("click",()=>{
  const id=document.getElementById("zone-modal-id").value;
  const name=document.getElementById("zone-modal-name").value.trim();
  const desc=document.getElementById("zone-modal-desc").value.trim();
  if(!name) return toast("Name required","error");
  const zones=AppState.zones;
  if(id){ const z=zones.find(z=>z.id===id); z.name=name; z.description=desc; }
  else zones.push({id:genId(),name,description:desc});
  AppState.zones=zones; closeModal("modal-add-zone"); renderZones(); toast("Zone saved");
});
window.deleteZone=function(id){
  if(!confirm("Delete zone and all records?")) return;
  AppState.zones=AppState.zones.filter(z=>z.id!==id);
  AppState.records=AppState.records.filter(r=>r.zoneId!==id);
  renderZones(); toast("Zone deleted");
};

// ── RECORDS ────────────────────────────────────────────────
function getVisibleRecords() {
  const u=AppState.currentUser;
  if(u.role==="admin"||u.role==="ceo") return AppState.records;
  return AppState.records.filter(r=>{
    const z=AppState.zones.find(z=>z.id===r.zoneId);
    return z&&z.name===u.zone;
  });
}

function recStatus(r) {
  if (r.status==="approved") return ["badge-complete","Approved"];
  if (r.status==="awaiting_ceo") return ["badge-ceo","Awaiting CEO"];
  if (r.status==="rework") return ["badge-overdue","Rework Required"];
  if (r.workType==="FPP") {
    const stages=r.stages||[];
    const done=stages.filter(s=>s.photos&&s.photos.length>0).length;
    const total=AppState.fppStages.length;
    if(done===0&&!r.beforePhoto) return ["badge-pending","No Photos Yet"];
    if(done<total) return ["badge-pending",`Stages ${done}/${total}`];
    return ["badge-pending","Ready to Submit"];
  }
  if (r.beforePhoto&&!r.afterPhoto) return ["badge-pending","After Pending"];
  if (!r.beforePhoto) return ["badge-pending","No Before Photo"];
  return ["badge-complete","Complete"];
}

function renderRecords() {
  const u=AppState.currentUser;
  const zones=getVisibleZones();
  let recs=getVisibleRecords();
  if(AppState._filterZone)   recs=recs.filter(r=>r.zoneId===AppState._filterZone);
  if(AppState._statusFilter) recs=filterByStatus(recs,AppState._statusFilter);

  const selZone=AppState._filterZone?AppState.zones.find(z=>z.id===AppState._filterZone):null;
  const canCreate=["admin","ceo","user"].includes(u.role);

  document.getElementById("records-content").innerHTML=`
    <div class="page-header">
      <div><div class="page-title">Work Records${selZone?` — ${selZone.name}`:""}</div>
      <div class="page-sub">${recs.length} records</div></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        ${AppState._filterZone?`<button class="btn btn-outline btn-sm" onclick="AppState._filterZone=null;renderRecords()">✕ Clear</button>`:""}
        ${canCreate?`<button class="btn btn-primary btn-sm" onclick="openAddRecord()">+ New Record</button>`:""}
      </div>
    </div>
    <div class="card">
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
        <select onchange="AppState._filterZone=this.value||null;renderRecords()" style="max-width:180px">
          <option value="">All Zones</option>
          ${zones.map(z=>`<option value="${z.id}"${z.id===AppState._filterZone?" selected":""}>${z.name}</option>`).join("")}
        </select>
        <select onchange="AppState._statusFilter=this.value||null;renderRecords()" style="max-width:180px">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="awaiting">Awaiting CEO</option>
          <option value="approved">Approved</option>
          <option value="rework">Rework</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>
      <div id="rec-list">
        ${recs.length===0
          ?`<p style="color:var(--muted);text-align:center;padding:40px">No records found.</p>`
          :recs.slice().reverse().map(r=>buildRecordCard(r)).join("")}
      </div>
    </div>`;
}

function filterByStatus(recs,f){
  if(f==="pending")  return recs.filter(r=>r.status==="pending"||r.status==="rework");
  if(f==="awaiting") return recs.filter(r=>r.status==="awaiting_ceo");
  if(f==="approved") return recs.filter(r=>r.status==="approved");
  if(f==="rework")   return recs.filter(r=>r.status==="rework");
  if(f==="overdue")  return recs.filter(r=>r.status!=="approved"&&deadlineInfo(r.createdAt,r.workType).cls==="over");
  return recs;
}

// ── RECORD CARD ────────────────────────────────────────────
function buildRecordCard(r) {
  const u=AppState.currentUser;
  const zone=AppState.zones.find(z=>z.id===r.zoneId);
  const dl=deadlineInfo(r.createdAt,r.workType);
  const [stCls,stLbl]=recStatus(r);
  const isAdmin=u.role==="admin";
  const isFPP=r.workType==="FPP";

  const canUploadBefore=(isAdmin||u.role==="user")&&!r.beforePhoto;
  const canDelete=isAdmin;
  const showAdminBtn=isAdmin;

  // Rejection history
  const rejHtml=(r.rejections||[]).map(rj=>`
    <div class="rejection-note">
      <span style="color:var(--red);font-weight:600">❌ CEO Rejected — Stage "${rj.stageName||'Record'}"</span>
      <span style="color:var(--muted);margin-left:8px;font-size:0.75rem">${fmtDT(rj.at)}</span>
      <div style="margin-top:4px">${rj.comment}</div>
    </div>`).join("");

  // FPP stages section
  let photosHtml="";
  if(isFPP) {
    photosHtml=buildFPPStagesHtml(r);
  } else {
    // WPP / WFP — single before+after
    const canUploadAfter=(isAdmin||u.role==="zone_manager")&&r.beforePhoto&&
                          (r.status==="pending"||r.status==="rework");
    photosHtml=`<div class="record-photos">
      <div>
        <div class="photo-label">BEFORE</div>
        ${r.beforePhoto
          ?`<img src="${r.beforePhoto}" class="thumb" onclick="showLightbox('${r.beforePhoto}')" alt="Before">`
          :`<div class="photo-placeholder">${canUploadBefore
              ?`<button class="btn btn-sm btn-outline" onclick="doUploadBefore('${r.id}')">Upload Before</button>`
              :"No photo"}</div>`}
      </div>
      <div>
        <div class="photo-label">AFTER</div>
        ${r.afterPhoto
          ?`<img src="${r.afterPhoto}" class="thumb" onclick="showLightbox('${r.afterPhoto}')" alt="After">`
          :`<div class="photo-placeholder">${canUploadAfter
              ?`<button class="btn btn-sm btn-success" onclick="doUploadAfter('${r.id}')">Upload After</button>`
              :"Awaiting"}</div>`}
      </div>
    </div>`;
  }

  // Submit all stages button (FPP, manager, all stages done, not yet submitted)
  const stages=r.stages||[];
  const fppStages=AppState.fppStages;
  const allStagesDone=isFPP&&stages.length===fppStages.length&&stages.every(s=>s.photos&&s.photos.length>0);
  const canSubmitFPP=(isAdmin||u.role==="zone_manager")&&isFPP&&r.beforePhoto&&allStagesDone&&r.status==="pending";
  const canSubmitRework=(isAdmin||u.role==="zone_manager")&&isFPP&&r.status==="rework"&&
    (r.rejections||[]).every(rj=>{
      const s=stages.find(s=>s.stageId===rj.stageId);
      return s&&s.photos&&s.photos.length>(rj.photoIdx??0);
    });

  return `<div class="record-card" id="rec-${r.id}">
    <div class="record-header">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span class="rec-title">${r.title}</span>
        <span class="badge badge-ceo">${r.workType}</span>
        <span class="badge ${stCls}">${stLbl}</span>
        ${r.status!=="approved"?`<span class="deadline ${dl.cls}">${dl.label}</span>`:""}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${canSubmitFPP?`<button class="btn btn-sm btn-blue" onclick="submitFPPForApproval('${r.id}')">Submit for CEO Approval</button>`:""}
        ${canSubmitRework?`<button class="btn btn-sm btn-blue" onclick="submitFPPForApproval('${r.id}')">Re-submit for CEO</button>`:""}
        ${canDelete?`<button class="btn btn-sm btn-danger" onclick="deleteRecord('${r.id}')">Delete</button>`:""}
        ${showAdminBtn?`<button class="btn btn-sm btn-outline" onclick="openAdminOverride('${r.id}')" title="Admin Override">⚙</button>`:""}
      </div>
    </div>
    <div style="font-size:0.78rem;color:var(--muted);margin-top:2px">
      Zone: ${zone?.name||"—"} &nbsp;|&nbsp; Created: ${fmtDate(r.createdAt)}
      ${r.notes?` &nbsp;|&nbsp; ${r.notes}`:""}
    </div>
    ${rejHtml}
    ${photosHtml}
    ${isFPP&&r.status==="awaiting_ceo"?buildCEOApprovalHtml(r):""}
  </div>`;
}

// ── FPP STAGES HTML ────────────────────────────────────────
function buildFPPStagesHtml(r) {
  const u=AppState.currentUser;
  const isAdmin=u.role==="admin";
  const fppStages=AppState.fppStages;
  const canUploadBefore=(isAdmin||u.role==="user")&&!r.beforePhoto;

  let html=`<div style="margin-top:12px">`;

  // Before photo
  html+=`<div class="stage-row">
    <div class="stage-label">📷 Before Photo</div>
    <div class="record-photos">
      <div>
        ${r.beforePhoto
          ?`<img src="${r.beforePhoto}" class="thumb" onclick="showLightbox('${r.beforePhoto}')">`
          :`<div class="photo-placeholder">${canUploadBefore
              ?`<button class="btn btn-sm btn-outline" onclick="doUploadBefore('${r.id}')">Upload Before</button>`
              :"No photo yet"}</div>`}
      </div>
    </div>
  </div>`;

  if (!r.beforePhoto) { html+=`</div>`; return html; }

  // Stages
  const stagesData=r.stages||[];
  fppStages.forEach((stg, idx)=>{
    const prevDone=idx===0||((stagesData[idx-1]?.photos||[]).length>0);
    const stgData=stagesData.find(s=>s.stageId===stg.id)||{ stageId:stg.id, photos:[] };
    const photos=stgData.photos||[];
    const isLocked=!prevDone&&r.status!=="approved";
    const isRejected=(r.rejections||[]).some(rj=>rj.stageId===stg.id);

    // Can manager upload to this stage?
    const canUpload=(isAdmin||u.role==="zone_manager")
      && !isLocked
      && (r.status==="pending"||r.status==="rework")
      && (photos.length===0 || (r.workType==="FPP"&&(r.status==="approved"||photos.length>0)));
    // For FPP: first upload unlocks next; additional uploads always allowed
    const canAddMore=(isAdmin||u.role==="zone_manager")&&photos.length>0&&r.status!=="awaiting_ceo";

    const stgStatus=photos.length===0?"empty":isRejected?"rejected":"done";
    const stgBorder=stgStatus==="rejected"?"border-left:3px solid var(--red)":
                    stgStatus==="done"?"border-left:3px solid var(--green)":
                    isLocked?"":"border-left:3px solid var(--border)";

    html+=`<div class="stage-row" style="${stgBorder}">
      <div class="stage-label">
        <span style="color:${stgStatus==='done'?'var(--green)':stgStatus==='rejected'?'var(--red)':'var(--muted)'}">
          ${stgStatus==="done"?"✓":stgStatus==="rejected"?"✗":"○"}
        </span>
        Stage ${idx+1}: <strong>${stg.name}</strong>
        ${isLocked?`<span style="color:var(--muted);font-size:0.75rem"> 🔒 Complete Stage ${idx} first</span>`:""}
        ${isRejected?`<span class="badge badge-overdue" style="margin-left:6px">Rejected</span>`:""}
      </div>
      <div class="record-photos">
        ${photos.map((p,pi)=>`<div>
          <div class="photo-label">Photo ${pi+1}</div>
          <img src="${p.dataUrl}" class="thumb" onclick="showLightbox('${p.dataUrl}')">
          <div style="font-size:0.68rem;color:var(--muted)">${fmtDate(p.uploadedAt)}</div>
        </div>`).join("")}
        ${!isLocked&&(photos.length===0||canAddMore)?`<div>
          <div class="photo-label">${photos.length===0?"AFTER":"+ Add"}</div>
          <div class="photo-placeholder">
            <button class="btn btn-sm ${photos.length===0?'btn-success':'btn-outline'}"
              onclick="doUploadStage('${r.id}','${stg.id}')">
              ${photos.length===0?"Upload":"Add Photo"}
            </button>
          </div>
        </div>`:""}
      </div>
    </div>`;
  });

  html+=`</div>`;
  return html;
}

// ── CEO APPROVAL PANEL (per stage) ────────────────────────
function buildCEOApprovalHtml(r) {
  const u=AppState.currentUser;
  if(u.role!=="ceo"&&u.role!=="admin") return "";
  const fppStages=AppState.fppStages;
  const stagesData=r.stages||[];

  let html=`<div class="ceo-panel">
    <div style="font-family:var(--font-head);font-size:1rem;font-weight:700;margin-bottom:12px;color:var(--accent)">
      CEO Review — Approve or Reject Each Stage
    </div>`;

  fppStages.forEach(stg=>{
    const stgData=stagesData.find(s=>s.stageId===stg.id);
    const photos=stgData?.photos||[];
    if(!photos.length) return;
    const alreadyApproved=(r.approvedStages||[]).includes(stg.id);
    const alreadyRejected=(r.rejections||[]).some(rj=>rj.stageId===stg.id&&rj.active);

    html+=`<div class="ceo-stage-row">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
        <strong>${stg.name}</strong>
        ${alreadyApproved?`<span class="badge badge-complete">Approved</span>`:""}
        ${alreadyRejected?`<span class="badge badge-overdue">Rejected</span>`:""}
      </div>
      <div class="record-photos" style="margin-bottom:8px">
        ${photos.map((p,pi)=>`<img src="${p.dataUrl}" class="thumb" onclick="showLightbox('${p.dataUrl}')" title="Photo ${pi+1}">`).join("")}
      </div>
      ${!alreadyApproved&&!alreadyRejected?`
      <div style="display:flex;gap:8px">
        <button class="btn btn-sm btn-success" onclick="approveStage('${r.id}','${stg.id}')">✓ Approve Stage</button>
        <button class="btn btn-sm btn-danger"  onclick="openStageReject('${r.id}','${stg.id}','${stg.name}')">✗ Reject Stage</button>
      </div>`:""}
    </div>`;
  });

  // Check if all stages approved → show final approve button
  const allApproved=fppStages.every(s=>(r.approvedStages||[]).includes(s.id)||
    !(stagesData.find(sd=>sd.stageId===s.id)?.photos?.length));
  const anyRejected=(r.rejections||[]).some(rj=>rj.active);

  if(!anyRejected) {
    html+=`<div style="margin-top:12px">
      <button class="btn btn-success" onclick="approveFPPFully('${r.id}')">✓ Approve Entire Record</button>
    </div>`;
  }

  html+=`</div>`;
  return html;
}

// ── RECORD ACTIONS ─────────────────────────────────────────
window.doUploadBefore=function(recId) {
  pickImage(dataUrl=>{
    const r=AppState.updateRecord(recId,{ beforePhoto:dataUrl });
    if(!r) return;
    const zone=AppState.zones.find(z=>z.id===r.zoneId);
    AppState.addPing({ to:"CEO", toRole:"ceo", toZone:null,
      message:`User uploaded BEFORE photo for "${r.title}" in ${zone?.name||"—"}. Record is ready for stage work.`,
      type:"before_uploaded", recordId:recId });
    buildNav(); renderRecords(); toast("Before photo uploaded — CEO notified");
  });
};

window.doUploadAfter=function(recId) {
  pickImage(dataUrl=>{
    const r=AppState.records.find(r=>r.id===recId); if(!r) return;
    const recs=AppState.records;
    const rec=recs.find(r=>r.id===recId);
    rec.afterPhoto=dataUrl; rec.status="awaiting_ceo";
    AppState.records=recs;
    const zone=AppState.zones.find(z=>z.id===rec.zoneId);
    AppState.addPing({ to:"CEO", toRole:"ceo", toZone:null,
      message:`Zone Manager uploaded AFTER photo for "${rec.title}" in ${zone?.name||"—"}. Awaiting your approval.`,
      type:"after_uploaded", recordId:recId });
    buildNav(); renderRecords(); toast("After photo uploaded — CEO notified");
  });
};

window.doUploadStage=function(recId, stageId) {
  pickImage(dataUrl=>{
    const recs=AppState.records;
    const r=recs.find(r=>r.id===recId); if(!r) return;
    if(!r.stages) r.stages=[];
    let stg=r.stages.find(s=>s.stageId===stageId);
    if(!stg){ stg={ stageId, photos:[] }; r.stages.push(stg); }
    stg.photos.push({ dataUrl, uploadedAt:new Date().toISOString() });
    // clear rejection flag for this stage if rework
    if(r.rejections) r.rejections=r.rejections.map(rj=>rj.stageId===stageId?{...rj,active:false}:rj);
    AppState.records=recs;
    buildNav(); renderRecords(); toast("Stage photo uploaded");
  });
};

window.submitFPPForApproval=function(recId) {
  const recs=AppState.records;
  const r=recs.find(r=>r.id===recId); if(!r) return;
  r.status="awaiting_ceo";
  r.approvedStages=[];
  AppState.records=recs;
  const zone=AppState.zones.find(z=>z.id===r.zoneId);
  AppState.addPing({ to:"CEO", toRole:"ceo", toZone:null,
    message:`Zone Manager has completed all ${AppState.fppStages.length} FPP stages for "${r.title}" in ${zone?.name||"—"}. Please review and approve each stage.`,
    type:"fpp_submitted", recordId:recId });
  buildNav(); renderRecords(); toast("Submitted to CEO for approval");
};

window.approveStage=function(recId, stageId) {
  const recs=AppState.records;
  const r=recs.find(r=>r.id===recId); if(!r) return;
  if(!r.approvedStages) r.approvedStages=[];
  if(!r.approvedStages.includes(stageId)) r.approvedStages.push(stageId);
  AppState.records=recs;
  renderRecords(); toast("Stage approved");
};

window.approveFPPFully=function(recId) {
  const recs=AppState.records;
  const r=recs.find(r=>r.id===recId); if(!r) return;
  r.status="approved";
  AppState.records=recs;
  const zone=AppState.zones.find(z=>z.id===r.zoneId);
  AppState.addPing({ to:"Zone Manager", toRole:"zone_manager", toZone:zone?.name||null,
    message:`✅ CEO fully approved "${r.title}" in ${zone?.name||"—"}. All stages cleared.`,
    type:"approved", recordId:recId });
  buildNav(); renderRecords(); toast("Record fully approved");
};

// Stage reject
let _rejectCtx=null;
window.openStageReject=function(recId, stageId, stageName) {
  _rejectCtx={ recId, stageId, stageName };
  document.getElementById("reject-stage-label").textContent=`Rejecting: ${stageName}`;
  document.getElementById("reject-comment").value="";
  openModal("modal-reject");
};
window.openRecordReject=function(recId) {
  _rejectCtx={ recId, stageId:null, stageName:"Entire Record" };
  document.getElementById("reject-stage-label").textContent="Rejecting entire record";
  document.getElementById("reject-comment").value="";
  openModal("modal-reject");
};
document.getElementById("confirm-reject-btn").addEventListener("click",()=>{
  const comment=document.getElementById("reject-comment").value.trim();
  if(!comment) return toast("Add rejection comment","error");
  const { recId, stageId, stageName }=_rejectCtx;
  const recs=AppState.records;
  const r=recs.find(r=>r.id===recId); if(!r) return;
  if(!r.rejections) r.rejections=[];
  r.rejections.push({ stageId, stageName, comment, at:new Date().toISOString(), active:true });
  r.status="rework";
  // Remove this stage from approvedStages if was approved
  if(stageId&&r.approvedStages) r.approvedStages=r.approvedStages.filter(s=>s!==stageId);
  AppState.records=recs;
  const zone=AppState.zones.find(z=>z.id===r.zoneId);
  AppState.addPing({ to:"Zone Manager", toRole:"zone_manager", toZone:zone?.name||null,
    message:`❌ CEO rejected "${stageName}" in "${r.title}" (${zone?.name||"—"}). Comment: ${comment}. Please re-upload the stage photo.`,
    type:"rejected", recordId:recId });
  closeModal("modal-reject");
  buildNav(); renderRecords(); toast("Rejection sent to manager");
});

window.deleteRecord=function(id){
  if(!confirm("Delete record?")) return;
  AppState.records=AppState.records.filter(r=>r.id!==id);
  renderRecords(); toast("Record deleted");
};

// Add record
window.openAddRecord=function(){
  const zones=getVisibleZones();
  document.getElementById("rec-zone-sel").innerHTML=zones.map(z=>`<option value="${z.id}">${z.name}</option>`).join("");
  document.getElementById("rec-title").value="";
  document.getElementById("rec-notes").value="";
  openModal("modal-add-record");
};
document.getElementById("save-record-btn").addEventListener("click",()=>{
  const title=document.getElementById("rec-title").value.trim();
  const zoneId=document.getElementById("rec-zone-sel").value;
  const wt=document.getElementById("rec-worktype").value;
  const notes=document.getElementById("rec-notes").value.trim();
  if(!title||!zoneId) return toast("Title and zone required","error");
  const recs=AppState.records;
  recs.push({ id:genId(), title, zoneId, workType:wt, notes,
    createdAt:new Date().toISOString(), status:"pending",
    beforePhoto:null, afterPhoto:null, stages:[], rejections:[], approvedStages:[] });
  AppState.records=recs;
  closeModal("modal-add-record"); renderRecords(); toast("Record created");
});

// Admin override
window.openAdminOverride=function(id){
  const r=AppState.records.find(r=>r.id===id); if(!r) return;
  document.getElementById("admin-rec-id").value=id;
  document.getElementById("admin-status-sel").value=r.status;
  openModal("modal-admin-panel");
};
document.getElementById("save-admin-panel-btn").addEventListener("click",()=>{
  const id=document.getElementById("admin-rec-id").value;
  const status=document.getElementById("admin-status-sel").value;
  AppState.updateRecord(id,{ status });
  closeModal("modal-admin-panel"); renderRecords(); toast("Status overridden (Admin)");
});

// Summary table
function summaryTable(recs) {
  if(!recs.length) return `<p style="color:var(--muted);text-align:center;padding:24px">No records yet.</p>`;
  return `<div class="table-wrap"><table class="data-table">
    <thead><tr><th>Title</th><th>Zone</th><th>Type</th><th>Status</th><th>Deadline</th></tr></thead>
    <tbody>${recs.map(r=>{
      const zone=AppState.zones.find(z=>z.id===r.zoneId);
      const dl=deadlineInfo(r.createdAt,r.workType);
      const [sc,sl]=recStatus(r);
      return `<tr><td>${r.title}</td><td>${zone?.name||"—"}</td>
        <td><span class="badge badge-ceo">${r.workType}</span></td>
        <td><span class="badge ${sc}">${sl}</span></td>
        <td class="deadline ${r.status==="approved"?"":dl.cls}">${r.status==="approved"?"—":dl.label}</td>
      </tr>`;
    }).join("")}</tbody>
  </table></div>`;
}

// ── USERS ──────────────────────────────────────────────────
function renderUsers() {
  const users=AppState.users;
  document.getElementById("users-content").innerHTML=`
    <div class="page-header">
      <div><div class="page-title">User Management</div><div class="page-sub">${users.length} users</div></div>
      <button class="btn btn-primary btn-sm" onclick="openUserModal()">+ Add User</button>
    </div>
    <div class="card"><div class="table-wrap"><table class="data-table">
      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Zone</th><th>Actions</th></tr></thead>
      <tbody>${users.map(u=>`<tr>
        <td>${u.name}</td><td>${u.email}</td>
        <td>${roleBadge(u.role)}</td><td>${u.zone||"—"}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="openUserModal('${u.email}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="delUser('${u.email}')" style="margin-left:6px">Delete</button>
        </td>
      </tr>`).join("")}</tbody>
    </table></div></div>`;
}
window.openUserModal=function(email){
  const u=email?AppState.users.find(u=>u.email===email):null;
  document.getElementById("user-edit-email").value=email||"";
  document.getElementById("user-name").value=u?.name||"";
  document.getElementById("user-email").value=u?.email||"";
  document.getElementById("user-password").value="";
  document.getElementById("user-role").value=u?.role||"user";
  const zones=AppState.zones;
  document.getElementById("user-zone-sel").innerHTML=
    `<option value="">No specific zone</option>`+
    zones.map(z=>`<option value="${z.name}"${z.name===u?.zone?" selected":""}>${z.name}</option>`).join("");
  document.getElementById("modal-user-title").textContent=email?"Edit User":"Add User";
  openModal("modal-add-user");
};
document.getElementById("save-user-btn").addEventListener("click",()=>{
  const editEmail=document.getElementById("user-edit-email").value;
  const name=document.getElementById("user-name").value.trim();
  const email=document.getElementById("user-email").value.trim().toLowerCase();
  const password=document.getElementById("user-password").value;
  const role=document.getElementById("user-role").value;
  const zone=document.getElementById("user-zone-sel").value||null;
  if(!name||!email) return toast("Name and email required","error");
  const users=AppState.users;
  if(editEmail){
    const idx=users.findIndex(u=>u.email===editEmail);
    if(idx>=0) users[idx]={ ...users[idx], name, email, role, zone, ...(password?{password}:{}) };
  } else {
    if(!password) return toast("Password required","error");
    if(users.find(u=>u.email===email)) return toast("Email exists","error");
    users.push({ name, email, password, role, zone });
  }
  AppState.users=users; closeModal("modal-add-user"); renderUsers(); toast("User saved");
});
window.delUser=function(email){
  if(!confirm("Delete user?")) return;
  AppState.users=AppState.users.filter(u=>u.email!==email);
  renderUsers(); toast("User deleted");
};

// ── SETTINGS (FPP Stage Config) ────────────────────────────
function renderSettings() {
  const stages=AppState.fppStages;
  document.getElementById("settings-content").innerHTML=`
    <div class="page-header">
      <div><div class="page-title">Settings</div><div class="page-sub">Configure FPP Stage Names</div></div>
      <button class="btn btn-primary btn-sm" onclick="addFPPStage()">+ Add Stage</button>
    </div>
    <div class="card">
      <div class="card-title">FPP Stages (apply to all zones)</div>
      <p style="font-size:0.82rem;color:var(--muted);margin-bottom:16px">Minimum 6 stages required. Drag to reorder (save after changes).</p>
      <div id="stages-list">
        ${stages.map((s,i)=>`<div class="stage-config-row" data-id="${s.id}">
          <span style="color:var(--muted);width:24px">${i+1}</span>
          <input type="text" value="${s.name}" id="stg-name-${s.id}" style="flex:1;background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:8px 10px;color:var(--text);font-family:var(--font-body)">
          <button class="btn btn-danger btn-sm" onclick="deleteFPPStage('${s.id}')" ${stages.length<=6?"disabled":""}>Remove</button>
        </div>`).join("")}
      </div>
      <div style="margin-top:16px">
        <button class="btn btn-primary btn-sm" onclick="saveFPPStages()">Save Stage Names</button>
      </div>
    </div>`;
}
window.addFPPStage=function(){
  const stages=AppState.fppStages;
  stages.push({ id:genId(), name:`Stage ${stages.length+1}` });
  AppState.fppStages=stages; renderSettings(); toast("Stage added");
};
window.deleteFPPStage=function(id){
  const stages=AppState.fppStages;
  if(stages.length<=6) return toast("Minimum 6 stages required","error");
  AppState.fppStages=stages.filter(s=>s.id!==id); renderSettings(); toast("Stage removed");
};
window.saveFPPStages=function(){
  const stages=AppState.fppStages.map(s=>{
    const inp=document.getElementById("stg-name-"+s.id);
    return { ...s, name:inp?inp.value.trim()||s.name:s.name };
  });
  AppState.fppStages=stages; toast("Stage names saved");
};

// ── REPORTS ────────────────────────────────────────────────
function renderReports() {
  const zones=AppState.zones;
  document.getElementById("reports-content").innerHTML=`
    <div class="page-header">
      <div><div class="page-title">Reports</div></div>
      <button class="btn btn-primary btn-sm" onclick="window.print()">Export / Print</button>
    </div>
    ${zones.map(z=>{
      const recs=AppState.records.filter(r=>r.zoneId===z.id);
      const done=recs.filter(r=>r.status==="approved").length;
      const pct=recs.length?Math.round(done/recs.length*100):0;
      return `<div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div class="card-title" style="margin-bottom:0">${z.name}</div>
          <span class="badge ${pct===100?"badge-complete":pct>50?"badge-manager":"badge-pending"}">${pct}% approved</span>
        </div>
        <div style="background:var(--bg);border-radius:4px;height:6px;margin-bottom:16px">
          <div style="height:6px;border-radius:4px;width:${pct}%;background:${pct===100?"var(--green)":"var(--accent)"}"></div>
        </div>
        ${summaryTable(recs)}
      </div>`;
    }).join("")}`;
}

// ── PINGS ──────────────────────────────────────────────────
function renderPings() {
  const u=AppState.currentUser;
  const mine=myPings().slice().reverse();
  const canSend=u.role==="ceo"||u.role==="admin";
  document.getElementById("pings-content").innerHTML=`
    <div class="page-header">
      <div><div class="page-title">Pings & Notifications</div><div class="page-sub">${mine.filter(p=>!p.read).length} unread</div></div>
      ${canSend?`<button class="btn btn-primary btn-sm" onclick="openModal('modal-add-ping')">+ Send Ping</button>`:""}
    </div>
    <div class="card">
      ${mine.length===0?`<p style="color:var(--muted);text-align:center;padding:40px">No notifications.</p>`
      :mine.map(p=>`<div class="record-card" style="margin-bottom:10px;${!p.read?"border-left:3px solid var(--accent)":""}">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
          <div>
            <span style="font-weight:600;font-size:0.85rem">${p.to}</span>
            <span style="font-size:0.72rem;color:var(--muted);margin-left:8px">${fmtDT(p.createdAt)}</span>
            ${!p.read?`<span class="ping-dot" style="margin-left:4px"></span>`:""}
          </div>
          ${!p.read?`<button class="btn btn-outline btn-sm" onclick="markRead('${p.id}')">Mark Read</button>`:""}
        </div>
        <div style="margin-top:6px;font-size:0.88rem;line-height:1.5">${p.message}</div>
        ${p.recordId?`<button class="btn btn-outline btn-sm" style="margin-top:8px" onclick="goToRecord('${p.recordId}')">View Record</button>`:""}
      </div>`).join("")}
    </div>`;
}
window.markRead=function(id){
  const pings=AppState.pings; const p=pings.find(p=>p.id===id);
  if(p) p.read=true; AppState.pings=pings; buildNav(); renderPings();
};
window.goToRecord=function(recId){
  AppState._filterZone=null; AppState._statusFilter=null;
  showPage("records");
  setTimeout(()=>{ document.getElementById("rec-"+recId)?.scrollIntoView({behavior:"smooth",block:"center"}); },150);
};
document.getElementById("save-ping-btn").addEventListener("click",()=>{
  const to=document.getElementById("ping-to").value.trim();
  const toRole=document.getElementById("ping-torole").value;
  const message=document.getElementById("ping-message").value.trim();
  if(!to||!message) return toast("Fill all fields","error");
  AppState.addPing({ to, toRole, toZone:null, message, type:"manual", recordId:null });
  closeModal("modal-add-ping");
  ["ping-to","ping-message"].forEach(id=>document.getElementById(id).value="");
  buildNav(); renderPings(); toast("Ping sent");
});

// ── MODAL CLOSE ON OVERLAY ─────────────────────────────────
document.querySelectorAll(".modal-overlay").forEach(m=>
  m.addEventListener("click",e=>{ if(e.target===m) m.classList.remove("open"); }));

// ── AUTO INIT ──────────────────────────────────────────────
if(AppState.currentUser) initApp();
