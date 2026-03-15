# Deploy FinAgent to Google Cloud Run

This runbook deploys both services in this repository:

- `backend/` (FastAPI)
- `frontend/` (Next.js)

## 1) Prerequisites

- A Google Cloud project with billing enabled
- `gcloud` CLI installed and authenticated
- GitHub repository for this project

## 2) Enable APIs

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

## 3) Create Secret Manager secrets (backend runtime)

These map directly to backend settings in `backend/app/config.py`:

- `GEMINI_API_KEY`
- `NEWS_API_KEY` (optional)
- `ALLOWED_ORIGINS` (required in production)

Create/update examples:

```bash
echo -n "your-gemini-api-key" | gcloud secrets create GEMINI_API_KEY --data-file=-

echo -n "your-newsapi-key" | gcloud secrets create NEWS_API_KEY --data-file=-

# Comma-separated CORS origins. Include frontend Cloud Run URL and any custom domain.
echo -n "https://finagent-frontend-xxxxx-uc.a.run.app,https://yourdomain.com" | gcloud secrets create ALLOWED_ORIGINS --data-file=-
```

If secret already exists, use:

```bash
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=-
```

## 4) GitHub Actions secrets and vars

Create these in your GitHub repo settings.

### GitHub Secrets

- `GCP_PROJECT_ID`: Your GCP project ID
- `GCP_SA_KEY`: Service account JSON key with permissions for Cloud Run, Cloud Build, Artifact Registry, Secret Manager
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### GitHub Repository Variables (optional)

- `GCP_REGION` (default: `us-central1`)
- `GAR_REPOSITORY` (default: `finagent-images`)

## 5) Commit and push

The workflow file is:

- `.github/workflows/deploy-gcp-cloud-run.yml`

It runs on push to `main` and manual dispatch.

## 6) First deployment behavior

1. Builds backend Docker image and deploys `finagent-backend`
2. Reads backend URL from Cloud Run
3. Builds frontend Docker image with `NEXT_PUBLIC_API_URL=<backend-url>` and Firebase public envs
4. Deploys `finagent-frontend`

## 7) Local one-time manual deployment (optional)

If you want to deploy without GitHub Actions first:

```bash
# Backend
cd backend
gcloud run deploy finagent-backend --source . --region us-central1 --allow-unauthenticated

# Frontend (with Dockerfile in frontend/)
cd ../frontend
gcloud run deploy finagent-frontend --source . --region us-central1 --allow-unauthenticated
```

Then update backend `ALLOWED_ORIGINS` secret to include frontend URL.

## 8) Notes

- Backend CORS uses `ALLOWED_ORIGINS` from env (comma-separated), parsed in `backend/app/config.py`.
- Frontend `NEXT_PUBLIC_*` values are baked into the production bundle at build time.
- For stronger security, migrate from JSON key auth to Workload Identity Federation for GitHub Actions.
