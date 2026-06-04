const SUPABASE_URL = "https://ngrfjhtkriztzdncucrg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncmZqaHRrcml6dHpkbmN1Y3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTQ3MjcsImV4cCI6MjA5Mzk3MDcyN30.f92JGiMp3fgK9wNvJW3hYGaUutLgHJtsuwWi3biVR6U";
const USE_DEMO_MODE = true;

const DEMO_USERS = [
  { email: "admin@enpro.com",    password: "Admin@123",   role: "admin",        name: "Admin User",     zone: null },
  { email: "ceo@enpro.com",      password: "Ceo@123",     role: "ceo",          name: "CEO User",       zone: null },
  { email: "manager1@enpro.com", password: "Manager@123", role: "zone_manager", name: "Zone Manager 1", zone: "Zone A" },
  { email: "manager2@enpro.com", password: "Manager@123", role: "zone_manager", name: "Zone Manager 2", zone: "Zone B" },
  { email: "user1@enpro.com",    password: "User@123",    role: "user",         name: "Field User 1",   zone: "Zone A" },
  { email: "user2@enpro.com",    password: "User@123",    role: "user",         name: "Field User 2",   zone: "Zone B" },
];

const AppState = {
  currentUser: null,
  get zones()   { return JSON.parse(localStorage.getItem("5s_zones")   || "[]"); },
  set zones(v)  { localStorage.setItem("5s_zones",   JSON.stringify(v)); },
  get users()   { return JSON.parse(localStorage.getItem("5s_users")   || JSON.stringify(DEMO_USERS)); },
  set users(v)  { localStorage.setItem("5s_users",   JSON.stringify(v)); },
  get records() { return JSON.parse(localStorage.getItem("5s_records") || "[]"); },
  set records(v){ localStorage.setItem("5s_records", JSON.stringify(v)); },
  get pings()   { return JSON.parse(localStorage.getItem("5s_pings")   || "[]"); },
  set pings(v)  { localStorage.setItem("5s_pings",   JSON.stringify(v)); },

  save() {},

  login(email, password) {
    const u = this.users.find(u => u.email === email && u.password === password);
    if (u) { this.currentUser = u; sessionStorage.setItem("5s_session", JSON.stringify(u)); return u; }
    return null;
  },
  logout() { this.currentUser = null; sessionStorage.removeItem("5s_session"); },
  restoreSession() { const s = sessionStorage.getItem("5s_session"); if (s) this.currentUser = JSON.parse(s); },

  addPing({ to, toRole, toZone, message, type, recordId }) {
    const pings = this.pings;
    pings.push({ id: genId(), to, toRole, toZone, message, type, recordId, createdAt: new Date().toISOString(), read: false });
    this.pings = pings;
  }
};

AppState.restoreSession();

if (AppState.zones.length === 0) {
  AppState.zones = [
    { id: "z1", name: "Zone A", description: "Production Floor A" },
    { id: "z2", name: "Zone B", description: "Warehouse B" },
    { id: "z3", name: "Zone C", description: "Assembly Area" },
  ];
}

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
