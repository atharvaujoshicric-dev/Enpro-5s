// ─── UTILS ───────────────────────────────────────────────────
function toast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg; t.className = type; t.style.display = "block";
  clearTimeout(t._tid);
  t._tid = setTimeout(() => { t.style.display = "none"; }, 3200);
}
function openModal(id)  { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }
function showLightbox(src) {
  document.getElementById("lb-img").src = src;
  document.getElementById("lightbox").classList.add("open");
}
function formatDate(d) { return new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); }
function formatDateTime(d) { return new Date(d).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}); }
function deadlineInfo(createdAt, workType) {
  const days = workType === "WPP" ? 2 : 90;
  const due = new Date(createdAt); due.setDate(due.getDate() + days);
  const diffD = Math.ceil((due - new Date()) / 86400000);
  if (diffD < 0) return { label: `Overdue by ${-diffD}d`, cls: "over" };
  if (diffD <= 5) return { label: `${diffD}d left`, cls: "warn" };
  return { label: `${diffD}d left`, cls: "ok" };
}
function roleBadge(role) {
  const map = { admin:"badge-admin", ceo:"badge-ceo", zone_manager:"badge-manager", user:"badge-user" };
  return `<span class="badge ${map[role]||'badge-user'}">${role.replace("_"," ")}</span>`;
}
function unreadPingCount() {
  const u = AppState.currentUser;
  return AppState.pings.filter(p => !p.read && (
    (u.role === "ceo"   && p.toRole === "ceo") ||
    (u.role === "admin" && (p.toRole === "ceo" || p.toRole === "admin")) ||
    (u.role === "zone_manager" && p.toRole === "zone_manager" && (!p.toZone || p.toZone === u.zone)) ||
    (u.role === "user"  && p.toRole === "user" && (!p.toZone || p.toZone === u.zone))
  )).length;
}

