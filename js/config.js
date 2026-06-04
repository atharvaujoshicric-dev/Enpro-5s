const SUPABASE_URL = "https://ngrfjhtkriztzdncucrg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncmZqaHRrcml6dHpkbmN1Y3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTQ3MjcsImV4cCI6MjA5Mzk3MDcyN30.f92JGiMp3fgK9wNvJW3hYGaUutLgHJtsuwWi3biVR6U";
const USE_DEMO_MODE = true;

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

const DEFAULT_STAGES = [
  { id:"s1", name:"Sort" },
  { id:"s2", name:"Set in Order" },
  { id:"s3", name:"Shine" },
  { id:"s4", name:"Standardize" },
  { id:"s5", name:"Sustain" },
  { id:"s6", name:"Safety" },
];

const DEMO_USERS = [
  { email:"admin@enpro.com",    password:"Admin@123",   role:"admin",        name:"Admin User",     zone:null },
  { email:"ceo@enpro.com",      password:"Ceo@123",     role:"ceo",          name:"CEO User",       zone:null },
  { email:"manager1@enpro.com", password:"Manager@123", role:"zone_manager", name:"Zone Manager 1", zone:"Zone A" },
  { email:"manager2@enpro.com", password:"Manager@123", role:"zone_manager", name:"Zone Manager 2", zone:"Zone B" },
  { email:"user1@enpro.com",    password:"User@123",    role:"user",         name:"Field User 1",   zone:"Zone A" },
  { email:"user2@enpro.com",    password:"User@123",    role:"user",         name:"Field User 2",   zone:"Zone B" },
];

// localStorage-backed reactive state
const AppState = {
  currentUser: null,
  _filterZone: null,
  _statusFilter: null,

  _get(k, def) { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch(e) { return def; } },
  _set(k, v)   { localStorage.setItem(k, JSON.stringify(v)); },

  get zones()   { return this._get("5s_zones",   []); },
  set zones(v)  { this._set("5s_zones",   v); },
  get users()   { return this._get("5s_users",   DEMO_USERS); },
  set users(v)  { this._set("5s_users",   v); },
  get records() { return this._get("5s_records", []); },
  set records(v){ this._set("5s_records", v); },
  get pings()   { return this._get("5s_pings",   []); },
  set pings(v)  { this._set("5s_pings",   v); },
  get fppStages(){ return this._get("5s_fpp_stages", DEFAULT_STAGES); },
  set fppStages(v){ this._set("5s_fpp_stages", v); },

  login(email, password) {
    const u = this.users.find(u => u.email===email && u.password===password);
    if (u) { this.currentUser = u; sessionStorage.setItem("5s_sess", JSON.stringify(u)); return u; }
    return null;
  },
  logout() { this.currentUser = null; sessionStorage.removeItem("5s_sess"); },
  restoreSession() { try { const s=sessionStorage.getItem("5s_sess"); if(s) this.currentUser=JSON.parse(s); } catch(e){} },

  addPing({ to, toRole, toZone, message, type, recordId }) {
    const p = this.pings;
    p.push({ id:genId(), to, toRole, toZone:toZone||null, message, type, recordId:recordId||null,
             createdAt:new Date().toISOString(), read:false });
    this.pings = p;
  },

  updateRecord(id, changes) {
    const recs = this.records;
    const idx = recs.findIndex(r=>r.id===id);
    if (idx>=0) { recs[idx] = { ...recs[idx], ...changes }; this.records = recs; return recs[idx]; }
    return null;
  }
};

AppState.restoreSession();

// Seed zones if empty
if (!AppState.zones.length) {
  AppState.zones = [
    { id:"z1", name:"Zone A", description:"Production Floor A" },
    { id:"z2", name:"Zone B", description:"Warehouse B" },
    { id:"z3", name:"Zone C", description:"Assembly Area" },
  ];
}
