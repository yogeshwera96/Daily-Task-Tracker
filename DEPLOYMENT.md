# Deployment Guide - AI Daily Task Tracker

This repository is structured as a monorepo containing:
- `client/`: React + Vite + Tailwind CSS frontend
- `server/`: Express + TypeScript + Prisma ORM backend

---

## 🚀 Deployment Options

### Option 1: Unified Full-Stack Deployment (Recommended)
Both frontend and backend run as a single web service on platforms like **Render**, **Railway**, **Heroku**, or a **VPS / Cloud Container**. The Express server automatically serves the compiled React app from `client/dist`.

1. **Build Command**:
   ```bash
   npm install && npm run build
   ```
2. **Start Command**:
   ```bash
   npm start
   ```
3. **Database Migration**:
   ```bash
   npm run db:migrate
   # or in production:
   npx prisma migrate deploy --schema=server/prisma/schema.prisma
   ```

---

### Option 2: Split Deployment (Vercel Frontend + Render/Railway Backend)

#### A. Backend (Render / Railway)
- **Root Directory**: `server` (or run from root with `"cd server"`)
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start`
- Set `CORS_ORIGIN` to your frontend URL (e.g., `https://your-app.vercel.app`)

#### B. Frontend (Vercel / Netlify)
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variable**:
  ```env
  VITE_API_URL="https://your-backend-api.onrender.com"
  ```
- *Note*: `client/vercel.json` is already configured for React Router single-page application rewrites.

---

### Option 3: Docker Deployment

Deploy in 1 command using Docker Compose:

```bash
docker compose up -d --build
```

This starts:
- MySQL 8.0 container on port `3306` with persistent volume `db_data`
- Unified App container on port `5000`

---

## 🔑 Environment Variables Checklist

Set these environment variables in your deployment dashboard:

| Variable | Description | Example / Default |
|---|---|---|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:3306/task_tracker` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server listening port | `5000` or assigned by platform |
| `JWT_SECRET` | Secret key for access tokens | Long random string |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens | Long random string |
| `JWT_EXPIRES_IN` | Access token lifespan | `15m` |
| `JWT_REFRESH_EXPIRES_IN`| Refresh token lifespan | `7d` |
| `CORS_ORIGIN` | Allowed frontend origin | `https://your-domain.com` |
| `SMTP_HOST` | Email SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | Email SMTP port | `587` |
| `SMTP_USER` | Email username | `your-email@gmail.com` |
| `SMTP_PASS` | Email app password | `app-password` |
| `SMTP_FROM` | Sender display name & email | `AI Task Tracker <noreply@domain.com>` |
| `OPENAI_API_KEY` | OpenAI API key for EOD reports | `sk-...` |
| `OPENAI_MODEL` | OpenAI model name | `gpt-4o-mini` |
| `APP_URL` | Frontend URL for links | `https://your-domain.com` |