// ─── ICONS ───────────────────────────────────────────────────
const IC = {
  dash:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  zone:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>`,
  rec:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>`,
  usr:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`,
  rpt:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  bell:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
};

// ─── NAV ─────────────────────────────────────────────────────
function buildNav() {
  const u = AppState.currentUser;
  const cnt = unreadPingCount();
  const navItems = [
    { id:"dashboard", lbl:"Dashboard",    icon:IC.dash, roles:["admin","ceo","zone_manager","user"] },
    { id:"zones",     lbl:"Zones",        icon:IC.zone, roles:["admin","ceo","zone_manager","user"] },
    { id:"records",   lbl:"Work Records", icon:IC.rec,  roles:["admin","ceo","zone_manager","user"] },
    { id:"users",     lbl:"Users",        icon:IC.usr,  roles:["admin"] },
    { id:"reports",   lbl:"Reports",      icon:IC.rpt,  roles:["admin","ceo"] },
    { id:"pings",     lbl:`Pings${cnt>0?` <span class="ping-dot"></span>`:""}`, icon:IC.bell, roles:["admin","ceo","zone_manager","user"] },
  ];
  document.getElementById("sidebar-nav").innerHTML = navItems
    .filter(i => i.roles.includes(u.role))
    .map(i => `<div class="nav-item" data-page="${i.id}" onclick="showPage('${i.id}')">${i.icon} <span>${i.lbl}</span></div>`)
    .join("");
}

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  const pg = document.getElementById("page-"+id);
  if (pg) pg.classList.add("active");
  document.querySelector(`.nav-item[data-page="${id}"]`)?.classList.add("active");
  renders[id]?.();
}

const renders = {
  dashboard: renderDashboard,
  zones:     renderZones,
  records:   renderRecords,
  users:     renderUsers,
  reports:   renderReports,
  pings:     renderPings,
};

// ─── AUTH ─────────────────────────────────────────────────────
document.getElementById("login-btn").addEventListener("click", doLogin);
document.getElementById("login-pass").addEventListener("keydown", e => { if(e.key==="Enter") doLogin(); });

function doLogin() {
  const email = document.getElementById("login-email").value.trim();
  const pass  = document.getElementById("login-pass").value;
  const user  = AppState.login(email, pass);
  if (user) initApp();
  else document.getElementById("login-error").textContent = "Invalid email or password.";
}

function initApp() {
  document.getElementById("auth-screen").style.display = "none";
  document.getElementById("app-screen").style.display  = "block";
  const u = AppState.currentUser;
  document.getElementById("sidebar-uname").textContent = u.name;
  document.getElementById("sidebar-role").textContent  = u.role.replace("_"," ");
  buildNav();
  showPage("dashboard");
}

document.getElementById("logout-btn").addEventListener("click", () => {
  AppState.logout();
  document.getElementById("app-screen").style.display = "none";
  document.getElementById("auth-screen").style.display = "flex";
  document.getElementById("login-email").value = "";
  document.getElementById("login-pass").value  = "";
  document.getElementById("login-error").textContent = "";
});

document.getElementById("lightbox").addEventListener("click", () => document.getElementById("lightbox").classList.remove("open"));

// ─── DASHBOARD ───────────────────────────────────────────────
function renderDashboard() {
  const zones   = getVisibleZones();
  const records = getVisibleRecords();
  const total    = records.length;
  const complete = records.filter(r => r.status === "approved").length;
  const pending  = records.filter(r => r.status !== "approved").length;
  const overdue  = records.filter(r => r.status !== "approved" && deadlineInfo(r.createdAt, r.workType).cls === "over").length;
  const awaiting = records.filter(r => r.status === "awaiting_approval").length;

  document.getElementById("dash-content").innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="val">${zones.length}</div><div class="lbl">Zones</div></div>
      <div class="stat-card accent"><div class="val" style="color:var(--accent)">${total}</div><div class="lbl">Total Records</div></div>
      <div class="stat-card"><div class="val" style="color:var(--green)">${complete}</div><div class="lbl">Approved</div></div>
      <div class="stat-card"><div class="val" style="color:var(--accent)">${pending}</div><div class="lbl">Pending</div></div>
      ${awaiting>0?`<div class="stat-card"><div class="val" style="color:var(--blue)">${awaiting}</div><div class="lbl">Awaiting CEO</div></div>`:""}
      ${overdue>0?`<div class="stat-card"><div class="val" style="color:var(--red)">${overdue}</div><div class="lbl">Overdue</div></div>`:""}
    </div>
    <div class="card">
      <div class="card-title">Recent Records</div>
      ${recordsTable(records.slice(-10).reverse())}
    </div>
  `;
}

// ─── ZONES ───────────────────────────────────────────────────
function getVisibleZones() {
  const u = AppState.currentUser;
  if (u.role==="admin"||u.role==="ceo") return AppState.zones;
  if (u.zone) return AppState.zones.filter(z => z.name===u.zone);
  return AppState.zones;
}

