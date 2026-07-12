# AssetFlow - Production Deployment Guide

AssetFlow is built to run on containerized or virtual machine environments.

## Deployment Checklist

1. **Environment Config**: Set all production keys in `.env`.
   - Ensure `NODE_ENV=production`.
   - Set high-entropy values for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
2. **Database Provisioning**: Set up a managed PostgreSQL cluster (e.g. AWS RDS, Supabase, Neon).
3. **Storage Configuration**: Configure Cloudinary cloud name, key, and secret for production file/document uploads.
4. **Prisma Generation**: Run `npm run prisma:generate` during deployment build pipelines.
5. **Build Client Bundle**: Compile React files using Vite:
   ```bash
   npm run build --workspace=client
   ```
   This generates a static bundle under `client/dist`.
6. **Serve Client Bundle**: Serve `client/dist` using Nginx or Node express static file server.
7. **Process Manager**: Run backend service using PM2 or similar tool:
   ```bash
   pm2 start server/src/index.js --name assetflow-api
   ```
