// ─── UTILITIES ───────────────────────────────────────────────
function toast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg; t.className = type; t.style.display = "block";
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.display = "none"; }, 3000);
}

function openModal(id) { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

function showLightbox(src) {
  const lb = document.getElementById("lightbox");
  lb.querySelector("img").src = src;
  lb.classList.add("open");
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function deadlineInfo(createdAt, workType) {
  const days = workType === "WPP" ? 2 : 90;
  const due = new Date(createdAt); due.setDate(due.getDate() + days);
  const diffMs = due - new Date(); const diffD = Math.ceil(diffMs / 86400000);
  if (diffD < 0) return { label: `Overdue by ${-diffD}d`, cls: "over" };
  if (diffD <= 5) return { label: `${diffD}d left`, cls: "warn" };
  return { label: `${diffD}d left`, cls: "ok" };
}

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function roleBadge(role) {
  const map = { admin: "badge-admin", ceo: "badge-ceo", zone_manager: "badge-manager", user: "badge-user" };
  return `<span class="badge ${map[role] || "badge-user"}">${role}</span>`;
}

// ─── NAV ─────────────────────────────────────────────────────
function showPage(id, keepFilters) {
  if (!keepFilters) {
    AppState._filterZone   = null;
    AppState._statusFilter = null;
  }

  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.getElementById("page-" + id)?.classList.add("active");
  document.querySelector(`.nav-item[data-page="${id}"]`)?.classList.add("active");
  renderPage(id);
}

function buildNav() {
  const u = AppState.currentUser;
  const pingCount = getPingCount();
  const nav = document.getElementById("sidebar-nav");
  const items = [
    { id: "dashboard", label: "Dashboard", icon: icons.dashboard, roles: ["admin","ceo","zone_manager","user"] },
    { id: "zones",     label: "Zones",     icon: icons.zone,      roles: ["admin","ceo","zone_manager","user"] },
    { id: "records",   label: "Work Records", icon: icons.record,  roles: ["admin","ceo","zone_manager","user"] },
    { id: "users",     label: "Users",     icon: icons.user,      roles: ["admin"] },
    { id: "reports",   label: "Reports",   icon: icons.report,    roles: ["admin","ceo"] },
    { id: "pings",     label: `Pings${pingCount > 0 ? ' <span class="ping-dot"></span>' : ""}`, icon: icons.ping, roles: ["ceo","admin"] },
  ];
  nav.innerHTML = items
    .filter(i => i.roles.includes(u.role))
    .map(i => `<div class="nav-item" data-page="${i.id}" onclick="showPage('${i.id}')">${i.icon} ${i.label}</div>`)
    .join("");
}

// ─── ICONS ───────────────────────────────────────────────────
const icons = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  zone:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>`,
  record:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>`,
  user:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
  report:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  ping:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`,
};

// ─── LOGIN ────────────────────────────────────────────────────
document.getElementById("login-btn").addEventListener("click", doLogin);
document.getElementById("login-pass").addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });

function doLogin() {
  const email = document.getElementById("login-email").value.trim();
  const pass  = document.getElementById("login-pass").value;
  const user  = AppState.login(email, pass);
  if (user) {
    document.getElementById("login-error").textContent = "";
    initApp();
  } else {
    document.getElementById("login-error").textContent = "Invalid email or password.";
  }
}

function initApp() {
  document.getElementById("auth-screen").style.display = "none";
  document.getElementById("app-screen").style.display  = "block";
  const u = AppState.currentUser;
  document.getElementById("sidebar-uname").textContent = u.name;
  document.getElementById("sidebar-role").textContent  = u.role;
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

document.getElementById("lightbox").addEventListener("click", () => {
  document.getElementById("lightbox").classList.remove("open");
});

// Close any modal on overlay click (works for dynamically-shown modals too)
document.addEventListener("click", e => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("open");
  }
});

// ─── PAGE RENDERERS ───────────────────────────────────────────
function renderPage(id) {
  const map = { dashboard: renderDashboard, zones: renderZones, records: renderRecords,
                users: renderUsers, reports: renderReports, pings: renderPings };
  map[id]?.();
}

// ── DASHBOARD ────────────────────────────────────────────────
function renderDashboard() {
  const zones   = getVisibleZones();
  const records = getVisibleRecords();
  const total    = records.length;
  const complete = records.filter(r => r.afterPhoto).length;
  const pending  = records.filter(r => !r.afterPhoto).length;
  const overdue  = records.filter(r => !r.afterPhoto && deadlineInfo(r.createdAt, r.workType).cls === "over").length;

  document.getElementById("dash-content").innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="val">${zones.length}</div><div class="lbl">Zones</div></div>
      <div class="stat-card accent"><div class="val" style="color:var(--accent)">${total}</div><div class="lbl">Total Records</div></div>
      <div class="stat-card"><div class="val" style="color:var(--green)">${complete}</div><div class="lbl">Completed</div></div>
      <div class="stat-card"><div class="val" style="color:var(--accent)">${pending}</div><div class="lbl">Pending</div></div>
      ${overdue > 0 ? `<div class="stat-card"><div class="val" style="color:var(--red)">${overdue}</div><div class="lbl">Overdue</div></div>` : ""}
    </div>
    <div class="card">
      <div class="card-title">Recent Work Records</div>
      ${renderRecordsTable(records.slice().reverse().slice(0, 10))}
    </div>`;
}

// ── ZONES ────────────────────────────────────────────────────
function getVisibleZones() {
  const u = AppState.currentUser;
  if (u.role === "admin" || u.role === "ceo") return AppState.zones;
  if (u.zone) return AppState.zones.filter(z => z.name === u.zone);
  return AppState.zones;
}

function renderZones() {
  const u = AppState.currentUser;
  const zones = getVisibleZones();
  const canManage = u.role === "admin";

  document.getElementById("zones-content").innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Zones</div><div class="page-sub">${zones.length} zones configured</div></div>
      ${canManage ? `<button class="btn btn-primary btn-sm" onclick="openAddZoneModal()">+ Add Zone</button>` : ""}
    </div>
    <div class="zones-grid">
      ${zones.map(z => {
        const recs = AppState.records.filter(r => r.zoneId === z.id);
        const done = recs.filter(r => r.afterPhoto).length;
        return `<div class="zone-card">
          <div class="zone-name">${z.name}</div>
          <div class="zone-desc">${z.description || ""}</div>
          <div style="font-size:0.8rem;color:var(--muted);margin-bottom:12px">${done}/${recs.length} records complete</div>
          <div class="zone-actions">
            <button class="btn btn-outline btn-sm" onclick="openZoneRecords('${z.id}')">View Records</button>
            ${canManage ? `
            <button class="btn btn-sm btn-outline" onclick="editZone('${z.id}')">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteZone('${z.id}')">Delete</button>` : ""}
          </div>
        </div>`;
      }).join("")}
    </div>`;
}

window.openAddZoneModal = function() {
  document.getElementById("zone-modal-id").value   = "";
  document.getElementById("zone-modal-name").value = "";
  document.getElementById("zone-modal-desc").value = "";
  document.getElementById("modal-zone-title").textContent = "Add Zone";
  openModal("modal-add-zone");
};

window.openZoneRecords = function(zoneId) {
  AppState._filterZone = zoneId;
  showPage("records", true);
};

window.deleteZone = function(id) {
  if (!confirm("Delete this zone and all its records?")) return;
  AppState.zones   = AppState.zones.filter(z => z.id !== id);
  AppState.records = AppState.records.filter(r => r.zoneId !== id);
  AppState.save(); renderZones(); toast("Zone deleted");
};

window.editZone = function(id) {
  const z = AppState.zones.find(z => z.id === id);
  if (!z) return;
  document.getElementById("zone-modal-id").value   = id;
  document.getElementById("zone-modal-name").value = z.name;
  document.getElementById("zone-modal-desc").value = z.description || "";
  document.getElementById("modal-zone-title").textContent = "Edit Zone";
  openModal("modal-add-zone");
};

document.getElementById("save-zone-btn").addEventListener("click", () => {
  const id   = document.getElementById("zone-modal-id").value;
  const name = document.getElementById("zone-modal-name").value.trim();
  const desc = document.getElementById("zone-modal-desc").value.trim();
  if (!name) return toast("Zone name is required", "error");

  if (id) {
    const z = AppState.zones.find(z => z.id === id);
    if (z) { z.name = name; z.description = desc; }
  } else {
    AppState.zones.push({ id: genId(), name, description: desc });
  }
  AppState.save(); closeModal("modal-add-zone"); renderZones(); toast("Zone saved");
});

// ── RECORDS ──────────────────────────────────────────────────
function getVisibleRecords() {
  const u = AppState.currentUser;
  if (u.role === "admin" || u.role === "ceo") return AppState.records;
  if (u.zone) {
    return AppState.records.filter(r => {
      const z = AppState.zones.find(z => z.id === r.zoneId);
      return z && z.name === u.zone;
    });
  }
  return AppState.records;
}

function renderRecords() {
  const u = AppState.currentUser;
  const zones = getVisibleZones();
  const canCreate = ["admin","ceo","user"].includes(u.role);

  // Apply filters
  let records = getVisibleRecords();
  if (AppState._filterZone)   records = records.filter(r => r.zoneId === AppState._filterZone);
  if (AppState._statusFilter === "pending")  records = records.filter(r => !r.afterPhoto);
  else if (AppState._statusFilter === "complete") records = records.filter(r => !!r.afterPhoto);
  else if (AppState._statusFilter === "overdue")  records = records.filter(r => !r.afterPhoto && deadlineInfo(r.createdAt, r.workType).cls === "over");

  const selectedZone = AppState._filterZone ? AppState.zones.find(z => z.id === AppState._filterZone) : null;

  document.getElementById("records-content").innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Work Records${selectedZone ? ` — ${selectedZone.name}` : ""}</div>
        <div class="page-sub">${records.length} records</div>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        ${canCreate ? `<button class="btn btn-primary btn-sm" onclick="openAddRecord()">+ New Record</button>` : ""}
      </div>
    </div>
    <div class="card">
      <div style="margin-bottom:14px;display:flex;gap:10px;flex-wrap:wrap">
        <select onchange="setZoneFilter(this.value)" style="max-width:180px">
          <option value="">All Zones</option>
          ${zones.map(z => `<option value="${z.id}" ${z.id === AppState._filterZone ? "selected" : ""}>${z.name}</option>`).join("")}
        </select>
        <select onchange="setStatusFilter(this.value)" style="max-width:180px">
          <option value="">All Status</option>
          <option value="pending"  ${AppState._statusFilter==="pending"  ? "selected":""}>Pending</option>
          <option value="complete" ${AppState._statusFilter==="complete" ? "selected":""}>Complete</option>
          <option value="overdue"  ${AppState._statusFilter==="overdue"  ? "selected":""}>Overdue</option>
        </select>
        ${AppState._filterZone ? `<button class="btn btn-outline btn-sm" onclick="setZoneFilter('')">✕ Clear Zone</button>` : ""}
      </div>
      <div id="record-list">
        ${records.length === 0
          ? `<p style="color:var(--muted);text-align:center;padding:40px">No records found.</p>`
          : records.slice().reverse().map(r => renderRecordCard(r)).join("")}
      </div>
    </div>`;
}

window.setZoneFilter = function(val) {
  AppState._filterZone = val || null;
  renderRecords();
};
window.setStatusFilter = function(val) {
  AppState._statusFilter = val || null;
  renderRecords();
};

function renderRecordCard(r) {
  const u    = AppState.currentUser;
  const zone = AppState.zones.find(z => z.id === r.zoneId);
  const dl   = deadlineInfo(r.createdAt, r.workType);
  const canUploadBefore = ["admin","user"].includes(u.role) && !r.beforePhoto;
  const canUploadAfter  = ["admin","zone_manager"].includes(u.role) && r.beforePhoto && !r.afterPhoto;
  const canDelete = u.role === "admin";

  const wtColor = r.workType === "WPP" ? "badge-ceo" : r.workType === "FPP" ? "badge-manager" : "badge-admin";

  return `<div class="record-card" id="rec-${r.id}">
    <div class="record-header">
      <div>
        <span style="font-family:var(--font-head);font-weight:600">${r.title}</span>
        <span class="badge ${wtColor}" style="margin-left:8px">${r.workType}</span>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <span class="badge ${r.afterPhoto ? "badge-complete" : "badge-pending"}">${r.afterPhoto ? "Complete" : "Pending"}</span>
        ${!r.afterPhoto ? `<span class="deadline ${dl.cls}">${dl.label}</span>` : ""}
        ${canDelete ? `<button class="btn btn-sm btn-danger" onclick="deleteRecord('${r.id}')">Delete</button>` : ""}
      </div>
    </div>
    <div style="font-size:0.78rem;color:var(--muted)">Zone: ${zone?.name || "—"} &nbsp;|&nbsp; Created: ${formatDate(r.createdAt)}</div>
    ${r.notes ? `<div style="font-size:0.82rem;margin-top:6px">${r.notes}</div>` : ""}
    <div class="record-photos">
      <div>
        <div style="font-size:0.72rem;color:var(--muted);margin-bottom:4px">BEFORE</div>
        ${r.beforePhoto
          ? `<img src="${r.beforePhoto}" onclick="showLightbox('${r.beforePhoto}')" alt="Before">`
          : `<div class="photo-placeholder">${canUploadBefore
              ? `<button class="btn btn-sm btn-outline" onclick="uploadPhoto('${r.id}','before')">Upload</button>`
              : "No photo"}</div>`}
      </div>
      <div>
        <div style="font-size:0.72rem;color:var(--muted);margin-bottom:4px">AFTER</div>
        ${r.afterPhoto
          ? `<img src="${r.afterPhoto}" onclick="showLightbox('${r.afterPhoto}')" alt="After">`
          : `<div class="photo-placeholder">${canUploadAfter
              ? `<button class="btn btn-sm btn-success" onclick="uploadPhoto('${r.id}','after')">Upload</button>`
              : "Awaiting"}</div>`}
      </div>
    </div>
  </div>`;
}

function renderRecordsTable(records) {
  if (!records.length) return `<p style="color:var(--muted);text-align:center;padding:24px">No records yet.</p>`;
  return `<div class="table-wrap"><table class="data-table">
    <thead><tr><th>Title</th><th>Zone</th><th>Type</th><th>Status</th><th>Deadline</th></tr></thead>
    <tbody>${records.map(r => {
      const zone = AppState.zones.find(z => z.id === r.zoneId);
      const dl   = deadlineInfo(r.createdAt, r.workType);
      return `<tr>
        <td>${r.title}</td>
        <td>${zone?.name || "—"}</td>
        <td><span class="badge badge-ceo">${r.workType}</span></td>
        <td><span class="badge ${r.afterPhoto ? "badge-complete" : "badge-pending"}">${r.afterPhoto ? "Done" : "Pending"}</span></td>
        <td class="deadline ${r.afterPhoto ? "" : dl.cls}">${r.afterPhoto ? "—" : dl.label}</td>
      </tr>`;
    }).join("")}</tbody>
  </table></div>`;
}

window.openAddRecord = function() {
  const zones = getVisibleZones();
  document.getElementById("rec-zone-sel").innerHTML =
    zones.map(z => `<option value="${z.id}">${z.name}</option>`).join("");
  document.getElementById("rec-title").value    = "";
  document.getElementById("rec-notes").value    = "";
  document.getElementById("rec-worktype").value = "FPP";
  openModal("modal-add-record");
};

document.getElementById("save-record-btn").addEventListener("click", () => {
  const title    = document.getElementById("rec-title").value.trim();
  const zoneId   = document.getElementById("rec-zone-sel").value;
  const workType = document.getElementById("rec-worktype").value;
  const notes    = document.getElementById("rec-notes").value.trim();
  if (!title)  return toast("Title is required", "error");
  if (!zoneId) return toast("Zone is required", "error");

  AppState.records.push({ id: genId(), title, zoneId, workType, notes, createdAt: new Date().toISOString(), beforePhoto: null, afterPhoto: null });
  AppState.save();
  closeModal("modal-add-record");
  renderRecords();
  toast("Record created");
});

window.deleteRecord = function(id) {
  if (!confirm("Delete this record?")) return;
  AppState.records = AppState.records.filter(r => r.id !== id);
  AppState.save(); renderRecords(); toast("Record deleted");
};

window.uploadPhoto = function(recordId, type) {
  const inp = document.createElement("input");
  inp.type = "file"; inp.accept = "image/*";
  inp.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const r = AppState.records.find(r => r.id === recordId);
      if (!r) return;
      if (type === "before") r.beforePhoto = ev.target.result;
      else r.afterPhoto = ev.target.result;
      AppState.save(); renderRecords(); toast(`${type} photo uploaded`);
    };
    reader.readAsDataURL(file);
  };
  inp.click();
};

// ── USERS ────────────────────────────────────────────────────
function renderUsers() {
  const users = AppState.users;
  document.getElementById("users-content").innerHTML = `
    <div class="page-header">
      <div><div class="page-title">User Management</div><div class="page-sub">${users.length} users</div></div>
      <button class="btn btn-primary btn-sm" onclick="openAddUserModal()">+ Add User</button>
    </div>
    <div class="card">
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Zone</th><th>Actions</th></tr></thead>
        <tbody>${users.map(u => `<tr>
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td>${roleBadge(u.role)}</td>
          <td>${u.zone || "—"}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="editUser('${u.email}')">Edit</button>
            <button class="btn btn-danger btn-sm" style="margin-left:6px" onclick="deleteUser('${u.email}')">Delete</button>
          </td>
        </tr>`).join("")}
        </tbody>
      </table></div>
    </div>`;
}

function populateZoneSelect(selId, selected) {
  const sel = document.getElementById(selId);
  sel.innerHTML = `<option value="">No specific zone</option>` +
    AppState.zones.map(z => `<option value="${z.name}" ${z.name === selected ? "selected" : ""}>${z.name}</option>`).join("");
}

window.openAddUserModal = function() {
  document.getElementById("user-edit-email").value = "";
  document.getElementById("user-name").value        = "";
  document.getElementById("user-email").value       = "";
  document.getElementById("user-password").value    = "";
  document.getElementById("user-role").value        = "user";
  populateZoneSelect("user-zone-sel", null);
  document.getElementById("modal-user-title").textContent = "Add User";
  openModal("modal-add-user");
};

window.editUser = function(email) {
  const u = AppState.users.find(u => u.email === email);
  if (!u) return;
  document.getElementById("user-edit-email").value = email;
  document.getElementById("user-name").value        = u.name;
  document.getElementById("user-email").value       = u.email;
  document.getElementById("user-password").value    = "";
  document.getElementById("user-role").value        = u.role;
  populateZoneSelect("user-zone-sel", u.zone);
  document.getElementById("modal-user-title").textContent = "Edit User";
  openModal("modal-add-user");
};

document.getElementById("save-user-btn").addEventListener("click", () => {
  const editEmail = document.getElementById("user-edit-email").value;
  const name      = document.getElementById("user-name").value.trim();
  const email     = document.getElementById("user-email").value.trim().toLowerCase();
  const password  = document.getElementById("user-password").value;
  const role      = document.getElementById("user-role").value;
  const zone      = document.getElementById("user-zone-sel").value || null;

  if (!name)  return toast("Name is required", "error");
  if (!email) return toast("Email is required", "error");

  if (editEmail) {
    const idx = AppState.users.findIndex(u => u.email === editEmail);
    if (idx >= 0) {
      AppState.users[idx] = { ...AppState.users[idx], name, email, role, zone, ...(password ? { password } : {}) };
    }
  } else {
    if (!password) return toast("Password is required for new users", "error");
    if (AppState.users.find(u => u.email === email)) return toast("Email already exists", "error");
    AppState.users.push({ name, email, password, role, zone });
  }

  AppState.save(); closeModal("modal-add-user"); renderUsers(); toast("User saved");
});

window.deleteUser = function(email) {
  if (email === AppState.currentUser?.email) return toast("Cannot delete yourself", "error");
  if (!confirm("Delete this user?")) return;
  AppState.users = AppState.users.filter(u => u.email !== email);
  AppState.save(); renderUsers(); toast("User deleted");
};

// ── REPORTS ──────────────────────────────────────────────────
function renderReports() {
  const zones = AppState.zones;
  document.getElementById("reports-content").innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Reports</div></div>
      <button class="btn btn-primary btn-sm" onclick="window.print()">Export / Print</button>
    </div>
    ${zones.map(z => {
      const recs = AppState.records.filter(r => r.zoneId === z.id);
      const done = recs.filter(r => r.afterPhoto).length;
      const pct  = recs.length ? Math.round(done / recs.length * 100) : 0;
      return `<div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="card-title" style="margin-bottom:0">${z.name}</div>
          <span class="badge ${pct===100?"badge-complete":pct>50?"badge-manager":"badge-pending"}">${pct}% complete</span>
        </div>
        <div style="background:var(--bg);border-radius:4px;height:6px;margin-bottom:16px">
          <div style="height:6px;border-radius:4px;width:${pct}%;background:${pct===100?"var(--green)":"var(--accent)"}"></div>
        </div>
        ${renderRecordsTable(recs)}
      </div>`;
    }).join("")}`;
}

// ── PINGS ────────────────────────────────────────────────────
function getPingCount() {
  try { return JSON.parse(localStorage.getItem("5s_pings") || "[]").filter(p => !p.read).length; }
  catch { return 0; }
}

function renderPings() {
  let pings = [];
  try { pings = JSON.parse(localStorage.getItem("5s_pings") || "[]"); } catch {}

  document.getElementById("pings-content").innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Pings & Reminders</div></div>
      <button class="btn btn-primary btn-sm" onclick="openModal('modal-add-ping')">+ Send Ping</button>
    </div>
    <div class="card">
      ${pings.length === 0
        ? `<p style="color:var(--muted);text-align:center;padding:40px">No pings yet.</p>`
        : pings.slice().reverse().map(p => `<div class="record-card" style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <strong>${p.to}</strong>
                <span style="font-size:0.78rem;color:var(--muted);margin-left:8px">${formatDate(p.createdAt)}</span>
                ${!p.read ? `<span class="ping-dot" style="margin-left:6px"></span>` : ""}
              </div>
              ${!p.read ? `<button class="btn btn-outline btn-sm" onclick="markPingRead('${p.id}')">Mark Read</button>` : `<span style="font-size:0.75rem;color:var(--muted)">Read</span>`}
            </div>
            <div style="margin-top:8px;font-size:0.88rem">${p.message}</div>
          </div>`).join("")}
    </div>`;
}

document.getElementById("save-ping-btn").addEventListener("click", () => {
  const to      = document.getElementById("ping-to").value.trim();
  const message = document.getElementById("ping-message").value.trim();
  if (!to || !message) return toast("Fill all fields", "error");
  let pings = [];
  try { pings = JSON.parse(localStorage.getItem("5s_pings") || "[]"); } catch {}
  pings.push({ id: genId(), to, message, createdAt: new Date().toISOString(), read: false });
  localStorage.setItem("5s_pings", JSON.stringify(pings));
  document.getElementById("ping-to").value      = "";
  document.getElementById("ping-message").value = "";
  closeModal("modal-add-ping");
  buildNav(); renderPings(); toast("Ping sent");
});

window.markPingRead = function(id) {
  let pings = [];
  try { pings = JSON.parse(localStorage.getItem("5s_pings") || "[]"); } catch {}
  const p = pings.find(p => p.id === id);
  if (p) p.read = true;
  localStorage.setItem("5s_pings", JSON.stringify(pings));
  buildNav(); renderPings();
};

// ─── AUTO-INIT ────────────────────────────────────────────────
if (AppState.currentUser) initApp();