function renderZones() {
  const u = AppState.currentUser;
  const zones = getVisibleZones();
  const canManage = u.role==="admin";
  document.getElementById("zones-content").innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Zones</div><div class="page-sub">${zones.length} zones</div></div>
      ${canManage?`<button class="btn btn-primary btn-sm" onclick="openZoneModal()">+ Add Zone</button>`:""}
    </div>
    <div class="zones-grid">
      ${zones.map(z => {
        const recs = AppState.records.filter(r=>r.zoneId===z.id);
        const done = recs.filter(r=>r.status==="approved").length;
        return `<div class="zone-card">
          <div class="zone-name">${z.name}</div>
          <div class="zone-desc">${z.description||""}</div>
          <div style="font-size:0.8rem;color:var(--muted);margin-bottom:12px">${done}/${recs.length} approved</div>
          <div class="zone-actions">
            <button class="btn btn-outline btn-sm" onclick="filterToZone('${z.id}')">View Records</button>
            ${canManage?`
            <button class="btn btn-outline btn-sm" onclick="openZoneModal('${z.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteZone('${z.id}')">Delete</button>`:""}
          </div>
        </div>`;
      }).join("")}
    </div>`;
}

window.filterToZone = function(id) { AppState._filterZone = id; showPage("records"); };
window.deleteZone = function(id) {
  if (!confirm("Delete zone and all its records?")) return;
  AppState.zones   = AppState.zones.filter(z=>z.id!==id);
  AppState.records = AppState.records.filter(r=>r.zoneId!==id);
  renderZones(); toast("Zone deleted");
};
window.openZoneModal = function(id) {
  const z = id ? AppState.zones.find(z=>z.id===id) : null;
  document.getElementById("zone-modal-id").value   = id||"";
  document.getElementById("zone-modal-name").value = z?.name||"";
  document.getElementById("zone-modal-desc").value = z?.description||"";
  document.getElementById("modal-zone-title").textContent = id?"Edit Zone":"Add Zone";
  openModal("modal-add-zone");
};
document.getElementById("save-zone-btn").addEventListener("click", () => {
  const id   = document.getElementById("zone-modal-id").value;
  const name = document.getElementById("zone-modal-name").value.trim();
  const desc = document.getElementById("zone-modal-desc").value.trim();
  if (!name) return toast("Name required","error");
  const zones = AppState.zones;
  if (id) { const z=zones.find(z=>z.id===id); z.name=name; z.description=desc; }
  else zones.push({ id:genId(), name, description:desc });
  AppState.zones = zones;
  closeModal("modal-add-zone"); renderZones(); toast("Zone saved");
});

// ─── RECORDS ─────────────────────────────────────────────────
function getVisibleRecords() {
  const u = AppState.currentUser;
  if (u.role==="admin"||u.role==="ceo") return AppState.records;
  if (u.zone) return AppState.records.filter(r => {
    const z = AppState.zones.find(z=>z.id===r.zoneId);
    return z && z.name===u.zone;
  });
  return AppState.records;
}

function renderRecords() {
  const u = AppState.currentUser;
  const zones = getVisibleZones();
  let records = getVisibleRecords();
  if (AppState._filterZone)   records = records.filter(r=>r.zoneId===AppState._filterZone);
  if (AppState._statusFilter) records = applyStatusFilter(records, AppState._statusFilter);

  const selZone   = AppState._filterZone ? AppState.zones.find(z=>z.id===AppState._filterZone) : null;
  const canCreate = ["admin","ceo","user"].includes(u.role);

  document.getElementById("records-content").innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Work Records${selZone?` — ${selZone.name}`:""}</div>
        <div class="page-sub">${records.length} records</div>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        ${AppState._filterZone?`<button class="btn btn-outline btn-sm" onclick="AppState._filterZone=null;renderRecords()">Clear Filter</button>`:""}
        ${canCreate?`<button class="btn btn-primary btn-sm" onclick="openAddRecord()">+ New Record</button>`:""}
      </div>
    </div>
    <div class="card">
      <div style="margin-bottom:14px;display:flex;gap:10px;flex-wrap:wrap">
        <select onchange="AppState._filterZone=this.value||null;renderRecords()" style="max-width:180px">
          <option value="">All Zones</option>
          ${zones.map(z=>`<option value="${z.id}" ${z.id===AppState._filterZone?"selected":""}>${z.name}</option>`).join("")}
        </select>
        <select onchange="AppState._statusFilter=this.value||null;renderRecords()" style="max-width:180px">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="awaiting">Awaiting CEO</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>
      <div id="rec-list">
        ${records.length===0
          ? `<p style="color:var(--muted);text-align:center;padding:40px">No records found.</p>`
          : records.slice().reverse().map(r=>recordCard(r)).join("")}
      </div>
    </div>`;
}

