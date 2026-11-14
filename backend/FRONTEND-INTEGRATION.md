# Frontend connection — phase 2

The practices library, talks library, and their detail pages now support the Django API. Contact and volunteer forms submit directly to the backend when configured. Other imported forms retain their existing email workflow.

## Enable the connection

1. Deploy the Python backend and persistent PostgreSQL database as described in `README.md`.
2. Set backend `FRONTEND_ORIGINS` to the exact frontend HTTPS origin (no trailing slash). Cross-origin admin sessions are not required; staff log in directly at the backend `/admin/`.
3. Run `python manage.py import_hkl`, review the drafts in the admin panel, and publish the records you want visible. Newly imported practice text is now preserved, as well as talk paragraphs. Older drafts imported before this fix should have their body reviewed before publication.
4. On the frontend Render service set `NEXT_PUBLIC_HKL_API_URL` to the backend origin, for example `https://YOUR-BACKEND.onrender.com` (without `/api/v1`). This is a public URL, not a password. Rebuild/redeploy the frontend after setting it.
5. Test `/practices`, `/stories`, detail links for a newly published slug, contact submission and volunteer submission. Verify enquiries in Django admin.

With no API URL configured, the website continues using the existing JSON libraries and email-app submission workflow. With a configured URL, the API becomes authoritative for these libraries: an empty published library stays empty; errors display a retry prompt and do not resurrect archived/unpublished snapshots. Detail pages load live records without caching; metadata uses the same source. Text bodies are escaped before display. Images use durable URLs or a bundled fallback, and this phase's video player supports YouTube links.

Homepage promotional cards, conferences, publications, speaker directories and translated source pages still use their existing content. Those sections and media uploads are subsequent integration work. Newsletter forms still use HKL's existing external subscription service. No email notification is sent by the Django contact endpoints yet.

## Checks

```bash
node --import tsx --test tests/hkl-api.test.ts
npx tsc --noEmit
npm run build
cd backend
DJANGO_DEBUG=true python manage.py test
```

API tests use mocked HTTP responses; verify real deployment and browser CORS after configuring both services. `tsx` is already present in the current development dependency tree through the framework; if a minimal environment does not install it, install it as a development tool before running these tests.
