# Vault Games

A web-based gaming platform with user accounts, leaderboards, social features, and AI chat.

## Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Express.js (Node)
- **Database**: PostgreSQL
- **Auth**: JWT
- **AI**: Google Gemini (`@google/genai`)

---

## Deploying to Render (free)

### Prerequisites
- A [Render](https://render.com) account
- This repo pushed to GitHub

### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/vault-games.git
   git push -u origin main
   ```

2. **Create a PostgreSQL database on Render**
   - Dashboard → New → PostgreSQL
   - Name: `vault-games-db`, Plan: Free
   - Copy the **Internal Connection String**

3. **Create a Web Service on Render**
   - Dashboard → New → Web Service → connect your GitHub repo
   - Root Directory: `artifacts/sigma-games`
   - Build Command: `npm install -g pnpm && pnpm install --frozen-lockfile && pnpm run build`
   - Start Command: `pnpm run serve`
   - Plan: Free

4. **Set environment variables** in the Render dashboard:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `DATABASE_URL` | *(Internal Connection String from step 2)* |
   | `SESSION_SECRET` | *(any long random string)* |
   | `AI_INTEGRATIONS_GEMINI_API_KEY` | *(your Google AI API key, optional)* |

5. Click **Deploy** — DB migrations run automatically on first boot.

### Free tier limits

| Resource | Limit |
|----------|-------|
| Web Service | Spins down after 15 min inactivity (~30s cold start) |
| PostgreSQL | 1 GB storage, **expires after 90 days** |
| Bandwidth | 100 GB/month |

> **Note**: Uploaded files (profile pictures, etc.) are stored on an ephemeral filesystem and will reset on redeploy. For persistent uploads, connect an S3 bucket or Cloudinary.

### Custom domain

Once deployed, point `vaultgames.site` to Render by adding a CNAME record in your DNS settings pointing to the URL Render gives you.

---

## Local development

```bash
# Install dependencies
pnpm install

# Create a .env file in artifacts/sigma-games/
cp artifacts/sigma-games/.env.example artifacts/sigma-games/.env
# Fill in DATABASE_URL, JWT_SECRET, etc.

# Run dev server (frontend + backend concurrently)
cd artifacts/sigma-games
pnpm run dev
```