function applyStatusFilter(records, filter) {
  if (filter==="pending")  return records.filter(r=>r.status==="pending"||r.status==="rework");
  if (filter==="awaiting") return records.filter(r=>r.status==="awaiting_approval");
  if (filter==="approved") return records.filter(r=>r.status==="approved");
  if (filter==="rejected") return records.filter(r=>r.status==="rejected");
  if (filter==="overdue")  return records.filter(r=>r.status!=="approved"&&deadlineInfo(r.createdAt,r.workType).cls==="over");
  return records;
}

function statusBadge(r) {
  const map = {
    pending:           ["badge-pending",  "Pending"],
    awaiting_approval: ["badge-ceo",      "Awaiting CEO"],
    approved:          ["badge-complete", "Approved"],
    rejected:          ["badge-overdue",  "Rejected — Rework"],
    rework:            ["badge-pending",  "Rework Required"],
  };
  const [cls, lbl] = map[r.status] || ["badge-pending","Pending"];
  return `<span class="badge ${cls}">${lbl}</span>`;
}

function recordCard(r) {
  const u    = AppState.currentUser;
  const zone = AppState.zones.find(z=>z.id===r.zoneId);
  const dl   = deadlineInfo(r.createdAt, r.workType);
  const isAdmin = u.role==="admin";

  // Permission logic
  const canUploadBefore = (isAdmin || u.role==="user") && !r.beforePhoto;
  const canUploadAfter  = (isAdmin || u.role==="zone_manager") && r.beforePhoto
                          && (r.status==="pending" || r.status==="rework");
  const canAddMoreAfter = (isAdmin || u.role==="zone_manager") && r.workType==="FPP"
                          && r.status==="approved" && r.beforePhoto;
  const canApprove      = (u.role==="ceo" || isAdmin) && r.status==="awaiting_approval";
  const canDelete       = isAdmin;
  const canForceStatus  = isAdmin; // god mode

  // Build after-photos section
  let afterSection = "";
  const rounds = r.afterPhotos || (r.afterPhoto ? [{ round:1, photo:r.afterPhoto, uploadedAt:r.createdAt }] : []);

  if (rounds.length > 0) {
    afterSection = rounds.map(rnd => `
      <div>
        <div style="font-size:0.72rem;color:var(--muted);margin-bottom:4px">AFTER — Round ${rnd.round}</div>
        <img src="${rnd.photo}" onclick="showLightbox('${rnd.photo}')" alt="After R${rnd.round}" style="width:120px;height:90px;object-fit:cover;border-radius:6px;border:1px solid var(--border);cursor:pointer">
        <div style="font-size:0.68rem;color:var(--muted);margin-top:2px">${formatDate(rnd.uploadedAt)}</div>
      </div>`).join("");
  } else {
    afterSection = `<div>
      <div style="font-size:0.72rem;color:var(--muted);margin-bottom:4px">AFTER</div>
      <div class="photo-placeholder">
        ${canUploadAfter
          ? `<button class="btn btn-sm btn-success" onclick="uploadAfterPhoto('${r.id}')">Upload After</button>`
          : "Awaiting"}
      </div>
    </div>`;
  }

  // Rejection comments thread
  const rejections = (r.rejections || []).map(rj => `
    <div style="background:rgba(224,92,92,0.08);border:1px solid rgba(224,92,92,0.25);border-radius:8px;padding:10px;margin-top:8px;font-size:0.82rem">
      <span style="color:var(--red);font-weight:600">❌ CEO Rejected — Round ${rj.round}</span>
      <span style="color:var(--muted);margin-left:8px">${formatDateTime(rj.at)}</span>
      <div style="margin-top:4px">${rj.comment}</div>
    </div>`).join("");

  return `<div class="record-card" id="rec-${r.id}">
    <div class="record-header">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span style="font-family:var(--font-head);font-weight:600">${r.title}</span>
        <span class="badge badge-ceo">${r.workType}</span>
        ${statusBadge(r)}
        ${r.status!=="approved"?`<span class="deadline ${dl.cls}">${dl.label}</span>`:""}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
        ${canApprove?`
          <button class="btn btn-sm btn-success" onclick="approveRecord('${r.id}')">✓ Approve</button>
          <button class="btn btn-sm btn-danger"  onclick="openRejectModal('${r.id}')">✗ Reject</button>`:""}
        ${canAddMoreAfter?`<button class="btn btn-sm btn-blue" onclick="uploadAfterPhoto('${r.id}')">+ Add Round</button>`:""}
        ${canDelete?`<button class="btn btn-sm btn-danger" onclick="deleteRecord('${r.id}')">Delete</button>`:""}
        ${canForceStatus?`<button class="btn btn-sm btn-outline" onclick="openAdminPanel('${r.id}')">⚙</button>`:""}
      </div>
    </div>
    <div style="font-size:0.78rem;color:var(--muted)">Zone: ${zone?.name||"—"} &nbsp;|&nbsp; Created: ${formatDate(r.createdAt)}</div>
    ${r.notes?`<div style="font-size:0.82rem;margin-top:4px">${r.notes}</div>`:""}
    ${rejections}
    <div class="record-photos" style="margin-top:10px">
      <div>
        <div style="font-size:0.72rem;color:var(--muted);margin-bottom:4px">BEFORE</div>
        ${r.beforePhoto
          ? `<img src="${r.beforePhoto}" onclick="showLightbox('${r.beforePhoto}')" alt="Before" style="width:120px;height:90px;object-fit:cover;border-radius:6px;border:1px solid var(--border);cursor:pointer">`
          : `<div class="photo-placeholder">${canUploadBefore
              ? `<button class="btn btn-sm btn-outline" onclick="uploadBeforePhoto('${r.id}')">Upload Before</button>`
              : "No photo"}</div>`}
      </div>
      ${afterSection}
    </div>
  </div>`;
}

