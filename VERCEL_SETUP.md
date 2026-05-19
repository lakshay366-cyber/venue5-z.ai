# Vercel Deployment Checklist

## Step 1: Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub account
3. Click "Add New" → "Project"
4. Select your `venue5-z.ai` repository
5. Click "Import"

---

## Step 2: Configure Build Settings

On the "Configure Project" screen, set:

### Root Directory
- Leave blank (or set to `.` if required)

### Framework Preset
- Select: **Other** (or leave as "Other")

### Build Command
- Change from default to: `npm run build`

### Output Directory
- Change to: `dist`

### Install Command
- Keep as: `npm install`

---

## Step 3: Environment Variables

**CRITICAL:** Add your admin PIN before deploying

1. Click "Environment Variables"
2. Add new variable:
   - **Name:** `ADMIN_PIN`
   - **Value:** `your-secure-admin-pin-here` (change this to your actual PIN)
   - **Environments:** Select all (Production, Preview, Development)
3. Click "Add"

---

## Step 4: Review & Deploy

1. Review all settings match above
2. Click "Deploy"
3. Wait for build to complete
4. Check the deployment logs to verify:
   - `npm run build` ran successfully
   - Output shows: `✓ Admin PIN injected from environment`
   - Deployment shows `dist/index.html` as root

---

## Step 5: Verify Deployment

After deployment completes:

1. Open your Vercel URL
2. Click the admin lock icon
3. Enter the PIN you set in Step 3
4. ✅ If it works, deployment is correct
5. Open browser DevTools → View Page Source
6. Search for `ADMIN_PIN=` 
7. Verify it shows your actual PIN (not the placeholder)

---

## Troubleshooting

### PIN still wrong after deploy?
- Recheck Environment Variable value in Vercel settings
- Redeploy manually from Vercel dashboard
- Check deployment logs for build errors

### "Build failed" error?
- Click deployment → Logs
- Look for error messages about `build.js`
- Verify `ADMIN_PIN` env var is set

### Site shows old version?
- Clear browser cache (Ctrl+Shift+Delete)
- Or open Vercel URL in incognito window

---

## Quick Reference: Vercel Settings Summary

| Setting | Value |
|---------|-------|
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Environment Variable `ADMIN_PIN` | your-secure-pin |
| Framework | Other |

---

**Need help?** Provide a screenshot of your Vercel project settings and I can review it.
