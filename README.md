# 5S Management System — Enpro Industries

## Deploy to GitHub Pages

1. Drag & drop ALL files into your GitHub repo (root = `index.html`)
2. Go to **Settings → Pages → Branch: main → / (root)** → Save
3. URL will be: `https://YOUR_USERNAME.github.io/REPO_NAME/`

---

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@enpro.com | Admin@123 |
| CEO | ceo@enpro.com | Ceo@123 |
| Zone Manager | manager1@enpro.com | Manager@123 |
| Zone Manager | manager2@enpro.com | Manager@123 |
| User | user1@enpro.com | User@123 |
| User | user2@enpro.com | User@123 |

> Demo mode stores data in localStorage (browser). Data resets if browser storage is cleared.

---

## Role Permissions

| Feature | Admin | CEO | Zone Manager | User |
|---------|-------|-----|--------------|------|
| All zones/records | ✅ | ✅ | Own zone only | Own zone only |
| Create records | ✅ | ✅ | ❌ | ✅ |
| Upload Before photo | ✅ | ❌ | ❌ | ✅ |
| Upload After photo | ✅ | ❌ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Manage zones | ✅ | ❌ | ❌ | ❌ |
| Reports | ✅ | ✅ | ❌ | ❌ |
| Send pings | ✅ | ✅ | ❌ | ❌ |

---

## Work Type Deadlines

- **FPP** — 90 days
- **WPP** — 48 hours  
- **WFP** — General (no strict deadline shown)

---

## Connect to Supabase (Future Step)

1. Open `js/config.js`
2. Set `USE_DEMO_MODE = false`
3. The `SUPABASE_URL` and `SUPABASE_ANON_KEY` are already set
4. Implement the Supabase calls in the `TODO` sections

---

## File Structure

```
index.html          ← Main app (single page)
css/style.css       ← All styles
js/config.js        ← Config + demo users + AppState
js/app.js           ← All app logic
README.md           ← This file
```