function recordsTable(records) {
  if (!records.length) return `<p style="color:var(--muted);text-align:center;padding:24px">No records yet.</p>`;
  return `<div class="table-wrap"><table class="data-table">
    <thead><tr><th>Title</th><th>Zone</th><th>Type</th><th>Status</th><th>Deadline</th></tr></thead>
    <tbody>${records.map(r => {
      const zone = AppState.zones.find(z=>z.id===r.zoneId);
      const dl = deadlineInfo(r.createdAt, r.workType);
      return `<tr>
        <td>${r.title}</td><td>${zone?.name||"—"}</td>
        <td><span class="badge badge-ceo">${r.workType}</span></td>
        <td>${statusBadge(r)}</td>
        <td class="deadline ${r.status==="approved"?"":dl.cls}">${r.status==="approved"?"—":dl.label}</td>
      </tr>`;
    }).join("")}</tbody>
  </table></div>`;
}

// Add record
window.openAddRecord = function() {
  const zones = getVisibleZones();
  document.getElementById("rec-zone-sel").innerHTML = zones.map(z=>`<option value="${z.id}">${z.name}</option>`).join("");
  document.getElementById("rec-title").value = "";
  document.getElementById("rec-notes").value = "";
  openModal("modal-add-record");
};
document.getElementById("save-record-btn").addEventListener("click", () => {
  const title  = document.getElementById("rec-title").value.trim();
  const zoneId = document.getElementById("rec-zone-sel").value;
  const wt     = document.getElementById("rec-worktype").value;
  const notes  = document.getElementById("rec-notes").value.trim();
  if (!title||!zoneId) return toast("Title and zone required","error");
  const records = AppState.records;
  records.push({ id:genId(), title, zoneId, workType:wt, notes, createdAt:new Date().toISOString(),
    status:"pending", beforePhoto:null, afterPhotos:[], rejections:[] });
  AppState.records = records;
  closeModal("modal-add-record"); renderRecords(); toast("Record created");
});

