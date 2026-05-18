# VenueVault - Deployment Setup

## Environment Configuration

The admin PIN is now managed via environment variables for secure deployment.

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure your PIN** in `.env`:
   ```
   ADMIN_PIN=your-secure-pin-here
   ```

3. **Run build**:
   ```bash
   npm run build
   ```

4. **Deploy `dist/index.html`** to your server

### Deployment (Production)

1. **Set environment variable** on your hosting platform:
   - **Vercel/Netlify**: Add `ADMIN_PIN` in environment variables
   - **Traditional Server**: Export before running build:
     ```bash
     export ADMIN_PIN=your-secure-pin-here
     npm run build
     ```
   - **Docker**: Add to Dockerfile or docker-compose.yml

2. **Run build process** as part of deployment pipeline

3. **Deploy the `dist/index.html`** (never the source index.html)

### Important Security Notes

- ✅ `.env` is git-ignored and never committed
- ✅ PIN is only visible in source during build, not in final HTML
- ✅ Use a strong PIN (avoid simple sequences like "1234")
- ✅ For production, use a proper backend authentication system
- ✅ Never store sensitive data directly in frontend code

### File Structure

```
├── index.html              # Source (template with __ADMIN_PIN_PLACEHOLDER__)
├── dist/
│   └── index.html         # Built file (PIN injected, ready to deploy)
├── build.js              # Build script
├── .env                  # Local config (git-ignored)
├── .env.example          # Template for team reference
├── package.json          # Dependencies & scripts
└── .gitignore           # Prevents committing secrets
```

### Quick Start

```bash
# First time setup
npm install

# Development
npm run build    # Generate dist/index.html with PIN from .env

# Production
export ADMIN_PIN=secure-pin-123
npm run build
# Deploy dist/index.html to your server
```
