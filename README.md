# D2C Uploader (EBO Business Case)

Upload CSV/Excel business case data; validated rows are sent to the data platform via webhook.

## Setup

- **Backend:** `cd backend && npm install && cp .env.example .env` (edit `.env` with real values).
- **Frontend:** `cd frontend && npm install`. Create `frontend/client/.env` with `VITE_GOOGLE_CLIENT_ID=...`.
- **Run:** Backend `npm run dev` from `backend/`, frontend `npm run dev` from `frontend/`.

## Pushing to GitHub

1. **Create the repo on GitHub**  
   [New repository](https://github.com/new). Do **not** add README / .gitignore (we have them).

2. **Initialize and push from your machine**
   ```bash
   cd /path/to/bcase_uploader
   git init
   git add .
   git commit -m "Initial commit: D2C uploader with bcase"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub username and repo name.

3. **Repository secrets**  
   In GitHub: **Settings → Secrets and variables → Actions**. Add:
   - `VITE_GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_ID`
   - `JWT_SECRET`
   - `DATALAKE_WEBHOOK_URL`

4. **After push**  
   The **Build and Deploy** workflow runs on every push to `main`. It builds backend and frontend and uploads artifacts. Add a deploy job when you have a hosting target.