// Upload before photo
window.uploadBeforePhoto = function(recordId) {
  pickImage(dataUrl => {
    const records = AppState.records;
    const r = records.find(r=>r.id===recordId);
    if (!r) return;
    r.beforePhoto = dataUrl;
    AppState.records = records;
    // Ping CEO
    const zone = AppState.zones.find(z=>z.id===r.zoneId);
    AppState.addPing({
      to: "CEO", toRole: "ceo", toZone: null,
      message: `User uploaded BEFORE photo for "${r.title}" in ${zone?.name||"—"}. Please review.`,
      type: "before_uploaded", recordId
    });
    buildNav(); renderRecords(); toast("Before photo uploaded — CEO notified");
  });
};

// Upload after photo
window.uploadAfterPhoto = function(recordId) {
  pickImage(dataUrl => {
    const records = AppState.records;
    const r = records.find(r=>r.id===recordId);
    if (!r) return;
    if (!r.afterPhotos) r.afterPhotos = [];
    const round = r.afterPhotos.length + 1;
    r.afterPhotos.push({ round, photo:dataUrl, uploadedAt:new Date().toISOString() });
    r.afterPhoto = dataUrl; // legacy compat
    r.status = "awaiting_approval";
    AppState.records = records;
    const zone = AppState.zones.find(z=>z.id===r.zoneId);
    AppState.addPing({
      to: "CEO", toRole: "ceo", toZone: null,
      message: `Zone Manager uploaded AFTER photo (Round ${round}) for "${r.title}" in ${zone?.name||"—"}. Awaiting your approval.`,
      type: "after_uploaded", recordId
    });
    buildNav(); renderRecords(); toast("After photo uploaded — CEO notified for approval");
  });
};

// Approve
window.approveRecord = function(recordId) {
  const records = AppState.records;
  const r = records.find(r=>r.id===recordId);
  if (!r) return;
  r.status = "approved";
  AppState.records = records;
  const zone = AppState.zones.find(z=>z.id===r.zoneId);
  // Ping zone manager
  AppState.addPing({
    to: "Zone Manager", toRole: "zone_manager", toZone: zone?.name||null,
    message: `✅ CEO approved your work on "${r.title}" in ${zone?.name||"—"}.`,
    type: "approved", recordId
  });
  buildNav(); renderRecords(); toast("Record approved");
};

// Reject flow
let _rejectRecordId = null;
window.openRejectModal = function(recordId) {
  _rejectRecordId = recordId;
  document.getElementById("reject-comment").value = "";
  openModal("modal-reject");
};
document.getElementById("confirm-reject-btn").addEventListener("click", () => {
  const comment = document.getElementById("reject-comment").value.trim();
  if (!comment) return toast("Please add a rejection comment","error");
  const records = AppState.records;
  const r = records.find(r=>r.id===_rejectRecordId);
  if (!r) return;
  if (!r.rejections) r.rejections = [];
  const round = (r.afterPhotos||[]).length;
  r.rejections.push({ round, comment, at:new Date().toISOString() });
  r.status = "rework";
  AppState.records = records;
  const zone = AppState.zones.find(z=>z.id===r.zoneId);
  AppState.addPing({
    to: "Zone Manager", toRole: "zone_manager", toZone: zone?.name||null,
    message: `❌ CEO rejected Round ${round} of "${r.title}" in ${zone?.name||"—"}. Comment: ${comment}. Please re-upload after photo.`,
    type: "rejected", recordId: _rejectRecordId
  });
  closeModal("modal-reject");
  buildNav(); renderRecords(); toast("Rejection sent to manager");
});

// Admin panel (god mode)
window.openAdminPanel = function(recordId) {
  document.getElementById("admin-rec-id").value = recordId;
  const r = AppState.records.find(r=>r.id===recordId);
  document.getElementById("admin-status-sel").value = r.status;
  openModal("modal-admin-panel");
};
document.getElementById("save-admin-panel-btn").addEventListener("click", () => {
  const id = document.getElementById("admin-rec-id").value;
  const status = document.getElementById("admin-status-sel").value;
  const records = AppState.records;
  const r = records.find(r=>r.id===id);
  if (r) { r.status = status; AppState.records = records; }
  closeModal("modal-admin-panel");
  // Allow admin to also clear/add photos
  renderRecords(); toast("Record updated (Admin override)");
});

