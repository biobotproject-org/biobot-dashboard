# Wildfire Alarm — dashboard (biobot-dashboard)

Web dashboard for Wildfire Alarm, early wildfire detection from low-cost
sensor nodes. React 18, Vite, Tailwind, Leaflet.

Pages: Dashboard, Live Map (nodes, wind-driven spread envelopes, NASA FIRMS
hotspots, demo fire), Devices, Readings, Incidents, API Health, API Keys,
and Users (admins only).

## Run locally

```sh
npm ci
VITE_API_URL=http://localhost:3000 npm run dev
```

Needs the API from `biobot-cloud` running on port 3000. In Docker the
image is built with `VITE_API_URL=/api` and nginx proxies `/api/` to the
backend; see `biobot-infrastructure`.

## Build

```sh
npm run build   # output in dist/
npm run lint
```
