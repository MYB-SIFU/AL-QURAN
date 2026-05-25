# AL QURAN — Hosting Guide

**Author:** SIFAT · **Version:** 1.0.0

Deploy AL QURAN on Render, Railway, or Vercel in minutes.

---

## Prerequisites

- Node.js 16+
- Git repository pushed to GitHub: `https://github.com/MYB-SIFU/AL-QURAN`

---

## Option 1 — Render (Recommended)

Render offers a free tier for web services.

### Steps

1. Go to [https://render.com](https://render.com) and sign in (or create a free account).
2. Click **New → Web Service**.
3. Connect your GitHub account and select the `AL-QURAN` repository.
4. Fill in the service settings:

   | Field | Value |
   |-------|-------|
   | **Name** | `al-quran` |
   | **Environment** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | Free |

5. Click **Create Web Service**.
6. Render will build and deploy automatically. Your app will be live at `https://al-quran.onrender.com` (or similar).

### Notes
- Free tier apps sleep after 15 minutes of inactivity (first request takes ~30s to wake).
- Set the `PORT` environment variable if needed (Render sets it automatically).

---

## Option 2 — Railway

Railway provides $5 free credit per month.

### Steps

1. Go to [https://railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project → Deploy from GitHub Repo**.
3. Select the `AL-QURAN` repository.
4. Railway auto-detects Node.js and runs `npm start`.
5. Click **Settings → Networking → Generate Domain** to get a public URL.

### Environment Variables (Railway)

Go to your service → **Variables** tab and add:

```
PORT = 3000
```

Railway injects `PORT` automatically, but you can override it here.

---

## Option 3 — Vercel

Vercel is optimized for frontend + serverless APIs.

### Steps

1. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New → Project** and import the `AL-QURAN` repository.
3. Leave build settings as default (Vercel reads `vercel.json` automatically).
4. Click **Deploy**.

The included `vercel.json` routes all traffic through `server.js`:

```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

### Notes
- Vercel runs as serverless functions; the server is stateless per-request.
- Static files in `public/` are served via Express `static` middleware.
- Free tier: unlimited deployments, 100GB bandwidth/month.

---

## Option 4 — Heroku

1. Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli).
2. Run:

   ```bash
   heroku create al-quran-app
   git push heroku main
   heroku open
   ```

Heroku reads the `start` script from `package.json` automatically.

---

## Option 5 — Local / Self-Hosted VPS

```bash
# Clone the repo
git clone https://github.com/MYB-SIFU/AL-QURAN.git
cd AL-QURAN

# Install dependencies
npm install

# Run (default port 5000)
npm start

# Or with a custom port
PORT=8080 npm start
```

For production on a VPS (Ubuntu/Debian), use PM2:

```bash
npm install -g pm2
pm2 start server.js --name al-quran
pm2 save
pm2 startup
```

---

## Environment Variables Summary

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `PORT` | `5000` | No | HTTP port the server listens on |

---

## Health Check

After deployment, verify your API is working:

```bash
curl https://your-app-url.com/api
```

Expected response:
```json
{
  "status": "success",
  "message": "AL QURAN REST API v1.0.0",
  "data": { "name": "AL QURAN REST API", "version": "1.0.0", ... }
}
```

---

*بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم*