window.deleteRecord = function(id) {
  if (!confirm("Delete this record?")) return;
  AppState.records = AppState.records.filter(r=>r.id!==id);
  renderRecords(); toast("Record deleted");
};

function pickImage(cb) {
  const inp = document.createElement("input");
  inp.type = "file"; inp.accept = "image/*";
  inp.onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => cb(ev.target.result);
    reader.readAsDataURL(file);
  };
  inp.click();
}

// ─── USERS ───────────────────────────────────────────────────
function renderUsers() {
  const users = AppState.users;
  document.getElementById("users-content").innerHTML = `
    <div class="page-header">
      <div><div class="page-title">User Management</div><div class="page-sub">${users.length} users</div></div>
      <button class="btn btn-primary btn-sm" onclick="openUserModal()">+ Add User</button>
    </div>
    <div class="card">
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Zone</th><th>Actions</th></tr></thead>
        <tbody>${users.map(u=>`<tr>
          <td>${u.name}</td><td>${u.email}</td>
          <td>${roleBadge(u.role)}</td>
          <td>${u.zone||"—"}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="openUserModal('${u.email}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteUser('${u.email}')" style="margin-left:6px">Delete</button>
          </td>
        </tr>`).join("")}</tbody>
      </table></div>
    </div>`;
}

window.openUserModal = function(email) {
  const u = email ? AppState.users.find(u=>u.email===email) : null;
  document.getElementById("user-edit-email").value = email||"";
  document.getElementById("user-name").value     = u?.name||"";
  document.getElementById("user-email").value    = u?.email||"";
  document.getElementById("user-password").value = "";
  document.getElementById("user-role").value     = u?.role||"user";
  const zones = AppState.zones;
  document.getElementById("user-zone-sel").innerHTML =
    `<option value="">No specific zone</option>` +
    zones.map(z=>`<option value="${z.name}" ${z.name===u?.zone?"selected":""}>${z.name}</option>`).join("");
  document.getElementById("modal-user-title").textContent = email?"Edit User":"Add User";
  openModal("modal-add-user");
};
document.getElementById("save-user-btn").addEventListener("click", () => {
  const editEmail = document.getElementById("user-edit-email").value;
  const name     = document.getElementById("user-name").value.trim();
  const email    = document.getElementById("user-email").value.trim().toLowerCase();
  const password = document.getElementById("user-password").value;
  const role     = document.getElementById("user-role").value;
  const zone     = document.getElementById("user-zone-sel").value||null;
  if (!name||!email) return toast("Name and email required","error");
  const users = AppState.users;
  if (editEmail) {
    const idx = users.findIndex(u=>u.email===editEmail);
    if (idx>=0) users[idx] = { ...users[idx], name, email, role, zone, ...(password?{password}:{}) };
  } else {
    if (!password) return toast("Password required","error");
    if (users.find(u=>u.email===email)) return toast("Email already exists","error");
    users.push({ name, email, password, role, zone });
  }
  AppState.users = users;
  closeModal("modal-add-user"); renderUsers(); toast("User saved");
});
window.deleteUser = function(email) {
  if (!confirm("Delete user?")) return;
  AppState.users = AppState.users.filter(u=>u.email!==email);
  renderUsers(); toast("User deleted");
};

