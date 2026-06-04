// ============================================================
// SUPABASE CONFIG — replace with your actual values when ready
// ============================================================
const SUPABASE_URL = "https://ngrfjhtkriztzdncucrg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncmZqaHRrcml6dHpkbmN1Y3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTQ3MjcsImV4cCI6MjA5Mzk3MDcyN30.f92JGiMp3fgK9wNvJW3hYGaUutLgHJtsuwWi3biVR6U";

// ============================================================
// DEMO LOGINS (used when USE_DEMO_MODE = true)
// Switch to false when Supabase is connected
// ============================================================
const USE_DEMO_MODE = true;

const DEMO_USERS = [
  { email: "admin@enpro.com",   password: "Admin@123",   role: "admin",        name: "Admin User",       zone: null },
  { email: "ceo@enpro.com",     password: "Ceo@123",     role: "ceo",          name: "CEO User",         zone: null },
  { email: "manager1@enpro.com",password: "Manager@123", role: "zone_manager", name: "Zone Manager 1",   zone: "Zone A" },
  { email: "manager2@enpro.com",password: "Manager@123", role: "zone_manager", name: "Zone Manager 2",   zone: "Zone B" },
  { email: "user1@enpro.com",   password: "User@123",    role: "user",         name: "Field User 1",     zone: "Zone A" },
  { email: "user2@enpro.com",   password: "User@123",    role: "user",         name: "Field User 2",     zone: "Zone B" },
];

// App state (in-memory for demo mode)
const AppState = {
  currentUser: null,
  zones: JSON.parse(localStorage.getItem("5s_zones") || "[]"),
  users: JSON.parse(localStorage.getItem("5s_users") || JSON.stringify(DEMO_USERS)),
  records: JSON.parse(localStorage.getItem("5s_records") || "[]"),

  save() {
    localStorage.setItem("5s_zones", JSON.stringify(this.zones));
    localStorage.setItem("5s_users", JSON.stringify(this.users));
    localStorage.setItem("5s_records", JSON.stringify(this.records));
  },

  login(email, password) {
    if (USE_DEMO_MODE) {
      const u = this.users.find(u => u.email === email && u.password === password);
      if (u) { this.currentUser = u; sessionStorage.setItem("5s_session", JSON.stringify(u)); return u; }
      return null;
    }
    // TODO: Supabase auth
  },

  logout() {
    this.currentUser = null;
    sessionStorage.removeItem("5s_session");
  },

  restoreSession() {
    const s = sessionStorage.getItem("5s_session");
    if (s) this.currentUser = JSON.parse(s);
  }
};

AppState.restoreSession();

// Initialize demo zones if empty
if (AppState.zones.length === 0) {
  AppState.zones = [
    { id: "z1", name: "Zone A", description: "Production Floor A" },
    { id: "z2", name: "Zone B", description: "Warehouse B" },
    { id: "z3", name: "Zone C", description: "Assembly Area" },
  ];
  AppState.save();
}
