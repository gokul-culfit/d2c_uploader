# D2C Uploader (EBO Business Case)

Upload CSV/Excel business case data; validated rows are sent to the data platform via webhook.

---

## Local setup

- **Backend:** `cd backend && npm install && cp .env.example .env` (edit `.env` with real values).
- **Frontend:** `cd frontend && npm install`. Create `frontend/client/.env` with `VITE_GOOGLE_CLIENT_ID=...`.
- **Run:** Backend `npm run dev` from `backend/`, frontend `npm run dev` from `frontend/`.

---

## Pushing to GitHub

1. Create the repo on GitHub: [New repository](https://github.com/new). Do **not** add README / .gitignore.
2. From your machine:
   ```bash
   cd /path/to/bcase_uploader
   git init
   git add .
   git commit -m "Initial commit: D2C uploader with bcase"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```
3. In GitHub: **Settings → Secrets and variables → Actions** → add these **Secrets**:
   - `VITE_GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_ID`
   - `JWT_SECRET`
   - `DATALAKE_WEBHOOK_URL`

After every push to `main`, the workflow runs: it **builds** backend and frontend and uploads artifacts. **Deploy** to Cloud Run runs only when you add GCP config and set `DEPLOY_ENABLED` (see below).

---

## Deploy to company GCP (Cloud Run)

### 1. What to get from your company / GCP admin

Ask for **one** of the following:

**Option A – They give you a service account key and project access**

- **GCP Project ID** (e.g. `company-project-123`)
- **GCP Region** for Cloud Run (e.g. `us-central1` or `asia-south1`)
- **Service account JSON key** with:
  - **Artifact Registry Writer** (to push Docker images)
  - **Cloud Run Admin** (to deploy and update services)
- Confirmation that these are enabled for the project:
  - Artifact Registry API  
  - Cloud Run API  
- An **Artifact Registry** Docker repository named `bcase-uploader` in that region (or permission to create it).

**Option B – They do the GCP setup; you only get values for GitHub**

- **GCP Project ID**
- **GCP Region**
- **Service account JSON key** (same roles as above) – you’ll put its contents in GitHub secret `GCP_SA_KEY`.

Use this as a checklist when talking to your team:

| Item | Example | Where you use it |
|------|--------|-------------------|
| GCP Project ID | `curefit-bcase-prod` | GitHub variable `GCP_PROJECT_ID` |
| GCP Region | `asia-south1` | GitHub variable `GCP_REGION` |
| Service account JSON key (file) | Contents of the .json file | GitHub secret `GCP_SA_KEY` |

---

### 2. What you can do now (before you have GCP)

- **Develop and test locally** – Use `.env` and `frontend/client/.env`; run backend and frontend with `npm run dev`.
- **Push to GitHub** – Push to `main`; the workflow will **build** and upload artifacts. Deploy job will be skipped until `DEPLOY_ENABLED` is set.
- **Do not set** `DEPLOY_ENABLED` or **set it to `false`** – Then only build runs; no GCP needed.
- **Keep the repo and workflow as-is** – No code changes needed. When you have the three items above, add them in GitHub (step 3).

---

### 3. When you have the GCP details – add them in GitHub

1. **Secrets** (Settings → Secrets and variables → Actions → Secrets):
   - **`GCP_SA_KEY`**  
     Value: **entire contents** of the service account JSON file (copy-paste the whole file).

2. **Variables** (Settings → Secrets and variables → Actions → Variables):
   - **`GCP_PROJECT_ID`** = project ID you received  
   - **`GCP_REGION`** = region you received (e.g. `us-central1`)  
   - **`DEPLOY_ENABLED`** = `true`

3. **Artifact Registry**  
   If they didn’t create it: in GCP Console → Artifact Registry → Create repository → name `bcase-uploader`, format **Docker**, same region as above.

4. **Push to `main`**  
   The workflow will build, push images to Artifact Registry, and deploy **bcase-backend** and **bcase-frontend** to Cloud Run. Backend will get `GOOGLE_CLIENT_ID`, `JWT_SECRET`, `DATALAKE_WEBHOOK_URL` from your existing repo secrets.

---

### 4. After deploy

- **Cloud Run** → [console.cloud.google.com/run](https://console.cloud.google.com/run): you’ll see **bcase-backend** and **bcase-frontend** with URLs.
- Point users to the **frontend** URL. The frontend will call the backend URL (you may need to set the backend URL in the frontend or via env if you use a proxy).
- Backend env vars are set by the workflow from repo secrets; no need to edit them in GCP unless you want to override.

---

## Summary

| Phase | What you do |
|-------|-------------|
| **Now (no GCP yet)** | Develop locally, push to `main` (build only). Don’t set `DEPLOY_ENABLED` or set it to `false`. |
| **Request from company** | GCP Project ID, Region, service account JSON (Artifact Registry Writer + Cloud Run Admin), APIs enabled, and optionally Artifact Registry repo `bcase-uploader`. |
| **When you have them** | Add `GCP_SA_KEY` (secret), `GCP_PROJECT_ID`, `GCP_REGION`, `DEPLOY_ENABLED=true` (variables). Push to `main` to deploy. |