// ─── REPORTS ─────────────────────────────────────────────────
function renderReports() {
  const zones = AppState.zones;
  document.getElementById("reports-content").innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Reports</div></div>
      <button class="btn btn-primary btn-sm" onclick="window.print()">Export / Print</button>
    </div>
    <div id="report-body">
    ${zones.map(z => {
      const recs = AppState.records.filter(r=>r.zoneId===z.id);
      const done = recs.filter(r=>r.status==="approved").length;
      const pct  = recs.length ? Math.round(done/recs.length*100) : 0;
      return `<div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="card-title" style="margin-bottom:0">${z.name}</div>
          <span class="badge ${pct===100?"badge-complete":pct>50?"badge-manager":"badge-pending"}">${pct}% approved</span>
        </div>
        <div style="background:var(--bg);border-radius:4px;height:6px;margin-bottom:16px">
          <div style="height:6px;border-radius:4px;width:${pct}%;background:${pct===100?"var(--green)":"var(--accent)"}"></div>
        </div>
        ${recordsTable(recs)}
      </div>`;
    }).join("")}
    </div>`;
}

// ─── PINGS ───────────────────────────────────────────────────
function renderPings() {
  const u    = AppState.currentUser;
  const all  = AppState.pings;
  const mine = all.filter(p =>
    (u.role==="ceo"   && p.toRole==="ceo") ||
    (u.role==="admin") ||
    (u.role==="zone_manager" && p.toRole==="zone_manager" && (!p.toZone||p.toZone===u.zone)) ||
    (u.role==="user"  && p.toRole==="user" && (!p.toZone||p.toZone===u.zone))
  ).slice().reverse();

  const canSend = u.role==="ceo"||u.role==="admin";
  document.getElementById("pings-content").innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Pings & Notifications</div></div>
      ${canSend?`<button class="btn btn-primary btn-sm" onclick="openModal('modal-add-ping')">+ Send Ping</button>`:""}
    </div>
    <div class="card">
      ${mine.length===0?`<p style="color:var(--muted);text-align:center;padding:40px">No notifications.</p>`:
        mine.map(p=>`<div class="record-card" style="margin-bottom:10px;${!p.read?"border-left:3px solid var(--accent)":""}">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
            <div>
              <span style="font-weight:600;font-size:0.85rem">${p.to}</span>
              <span style="font-size:0.72rem;color:var(--muted);margin-left:8px">${formatDateTime(p.createdAt)}</span>
              ${!p.read?`<span class="ping-dot" style="margin-left:4px"></span>`:""}
            </div>
            ${!p.read?`<button class="btn btn-outline btn-sm" onclick="markRead('${p.id}')">Mark Read</button>`:""}
          </div>
          <div style="margin-top:6px;font-size:0.88rem;line-height:1.5">${p.message}</div>
          ${p.recordId?`<button class="btn btn-outline btn-sm" style="margin-top:8px" onclick="goToRecord('${p.recordId}')">View Record</button>`:""}
        </div>`).join("")}
    </div>`;
}

window.markRead = function(id) {
  const pings = AppState.pings;
  const p = pings.find(p=>p.id===id);
  if (p) p.read = true;
  AppState.pings = pings;
  buildNav(); renderPings();
};

window.goToRecord = function(recordId) {
  AppState._filterZone = null;
  AppState._statusFilter = null;
  showPage("records");
  setTimeout(() => {
    const el = document.getElementById("rec-"+recordId);
    if (el) el.scrollIntoView({ behavior:"smooth", block:"center" });
  }, 100);
};

document.getElementById("save-ping-btn").addEventListener("click", () => {
  const to      = document.getElementById("ping-to").value.trim();
  const toRole  = document.getElementById("ping-torole").value;
  const message = document.getElementById("ping-message").value.trim();
  if (!to||!message) return toast("Fill all fields","error");
  AppState.addPing({ to, toRole, toZone:null, message, type:"manual", recordId:null });
  closeModal("modal-add-ping");
  document.getElementById("ping-to").value = "";
  document.getElementById("ping-message").value = "";
  buildNav(); renderPings(); toast("Ping sent");
});

// ─── MODAL CLOSE ON OVERLAY ───────────────────────────────────
document.querySelectorAll(".modal-overlay").forEach(m =>
  m.addEventListener("click", e => { if (e.target===m) m.classList.remove("open"); })
);

// ─── AUTO INIT ────────────────────────────────────────────────
if (AppState.currentUser) initApp();
