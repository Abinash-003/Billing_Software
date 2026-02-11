# MNB Mini Mart – Deployment Guide

React (Vite) frontend + Node.js (Express) backend. Frontend deploys on **Vercel**; backend and database run elsewhere.

---

## Part 1: Push to GitHub

### 1.1 Prerequisites
- Git installed: `git --version`
- GitHub account and repo created: https://github.com/Abinash-003/Billing_Software/

### 1.2 Initialize and push (first time)

```bash
cd C:\Users\s.Abinash\Desktop\BillingSoftware

# Initialize (skip if already a git repo)
git init

# Add all files (.gitignore will exclude node_modules, .env, dist, etc.)
git add .

# First commit
git commit -m "Initial commit: MNB Mini Mart - React + Node.js Billing System"

# Add your GitHub repo as remote (use your actual URL)
git remote add origin https://github.com/Abinash-003/Billing_Software.git

# Push (main branch)
git branch -M main
git push -u origin main
```

If the repo already has content (e.g. README), you may need:

```bash
git pull origin main --allow-unrelated-histories
# Resolve any conflicts, then:
git push -u origin main
```

### 1.3 Commit structure (later updates)

- Use clear messages: `git commit -m "feat: add receive stock API"` or `fix: sidebar collapse toggle"`
- Avoid committing `.env`, `node_modules`, or `frontend/dist`.

---

## Part 2: Environment variables

### 2.1 Backend (Node.js)

Backend needs a `.env` file (never commit it). Copy from example:

```bash
cd backend
copy .env.example .env
# Edit .env with your real DB and JWT values
```

Required variables:

| Variable     | Description                    | Example                |
|-------------|--------------------------------|------------------------|
| DB_HOST     | MySQL host                     | `localhost` or DB URL  |
| DB_USER     | MySQL user                     | `root`                 |
| DB_PASSWORD | MySQL password                | your password          |
| DB_NAME     | Database name                  | `billing_software`     |
| JWT_SECRET  | Secret for JWT tokens          | long random string     |
| PORT        | Server port (optional)         | `5000`                 |

On production (Railway/Render/etc.), set these in the host’s **Environment** / **Config** and do not commit `.env`.

### 2.2 Frontend (Vite / Vercel)

Frontend only needs the API base URL. For local dev, create `frontend/.env` (optional, not committed):

```
VITE_API_URL=http://localhost:5000/api/v1
```

On **Vercel**, set in Project → Settings → Environment Variables:

| Name          | Value                              | Environment |
|---------------|------------------------------------|-------------|
| VITE_API_URL  | `https://your-backend-url.com/api/v1` | Production (and Preview if needed) |

No trailing slash. Replace `your-backend-url.com` with your real backend URL after you deploy it.

---

## Part 3: Deploy frontend on Vercel

### 3.1 Connect repo
1. Go to https://vercel.com and sign in (GitHub).
2. **Add New** → **Project**.
3. Import **Abinash-003/Billing_Software** (or your fork).

### 3.2 Project settings
- **Framework Preset:** Vite  
- **Root Directory:** `frontend` (click Edit, set to `frontend`)  
- **Build Command:** `npm run build`  
- **Output Directory:** `dist`  
- **Install Command:** `npm install`

### 3.3 Environment variables (Vercel)
- **Name:** `VITE_API_URL`  
- **Value:** Your backend API URL, e.g. `https://your-backend.railway.app/api/v1`  
- **Environment:** Production (and Preview if you use it).  
- Save.

### 3.4 Deploy
- Click **Deploy**.  
- The app uses `frontend/vercel.json` so all routes serve `index.html` (SPA).  
- After deploy, open the Vercel URL and test login/billing (they will call `VITE_API_URL`).

---

## Part 4: Backend (production)

Vercel hosts the frontend only. Run the backend elsewhere, e.g.:

- **Railway** – connect GitHub repo, set root to `backend`, add env vars, deploy.
- **Render** – Web Service, root `backend`, build: `npm install`, start: `npm start`.
- **Fly.io / Cyclic / etc.** – same idea: Node app, env vars, public URL.

Backend must:
1. Set all env vars (DB_*, JWT_SECRET, PORT).
2. Allow CORS for your Vercel domain (e.g. `https://your-app.vercel.app`).  
   In `backend/src/index.js` you already have `app.use(cors())`; for production you can restrict to your frontend origin if you want.
3. Use the same URL you set as `VITE_API_URL` in Vercel.

---

## Part 5: Checklist

- [ ] `.gitignore` in place (no `node_modules`, `.env`, `dist` committed).
- [ ] Backend `.env` from `.env.example`, never pushed.
- [ ] Frontend `VITE_API_URL` set on Vercel to backend URL.
- [ ] Vercel project root = `frontend`, build = `npm run build`, output = `dist`.
- [ ] Backend deployed and DB + JWT env vars set.
- [ ] CORS allows Vercel origin; login and API calls work from the Vercel URL.

---

## Quick reference

| Item            | Value / Command                          |
|-----------------|------------------------------------------|
| Repo            | https://github.com/Abinash-003/Billing_Software/ |
| Frontend root   | `frontend`                               |
| Build           | `npm run build` (in `frontend`)          |
| Output          | `dist`                                   |
| Frontend env    | `VITE_API_URL` = backend API base URL    |
| Backend env     | DB_*, JWT_SECRET, PORT (see .env.example)|
