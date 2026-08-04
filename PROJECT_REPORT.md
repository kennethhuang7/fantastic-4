# NovaCart Account Dashboard — Project State Report

> **Audience:** This report is written for all team members regardless of technical background.
> Technical detail is included where needed, but every section begins with a plain-English summary.
> **Last verified against:** all source files in the repository root + official PDF documents (Problem Statement, Execution Guide, Lab Guide) from Hakkoda.

---

## Table of Contents

1. [What Are We Building?](#1-what-are-we-building)
2. [Roles & Responsibilities](#2-roles--responsibilities)
3. [Capstone Timeline](#3-capstone-timeline)
4. [How the System Works (Plain English)](#4-how-the-system-works-plain-english)
5. [Database & Data Layer](#5-database--data-layer)
6. [Architecture Diagram](#6-architecture-diagram)
7. [Tech Stack Summary](#7-tech-stack-summary)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [Local Development Commands](#9-local-development-commands)
10. [Deployment Commands](#10-deployment-commands)
11. [What Is Already Done](#11-what-is-already-done)
12. [What Still Needs to Be Implemented](#12-what-still-needs-to-be-implemented)
13. [Complete File & Folder Reference](#13-complete-file--folder-reference)
14. [Known Issues & Gotchas](#14-known-issues--gotchas)
15. [Glossary](#15-glossary)

---

## 1. What Are We Building?

**The client is NovaCart**, a growing online retailer that sells thousands of products to customers in 30+ countries. They have years of order data sitting in a database — customers, purchases, products, revenue — but no way to look at it visually or ask questions about it. Account managers are currently stuck relying on ad-hoc Excel reports emailed every Friday that are always at least a week out of date.

**Our job:** Build them a web dashboard so their account managers can log in and see:
- How much revenue was generated and when
- Which products are selling best
- Who their top customers are and where they're located

The final product is a **three-page web application** accessible from a browser:

| Page | URL | What it shows |
|------|-----|---------------|
| Orders | `/orders` | Revenue totals, monthly revenue chart, revenue by city/country chart |
| Products | `/products` | Top 10 products bar chart + product details table |
| Customers | `/customers` | Sortable table of top 20 customers by total spending |

The app has a dark/light mode toggle, a date range filter on each page, and a live indicator in the top bar showing whether the backend is connected and healthy.

**What's already built for you:** The project skeleton, database, all infrastructure, routing, styling, and the data-fetching logic in each page. **What you build:** The SQL queries that retrieve the data (backend) and the charts/tables that display it (frontend).

**Live deployed skeleton (pre-built for reference):**
`https://ntamyoub-se58322-snowflake-containers-adrianm.snowflakecomputing.app`

> ⚠️ **Before Day 1:** You will need MFA (Multi-Factor Authentication) to log into Snowflake. Download **Google Authenticator**, **Microsoft Authenticator**, or **Duo** on your phone before the capstone starts. You'll be prompted to set it up on first login — it's a one-time step.

---

## 2. Roles & Responsibilities

This capstone has two distinct roles. Each team will have both. **Both roles should read the entire Lab Guide** — the developer needs to understand what the consultant will present, and the consultant needs to understand what the developer will build.

### App Developer
Writes the actual code. Responsible for:
- **Backend:** Implement 5 API endpoints in `backend/main.py` — each one runs a SQL query and returns data as JSON
- **Frontend:** Implement the UI in the 3 page files in `frontend/src/pages/` — charts, tables, and stat cards
- **Docker images:** Build and push all three Docker images via `build-and-push.sh` on Day 4
- **API documentation:** Ensure `/docs` (Swagger UI) clearly documents every endpoint

### App Consultant
Does not write code. Responsible for:
- **Requirements Document** (end of Day 1): Define what the dashboard must do before any code is written. Used as the acceptance criteria. Must be version-controlled in GitHub.
- **Daily standup** (every morning, 15 min): Lead the three-question standup — What did I do yesterday? What am I doing today? Is anything blocking me? Help unblock the developer if needed.
- **Endpoint Validation** (Days 2–3): When the developer marks an endpoint done, test it against the requirements doc via Swagger UI. If it doesn't match, it's not done. Sign off when correct.
- **Solution Design Document** (Day 4, 1–2 pages): Architecture diagram, at least two technology decisions and trade-offs, written for a non-technical audience.
- **Client Presentation** (Day 5): Lead the final 10-minute presentation + 5-minute Q&A. Both roles speak.

> Both roles are expected to understand the project well enough to answer questions from the panel about anything — not just their own deliverables.

---

## 3. Capstone Timeline

| Day | Goal | App Developer | App Consultant |
|-----|------|---------------|----------------|
| **Day 1** | Both aligned on problem; requirements drafted | Clone repo, set up local environment, verify `http://localhost:8000/docs` loads, review `main.py` TODOs | Write the Requirements Document (all endpoints + views with acceptance criteria); align and sign off with developer by end of day |
| **Day 2** | 2 working endpoints; architecture diagram started | Implement `/franchise/summary` and `/franchise/orders` with real Snowflake data | Validate each endpoint via Swagger UI against requirements; draft architecture diagram |
| **Day 3** | All 5 endpoints working; frontend connected to API; first end-to-end data visible | Implement `/franchise/products`, `/franchise/customers`, `/franchise/cities`; wire React pages to API | Validate remaining endpoints; solution design doc at 80%; presentation outline drafted |
| **Day 4** | App deployed on SPCS; presentation rehearsed | Run `build-and-push.sh`; notify facilitator; verify deployment at public URL; fix any bugs; update README | Finish Solution Design Document; build slide deck; full 10-minute rehearsal with developer |
| **Day 5** | Deliver 10-min presentation + 5-min Q&A | Lead the live demo portion (3:00–6:00 in the presentation) | Lead presentation (problem, architecture, trade-offs, next steps); lead Q&A |

### Presentation Structure (Day 5)

| Time | Content | Who |
|------|---------|-----|
| 0:00 – 1:00 | The problem — what NovaCart account managers needed and why | App Consultant |
| 1:00 – 3:00 | The solution — architecture walkthrough with diagram | App Consultant |
| 3:00 – 6:00 | Live demo — deployed app, all three views, API docs at `/docs` | App Developer |
| 6:00 – 8:00 | Trade-offs — two decisions made, alternatives considered, honest downsides | Both |
| 8:00 – 10:00 | Next steps — what NovaCart should build next and why | App Consultant |
| 10:00 – 15:00 | Q&A — panel asks questions of both roles | Both |

---

## 4. How the System Works (Plain English)

The application is made of three pieces that talk to each other:

```
  You (browser)
      │
      │  Type a URL → see a web page
      ▼
  Frontend  (the website)
      │
      │  Requests data → receives JSON
      ▼
  Backend  (the API server)
      │
      │  Runs SQL queries → gets rows back
      ▼
  Database  (where all the order data lives)
```

**1. The Database** holds all of NovaCart's historical data — every order, every customer, every product. Locally you use a SQLite file (a single file on your laptop). In production you use Snowflake (a cloud database service).

**2. The Backend** is a Python web server (FastAPI). It receives requests from the frontend, runs SQL queries against the database, and sends the results back as JSON (a standard data format). You interact with it through URLs like `http://localhost:8000/franchise/summary`.

**3. The Frontend** is a React website. It calls the backend to fetch data, then renders it as charts and tables using a charting library called Recharts.

**4. The Router** (NGINX) only exists in production. It sits in front of everything and routes traffic — requests to `/api/...` go to the backend, all other requests go to the frontend. This means users only ever see one URL.

### In local development:
- You run the backend and frontend separately on your laptop.
- The frontend runs on port `3000`, the backend on port `8000`.
- They communicate directly.

### In production (SPCS):
- All three pieces run as Docker containers inside Snowflake's cloud infrastructure.
- The router is the only piece exposed to the internet — everything else is internal.
- The backend authenticates to Snowflake automatically (no password needed — the platform handles it).

---

## 5. Database & Data Layer

### What Kind of Database?

The project supports **two database backends**, switching automatically based on environment configuration:

| Environment | Database | Details |
|-------------|----------|---------|
| Local development | **SQLite** | A single file at `data/novacart_gold.db` on your laptop. No setup required. |
| Production (SPCS) | **Snowflake** | A cloud data warehouse. The backend connects using an OAuth token automatically provided by the SPCS platform. |

Both backends use the exact same SQL — no code changes needed to switch between them.

### What Is the "Gold Layer"?

The data in this database comes from a **Data Engineering capstone** run by a separate team. They took raw order data, cleaned it, and organised it into a structured format called a "Gold Layer" — meaning it's ready for reporting and analytics. You don't need to worry about how it was built; you just query it.

### Data Schema

The database uses a **star schema** — one central fact table (orders) connected to three dimension tables (customer details, product details, date details):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  fact_orders  (one row per order)                                           │
│  order_id · customer_id · product_id · order_date · amount · currency      │
│  status · quantity · date_key                                               │
└──────────────┬─────────────────────────────┬──────────────────┬────────────┘
               │ FK: customer_id             │ FK: product_id   │ FK: date_key
               ▼                             ▼                  ▼
┌──────────────────────────┐  ┌────────────────────────┐  ┌───────────────────┐
│  dim_customer            │  │  dim_product           │  │  dim_date         │
│  customer_id             │  │  product_id            │  │  date_key         │
│  name · email            │  │  name · category       │  │  full_date        │
│  addr_street             │  │  price · updated_at    │  │  year · quarter   │
│  addr_city · addr_state  │  └────────────────────────┘  │  month            │
│  addr_zip                │                               │  month_name       │
│  signup_date             │                               │  day_of_week      │
│  valid_from · valid_to   │                               │  is_weekend       │
│  is_current              │                               └───────────────────┘
└──────────────────────────┘
```

**Database contents (local):** ~30,000 orders · 400 customers · 15 products

### Two Important Rules for Queries

1. **Revenue filter:** Only count orders where `status IN ('delivered', 'shipped')`. Orders that were cancelled or returned should not count toward revenue.

2. **Customer dimension (SCD Type 2):** The `dim_customer` table stores a full history of changes to customer records (this is called a Slowly Changing Dimension). To get only the current/active record for each customer, always add `WHERE is_current = 1` to your query.

---

## 6. Architecture Diagram

### Local Development

```
Developer Browser (localhost:3000)
        │
        │  HTTP requests
        ▼
┌───────────────────────────────┐
│  Frontend (React 18)          │
│  localhost:3000               │
│  npm start                    │
│                               │
│  /orders    → OrdersView.js   │
│  /products  → ProductsView.js │
│  /customers → CustomersView.js│
└───────────────────────────────┘
        │
        │  CORS-enabled HTTP (localhost:8000)
        │  via src/utils/api.js
        ▼
┌───────────────────────────────┐        ┌──────────────────────────┐
│  Backend (FastAPI / Python)   │        │  SQLite Database         │
│  localhost:8000               │◄──────►│  data/novacart_gold.db   │
│  uvicorn main:app --reload    │        │  (30K orders, local dev) │
│                               │        └──────────────────────────┘
│  GET /health                  │
│  GET /authorize               │
│  GET /franchise/summary       │
│  GET /franchise/orders        │
│  GET /franchise/products      │
│  GET /franchise/customers     │
│  GET /franchise/cities        │
│  GET /docs (Swagger UI)       │
└───────────────────────────────┘
```

### SPCS (Snowflake Container Services) — Production

All three containers run inside a single **SPCS service pod** — think of it as one virtual machine in the cloud running three processes. Only the router is accessible from the internet.

```
External User (Browser)
        │
        │  HTTPS (public URL assigned by Snowflake)
        ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  SPCS Service Pod (FRONTEND_SERVICE_GROUP<N>)                            │
│  Compute Pool: NOVACART_BACKEND_POOL                                     │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │  router container  (NGINX · port 9000 — public endpoint)         │   │
│  │                                                                   │   │
│  │  /api/*  ──────── proxy_pass ────────► backend (localhost:8000)  │   │
│  │  /*      ──────── proxy_pass ────────► frontend (localhost:3000) │   │
│  └─────────────────────┬────────────────────────┬────────────────────┘   │
│                        │                        │                         │
│           ┌────────────▼───────────┐  ┌─────────▼──────────────────┐    │
│           │  backend container    │  │  frontend container        │    │
│           │  FastAPI · port 8000  │  │  NGINX serving React build │    │
│           │  DATA_BACKEND=        │  │  port 3000                 │    │
│           │    snowflake          │  └────────────────────────────┘    │
│           │  CLIENT_VALIDATION=   │                                      │
│           │    Snowflake          │                                      │
│           └──────────┬────────────┘                                      │
└──────────────────────│───────────────────────────────────────────────────┘
                       │  OAuth token auto-mounted at /snowflake/session/token
                       ▼
             ┌─────────────────────────────┐
             │  Snowflake                  │
             │  Account: VEB81086          │
             │  DB: NOVACART_DB            │
             │  Schema: APP                │
             │  Warehouse: NOVACART_APP_WH │
             │  Role: NOVACART_APP_ROLE    │
             └─────────────────────────────┘
```

### CI/CD (GitHub Actions — Facilitator Managed)

These automated workflows live in `.github/workflows/`. They are run by the facilitator, not the interns.

```
Facilitator triggers workflow manually on GitHub
        │
        ├── deploy-group.yml  ── pulls intern fork ──► builds 3 Docker images
        │                                          ──► pushes to Snowflake registry
        │                                          ──► creates SPCS service
        │                                          ──► polls until live, prints URL
        │
        ├── prewarm.yml       ── pre-caches Docker base layers (speeds up deploy)
        ├── suspend-group.yml ── pauses the running service (saves cost overnight)
        └── resume-group.yml  ── restarts a suspended service, prints URL
```

---

## 7. Tech Stack Summary

| Layer | Technology | What It Does |
|-------|-----------|--------------|
| Frontend framework | React 18.2 | Builds the interactive UI |
| Frontend routing | react-router-dom 6.21 | Handles `/orders`, `/products`, `/customers` URL navigation |
| Frontend charting | recharts 2.10 | Renders bar charts and line charts |
| Frontend build tool | react-scripts (CRA) 5.0.1 | Compiles React code into static HTML/CSS/JS |
| Frontend container | NGINX (alpine) | Serves the compiled static files in production |
| Backend framework | FastAPI 0.111.0 | Python web framework; auto-generates Swagger docs |
| Backend server | uvicorn 0.30.x | Runs the FastAPI app |
| Backend language | Python 3.11 | — |
| Database (dev) | SQLite (built-in) | Zero-config local database file |
| Database (prod) | Snowflake + connector 3.11.0 | Cloud data warehouse |
| Router | NGINX (alpine) | Reverse proxy; routes traffic in production |
| Containers | Docker (linux/amd64) | Packages each service for cloud deployment |
| Cloud platform | Snowflake SPCS | Runs Docker containers on Snowflake's infrastructure |
| CI/CD | GitHub Actions | Automates build, push, and deployment |
| Config management | python-dotenv 1.0.1 | Loads `.env` files into environment variables |

---

## 8. API Endpoints Reference

The backend exposes these URLs. In local development all requests go to `http://localhost:8000`. In production, the frontend calls `/api/...` and the router strips `/api` before forwarding to the backend.

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| `GET` | `/health` | ✅ Done | Returns service health status and database connection state |
| `GET` | `/authorize` | ✅ Done | Returns the logged-in user identity (mock `dev_user` locally; real Snowflake username in prod) |
| `GET` | `/docs` | ✅ Done | Auto-generated Swagger UI — interactive browser for all endpoints |
| `GET` | `/franchise/summary` | ❌ TODO | Total revenue, total orders, unique customers, date range of data |
| `GET` | `/franchise/orders` | ❌ TODO | Monthly order volume & revenue for a given date range |
| `GET` | `/franchise/products` | ❌ TODO | Top 10 products by revenue for a given date range |
| `GET` | `/franchise/customers` | ❌ TODO | Top 20 customers by total spending for a given date range |
| `GET` | `/franchise/cities` | ❌ TODO | Revenue broken down by city and state for a given date range |

All unimplemented endpoints currently return `HTTP 501 Not Implemented`. This is expected until you implement them.

**Date range:** All endpoints except `/franchise/summary` accept two optional query parameters: `?start=YYYY-MM-DD&end=YYYY-MM-DD`. If omitted, both default to `2022-01-01` / `2022-12-31`. `/franchise/summary` ignores date parameters — it always returns aggregate totals across the full dataset.

> ⚠️ **Lab Guide vs Starter Code discrepancy — read this:** The official Lab Guide (PDF) defines the endpoints as `GET /franchise/{franchise_id}/summary`, `GET /franchise/{franchise_id}/orders`, etc. — with a `{franchise_id}` path parameter. The actual starter code in `backend/main.py` implements them **without** that parameter: `GET /franchise/summary`, `GET /franchise/orders`, etc. The `frontend/src/utils/api.js` also calls the no-parameter versions. **Follow the starter code routes.** The Lab Guide routes represent an earlier design that was simplified. The panel may ask about this — be ready to explain it.

> ⚠️ **Lab Guide also calls the 5th endpoint `/countries`** (as in `GET /franchise/{id}/countries`). The starter code implements it as `/franchise/cities`. Again, follow the code — the `api.js` calls `getCities()` → `/franchise/cities`. Use `/cities`.

### Expected Response Shapes

These are the exact JSON formats each endpoint must return. **These shapes come from the starter code's `main.py` docstrings and from what `frontend/src/utils/api.js` and the page components expect.** The Lab Guide PDF shows different field names — follow the code, not the PDF. Differences are noted below each shape.

**`/franchise/summary`**
```json
{
  "total_revenue": 1284750.00,
  "total_orders": 8432,
  "unique_customers": 380,
  "date_range": { "start": "2022-01-01", "end": "2022-12-31" }
}
```
> 📄 *Lab Guide difference:* PDF uses `"active_customers"` (not `"unique_customers"`) and includes a `"franchise_id"` field. The code uses `unique_customers` — use that.

**`/franchise/orders`** — returns an array, one object per month
```json
[
  { "month": "2022-01", "month_name": "January", "order_count": 842, "revenue": 128450.00 },
  { "month": "2022-02", "month_name": "February", "order_count": 910, "revenue": 141230.00 }
]
```
> 📄 *Lab Guide difference:* PDF omits `"month_name"`. The frontend `OrdersView.js` uses `XAxis dataKey="month_name"` — include it.

**`/franchise/products`** — returns an array, one object per product
```json
[
  { "product_id": "P001", "name": "Wireless Headphones", "category": "Electronics",
    "units_sold": 342, "revenue": 30578.58 }
]
```
> 📄 *Lab Guide difference:* PDF uses `"product_name"` (not `"name"`). Use `"name"` — that's what the frontend expects.

**`/franchise/customers`** — returns an array, one object per customer
```json
[
  { "customer_id": "C001", "name": "Alice Johnson", "city": "Austin",
    "state": "TX", "total_orders": 14, "total_spent": 1240.50 }
]
```
> 📄 *Lab Guide difference:* PDF uses `"first_name"`, `"last_name"`, `"country"` instead of `"name"`, `"city"`, `"state"`. The frontend `CustomersView.js` sorts and renders by `name`, `city`, `state` — use those field names.

**`/franchise/cities`** — returns an array, one object per city
```json
[
  { "city": "Austin", "state": "TX", "order_count": 420, "revenue": 38430.00 }
]
```
> 📄 *Lab Guide difference:* PDF has no equivalent for this endpoint (it uses `/countries` instead). This shape is defined by the code only.

---

## 9. Local Development Commands

Run both the backend and the frontend simultaneously in two separate terminal windows.

### Backend (Terminal 1)

```bash
cd backend
cp .env.example .env          # Creates your local config — no changes needed for SQLite
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The server starts at **http://localhost:8000**

Verify it's running:
```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy","backend":"sqlite","database":{"status":"connected"}, ...}
```

Browse the interactive API docs (Swagger UI):
```
http://localhost:8000/docs
```
This lets you test every endpoint directly in the browser — no code needed. Very useful for validating your implementations.

### Frontend (Terminal 2)

```bash
cd frontend
cp .env.example .env          # Creates your local config
npm install                   # Downloads dependencies (only needed once)
npm start
# Opens at http://localhost:3000
```

> **Note on `REACT_APP_CLIENT_VALIDATION`:** The frontend `.env` has a `REACT_APP_CLIENT_VALIDATION` variable. Set it to `Dev` for local development — this disables the login flow and auto-connects as "franchise 1" (a development user). In production (SPCS), it is set to `Snowflake`, which enables the real OAuth `/authorize` flow. The `backend/.env` has a matching `CLIENT_VALIDATION` variable that must be set to the same value.

### (Optional) Connect to Snowflake Locally

If you want to test against the real Snowflake database instead of the local SQLite file, edit `backend/.env`:
```
DATA_BACKEND=snowflake
SNOWFLAKE_ACCOUNT=your_account.your_region
SNOWFLAKE_USERNAME=YOUR_USERNAME
SNOWFLAKE_ROLE=NOVACART_APP_ROLE
SNOWFLAKE_WAREHOUSE=NOVACART_APP_WH
SNOWFLAKE_DATABASE=NOVACART_DB
SNOWFLAKE_SCHEMA=APP
SNOWFLAKE_PRIVATE_KEY_PATH=/path/to/rsa_key.p8
PORT=8000
```

Generate a keypair (required for Snowflake authentication):
```bash
openssl genrsa 2048 | openssl pkcs8 -topk8 -inform PEM -out rsa_key.p8 -nocrypt
```

---

## 10. Deployment Commands

### Day 4 — Build & Push to SPCS

When your endpoints and UI are working locally, on Day 4 you package everything into Docker containers and push them to Snowflake.

**Prerequisites:**
- Docker Desktop must be running
- Snowflake CLI must be installed: `pip3 install snowflake-cli-labs`
- A `snow` connection named `spcs` must be configured and working (ask your facilitator) — the script immediately runs `snow spcs image-registry login --connection spcs` as its first step; if this fails, the entire script aborts before any images are built

```bash
# Values provided by your facilitator
export REPO_URL=<your_image_repo_url>   # find with: SHOW IMAGE REPOSITORIES;
export GROUP=<your_team_number>         # e.g. 1, 2, 3...

bash build-and-push.sh
```

The script builds and pushes all three images tagged as `latest`. After this completes, notify your facilitator. They will run the `deploy-group` GitHub Actions workflow to create your SPCS service and give you the public URL.

### Facilitator-Only Workflows (GitHub Actions)

| Workflow | When Run | What It Does |
|----------|----------|--------------|
| `deploy-group.yml` | After interns push | Requires two inputs: `group_number` and the intern's `fork_url`. Builds backend + frontend from the intern's fork, router from the canonical starter repo, pushes all to Snowflake registry, creates the live SPCS service. |
| `prewarm.yml` | Before capstone starts | Pre-caches Docker base layers to speed up later deployments |
| `suspend-group.yml` | End of day | Pauses the running service to save compute costs |
| `resume-group.yml` | Start of day | Restarts the service and outputs the public URL |

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| `501 Not implemented` on any `/franchise/` endpoint | Expected — that's the endpoint you need to implement |
| Backend can't find the database file | Make sure you're running `uvicorn` from inside the `backend/` directory, not the project root |
| CORS error in the browser console | Make sure `CLIENT_VALIDATION=Dev` is set in `backend/.env` and `REACT_APP_CLIENT_VALIDATION=Dev` in `frontend/.env` |
| Frontend opens on port 3001 instead of 3000 | Something else is already using port 3000. The backend CORS middleware allows `localhost:3001` as well as `3000`, so this is fine — just update `REACT_APP_BACKEND_URL` if needed |
| `snow` command not found | `pip3 install snowflake-cli-labs` then `export PATH="$HOME/Library/Python/3.9/bin:$PATH"` |
| Docker build fails on frontend | Missing `frontend/nginx.conf` — see Section 14 (Known Issues) |
| Docker build fails (other) | Add `--no-cache` flag: `docker build --no-cache --platform linux/amd64 ...` |

### Checking Service Logs After Deployment

If something is broken after deployment, check the container logs directly in Snowsight:

```sql
-- Check backend container logs (last 50 lines)
CALL SYSTEM$GET_SERVICE_LOGS('FRONTEND_SERVICE_GROUP<N>', '0', 'backend', 50);

-- Check frontend container logs
CALL SYSTEM$GET_SERVICE_LOGS('FRONTEND_SERVICE_GROUP<N>', '0', 'frontend', 50);

-- Verify images are in the registry
CALL SYSTEM$REGISTRY_LIST_IMAGES('/<db>/app/<repo>');

-- Check what services exist and their status
SHOW SERVICES;

-- Get your service's public URL
SHOW ENDPOINTS IN SERVICE FRONTEND_SERVICE_GROUP<N>;
```

Common post-deployment issues: wrong environment variable names, CORS errors if `CLIENT_VALIDATION` is missing, `bcrypt` ELF format error (ensure `.dockerignore` excludes compiled binaries).

---

## 11. What Is Already Done

Everything listed here is complete and working. **Do not modify these files.**

### Infrastructure (fully hands-off)
- ✅ **`backend/connection.py`** — Database connection layer that automatically switches between SQLite (local) and Snowflake (production). You call `get_connection()` and `execute_query()` in your endpoint code without worrying about the underlying database.
- ✅ **`router/`** — The NGINX reverse proxy. Handles URL routing in production. No changes needed.
- ✅ **`build-and-push.sh`** — The deployment script. Run it once on Day 4.
- ✅ **All four GitHub Actions workflows** — Managed by the facilitator.
- ✅ **`data/novacart_gold.db`** — The pre-populated local database.

### Frontend Shell (fully hands-off)
- ✅ **`frontend/src/utils/api.js`** — All API call functions are already written. Your page code just calls `getOrders()`, `getProducts()`, etc.
- ✅ **`frontend/src/utils/ThemeContext.js`** — Dark/light mode toggle logic.
- ✅ **`frontend/src/components/Navbar.js`** — The top navigation bar.
- ✅ **`frontend/src/components/ServiceStatus.js`** — The live health indicator dot in the navbar.
- ✅ **`frontend/src/App.js`** — Router and page layout.
- ✅ **`frontend/src/App.css`** — All CSS and theme variables. CSS classes ready to use: `.card`, `.stat-box`, `.stat-row`, `.filter-bar`, `.grid-2`, `.loading`, `.page`, `.section-title`, `.btn-apply`.
- ✅ **`frontend/package.json`** — All npm dependencies pre-declared (React, Recharts, React Router).

### Page Scaffolding (data-fetching done; UI is your work)
All three page files already handle: fetching data from the API, showing a loading spinner, showing an error message if the API call fails, and rendering the date range filter bar. The only missing piece is the actual chart/table inside the page.

- ✅ `OrdersView.js` — data fetching, loading/error states, filter bar
- ✅ `ProductsView.js` — data fetching, loading/error states, filter bar
- ✅ `CustomersView.js` — data fetching, loading/error states, filter bar, **full column sort logic already implemented**

---

## 12. What Still Needs to Be Implemented

### Official Requirements Checklist (from Lab Guide)

Use this on Day 4 to confirm you've met every requirement before presenting:

**API Requirements**
- [ ] `API-01` FastAPI with Python 3.11+
- [ ] `API-02` Snowflake connection via environment variables — no hardcoded credentials
- [ ] `API-03` SPCS OAuth via `/snowflake/session/token` (automatic — already in `connection.py`)
- [ ] `API-04` Swagger docs at `/docs` — every endpoint documented
- [ ] `API-05` `/health` endpoint working
- [ ] `API-06` All error responses return JSON with a message and HTTP status code
- [ ] `—` `GET /franchise/summary` implemented
- [ ] `—` `GET /franchise/orders` implemented
- [ ] `—` `GET /franchise/products` implemented
- [ ] `—` `GET /franchise/customers` implemented
- [ ] `—` `GET /franchise/cities` implemented

**Frontend Requirements**
- [ ] `FE-01` React 18
- [ ] `FE-02` All API calls routed via `/api/*` (already wired in `api.js`)
- [ ] `FE-03` SPCS OAuth flow working (already wired via `/authorize`)
- [ ] `FE-04` Loading states and error handling (already done in scaffolding)
- [ ] `FE-05` Navbar with service status indicator (already done)
- [ ] `FE-06` Dark mode toggle (already done)
- [ ] `—` View 1: Orders Overview — stat cards, monthly chart, city/country chart
- [ ] `—` View 2: Product Performance — top products chart, product details table
- [ ] `—` View 3: Customer List — sortable table

**Deployment Requirements**
- [ ] `DEP-01` Backend Docker image built for `linux/amd64`
- [ ] `DEP-02` Frontend Docker image built for `linux/amd64`
- [ ] `DEP-03` NGINX router image routing `/api/*` to backend
- [ ] `DEP-04` All 3 images pushed to Snowflake Image Repository via `build-and-push.sh`
- [ ] `DEP-05` README updated with deployment instructions

**App Consultant Requirements**
- [ ] `CON-01` Requirements document signed off by developer before Day 2
- [ ] `CON-02` Requirements document covers every endpoint and view with acceptance criteria
- [ ] `CON-03` Requirements document committed to the GitHub repository
- [ ] `CON-04` Solution Design Document completed by Day 4 (1–2 pages)
- [ ] `CON-05` Architecture diagram in the Solution Design Document
- [ ] `CON-06` At least two technology decisions with trade-offs explained
- [ ] `CON-07` Solution Design Document written for a non-technical audience
- [ ] `CON-08` Presentation is 10 min + 5 min Q&A
- [ ] `CON-09` Both roles have speaking parts
- [ ] `CON-10` Live demo of the deployed application included
- [ ] `CON-11` Presentation covers: problem, solution, architecture, two trade-offs, next steps

**Stretch Goals (if time allows)**
- [ ] 6th endpoint: `GET /franchise/customers/{customer_id}/history` — full order and address history for a specific customer (SCD Type 2 data from `dim_customer`)
- [ ] 4th frontend view: Customer detail page — clicking a customer in the list opens their full order history

---

### Implementation Checklist (Quick Reference)

| # | Task | Role | File |
|---|------|------|------|
| 1 | `/franchise/summary` endpoint | App Developer | `backend/main.py` |
| 2 | `/franchise/orders` endpoint | App Developer | `backend/main.py` |
| 3 | `/franchise/products` endpoint | App Developer | `backend/main.py` |
| 4 | `/franchise/customers` endpoint | App Developer | `backend/main.py` |
| 5 | `/franchise/cities` endpoint | App Developer | `backend/main.py` |
| 6 | Orders page — stat cards | App Developer | `frontend/src/pages/OrdersView.js` |
| 7 | Orders page — monthly revenue chart | App Developer | `frontend/src/pages/OrdersView.js` |
| 8 | Orders page — revenue by city chart | App Developer | `frontend/src/pages/OrdersView.js` |
| 9 | Products page — top products bar chart | App Developer | `frontend/src/pages/ProductsView.js` |
| 10 | Products page — product details table | App Developer | `frontend/src/pages/ProductsView.js` |
| 11 | Customers page — sortable customers table | App Developer | `frontend/src/pages/CustomersView.js` |
| 12 | Requirements Document (in GitHub) | App Consultant | — |
| 13 | Endpoint validation (sign off each of #1–5) | App Consultant | — |
| 14 | Solution Design Document | App Consultant | — |
| 15 | Client presentation | App Consultant | — |

---

### Backend Detail — `backend/main.py`

Each of the 5 endpoints has a stub that raises `HTTP 501`. Open `main.py` and replace the `raise HTTPException(status_code=501, ...)` line with a SQL query and a return value.

The helper functions are already there — you only need to write the SQL:
```python
conn    = get_connection()                          # get a DB connection
results = execute_query(conn, "YOUR SQL HERE")      # run query, returns list of dicts
return results[0]                                   # or return the full list
```

> **SQLite vs Snowflake parameter syntax:** The `execute_query` docstring in `connection.py` specifies that SQLite uses `?` and Snowflake uses `%s` as the query parameter placeholder. Since you develop locally against SQLite, write your queries with `?`. If your query takes no parameters (hardcoded SQL), this distinction doesn't matter at all.

> **Revenue filter applies to all endpoints:** Every endpoint that returns a revenue figure must filter `WHERE status IN ('delivered', 'shipped')`. The `/orders` endpoint hints in the code explicitly state this too.

| Endpoint | Takes date params? | What SQL must do |
|----------|--------------------|-----------------|
| `GET /franchise/summary` | ❌ No | Query `fact_orders`, filter `status IN ('delivered','shipped')`, return COUNT of orders, SUM of amount, COUNT DISTINCT customers, MIN/MAX of order_date |
| `GET /franchise/orders` | ✅ Yes (`start`, `end`) | JOIN `fact_orders` + `dim_date` on `date_key`, GROUP BY year/month/month_name, filter `status IN ('delivered','shipped')` and `order_date` between start and end, return monthly totals |
| `GET /franchise/products` | ✅ Yes (`start`, `end`) | JOIN `fact_orders` + `dim_product` on `product_id`, filter `status IN ('delivered','shipped')`, GROUP BY product, return top 10 by revenue |
| `GET /franchise/customers` | ✅ Yes (`start`, `end`) | JOIN `fact_orders` + `dim_customer` on `customer_id` (filter `is_current=1`), filter `status IN ('delivered','shipped')`, GROUP BY customer, return top 20 by spending |
| `GET /franchise/cities` | ✅ Yes (`start`, `end`) | JOIN `fact_orders` + `dim_customer` (filter `is_current=1`), filter `status IN ('delivered','shipped')`, GROUP BY addr_city/addr_state, return all cities ordered by revenue |

> **Hint:** `main.py` contains commented-out SQL for the `/summary` endpoint — read those for a pattern to follow.

> **Note on the file header comment:** The comment block at the top of `main.py` shows routes as `/franchise/{id}/summary` (with a `{id}` parameter), but the actual route decorators in the code are `/franchise/summary` (no `{id}`). Follow the actual route decorators — the comment block is outdated.

---

### Frontend Detail — `frontend/src/pages/`

Each page already has the data loaded into a variable. You just need to render it.

**`OrdersView.js`** — data is in: `summary`, `orders`, `cities`

1. **Stat cards** — the three `.stat-box` divs already exist with `TODO` placeholders. Replace the `TODO` text with the real values:
   - `summary.total_revenue` (format as currency)
   - `summary.total_orders`
   - `summary.unique_customers`

2. **Monthly revenue chart** — add a `<BarChart>` (or `<LineChart>`) from Recharts inside the existing card. Use `orders` as the data array. Set `XAxis dataKey="month_name"` and `Bar dataKey="revenue"`. Also available: `CartesianGrid` for gridlines.

3. **Revenue by city chart** — add a horizontal `<BarChart layout="vertical">`. Use `cities.slice(0, 10)` to show only the top 10.

---

**`ProductsView.js`** — data is in: `products`

1. **Top products bar chart** — horizontal `<BarChart layout="vertical">`. Use `products` as data. Set `XAxis type="number"` and `YAxis type="category" dataKey="name"`. Truncate long product names to 20 characters to avoid overflow.

2. **Products table** — HTML `<table>` with columns: Name · Category · Units Sold · Revenue. Use the `formatCurrency()` function already defined at the top of the file.

---

**`CustomersView.js`** — data is in: `sorted` (pre-sorted array, ready to render)

1. **Sortable customers table** — HTML `<table>` with `<thead>` and `<tbody>`. Columns: Name · City · State · Orders · Total Spent.
   - Each column header should call `handleSort(columnName)` on click
   - Use `sortIcon(columnName)` to show ↑ or ↓ on the active sort column
   - Alternate row background colours
   - Format `total_spent` with `formatCurrency()`

> **Note:** The comment at the top of `CustomersView.js` says "Your job: implement the UI and the sorting logic" — this is outdated. The sort logic (`handleSort`, `sortDir`, `sortBy`, `sortIcon`, the `sorted` array) is **already fully implemented** in the scaffold. You only need to build the table JSX that uses them.

---

### App Consultant Deliverables

- [ ] **Requirements Document** — due end of Day 1. Written before any code. Defines what the dashboard must show, how it should behave, and what counts as "done" for each feature. Must be committed to the GitHub repo (requirement `CON-03`).
- [ ] **Endpoint validation** — as the developer completes each backend endpoint, test it via Swagger UI (`/docs`) and confirm it matches the requirements doc. If it doesn't match, it is not done. Sign it off.
- [ ] **Solution Design Document** — due Day 4, 1–2 pages. Must include: architecture diagram, at least two technology decisions with trade-offs, and be written so a non-technical NovaCart account manager can understand the summary section.
- [ ] **Client presentation** — Day 5. 10 minutes + 5 minutes Q&A. Both roles speak. Covers: the problem, solution, architecture walkthrough, two trade-offs, and recommended next steps for NovaCart.

---

## 13. Complete File & Folder Reference

> `.git/` (git internals) and `backend/venv/` (local Python packages) are excluded — they are auto-generated and not part of the project source.

| Path | Type | Description |
|------|------|-------------|
| `README.md` | File | Original project overview from the capstone facilitators — quick start, schema reference, deployment instructions |
| `PROJECT_REPORT.md` | File | This report |
| `AppDev Problem Statement.pdf` | File | Official Hakkoda capstone problem statement. Describes the business context (NovaCart account managers, Excel reports, etc.), the live app URL, MFA setup instructions, and what the final deliverable must include. |
| `AppDev Execution Guide.pdf` | File | Official Hakkoda day-by-day execution guide. Contains step-by-step instructions for both roles across all 5 days, the presentation time breakdown, and a facilitator reference section with SPCS service SQL. |
| `AppDev Lab Guide.pdf` | File | Official Hakkoda lab guide. Defines all formal requirements with IDs (API-01 through CON-11), acceptance criteria for every endpoint and frontend view, Docker/deployment requirements, and the full pre-presentation checklist. |
| `build-and-push.sh` | File | Shell script that builds all 3 Docker images and pushes them to the Snowflake image registry. Run on Day 4. |
| `.gitignore` | File | Tells git which files to ignore. Excludes `.env` files, private keys, `node_modules/`, build artifacts, and virtual envs. |
| **`backend/`** | Dir | Python FastAPI backend — the API server |
| `backend/main.py` | File | ⭐ **Primary implementation target.** FastAPI app definition. Contains 5 endpoint stubs marked TODO, plus working `/health` and `/authorize` endpoints. |
| `backend/connection.py` | File | Database abstraction. `get_connection()` returns either a SQLite or Snowflake connection based on `DATA_BACKEND` env var. `execute_query()` runs SQL and returns results as a list of dictionaries. In SPCS mode, also reads `SNOWFLAKE_HOST` (injected automatically by the platform — not needed in `.env`). Do not modify. |
| `backend/requirements.txt` | File | Python package list. Installs FastAPI, uvicorn, Snowflake connector, and python-dotenv. |
| `backend/Dockerfile` | File | Instructions to package the backend as a Docker container. Uses Python 3.11-slim, installs packages, starts uvicorn bound to `0.0.0.0:8000` (standard for Docker containers — the host binding is intentional here). |
| `backend/.env.example` | File | Template for the required environment variables. Copy to `.env` before running. |
| `backend/.dockerignore` | File | Prevents sensitive files (`.env`, private keys) and compiled files from being bundled into the Docker image. |
| `backend/venv/` | Dir | Local Python virtual environment. Auto-generated, excluded from git. Not part of the project source. |
| **`frontend/`** | Dir | React 18 single-page application — the web dashboard |
| `frontend/Dockerfile` | File | Two-stage Docker build: Stage 1 (Node 18-slim) compiles the React app; Stage 2 (NGINX alpine) serves the compiled static files on port 3000. **Note:** the default `ARG REACT_APP_CLIENT_VALIDATION=Snowflake` means a plain `docker build` without extra arguments produces a production build (Snowflake mode). For a local dev Docker build you would need `--build-arg REACT_APP_CLIENT_VALIDATION=Dev`. This does not affect `npm start`. |
| `frontend/.env.example` | File | Template frontend config. Sets `REACT_APP_BACKEND_URL` (points to backend) and `REACT_APP_CLIENT_VALIDATION` (Dev or Snowflake). Copy to `.env`. |
| `frontend/package.json` | File | Node.js package manifest. Declares all npm dependencies and the `start`/`build` scripts. |
| `frontend/nginx.conf` | File | ⚠️ **Missing from repo.** Required by `frontend/Dockerfile` for the Docker build. Does not exist as a tracked file — see Section 14 (Known Issues) for details and a working example. |
| `frontend/src/` | Dir | All React source code |
| `frontend/src/index.js` | File | Entry point. Mounts the `<App />` component into the HTML page. |
| `frontend/src/App.js` | File | Root component. Sets up the theme provider and URL routing. `/` and any unrecognised URL redirect to `/orders`. Routes: `/orders` → `OrdersView`, `/products` → `ProductsView`, `/customers` → `CustomersView`. |
| `frontend/src/App.css` | File | Global CSS. Defines the colour theme using CSS variables (supports light and dark mode), and utility layout classes: `.card`, `.stat-box`, `.stat-row`, `.filter-bar`, `.grid-2`, `.loading`, `.page`, `.section-title`, `.btn-apply`. |
| `frontend/src/pages/` | Dir | The three main dashboard pages — primary implementation target |
| `frontend/src/pages/OrdersView.js` | File | ⭐ **TODO.** Orders & Revenue dashboard page. Data fetching is done. Needs: stat cards, monthly revenue bar chart, revenue by city bar chart. |
| `frontend/src/pages/ProductsView.js` | File | ⭐ **TODO.** Products performance page. Data fetching is done. Needs: horizontal bar chart of top 10 products, product details table. |
| `frontend/src/pages/CustomersView.js` | File | ⭐ **TODO.** Top customers page. Data fetching and sort logic are done. Needs: sortable HTML table. |
| `frontend/src/components/` | Dir | Reusable UI components — do not modify |
| `frontend/src/components/Navbar.js` | File | Top navigation bar. Shows the NovaCart logo, three nav links with active highlighting, the service status indicator, and the dark/light mode toggle. |
| `frontend/src/components/ServiceStatus.js` | File | Coloured dot indicator in the navbar. Polls `/health` every 30 seconds. Four states: grey (checking), green (healthy), yellow (degraded), red (offline). |
| `frontend/src/utils/` | Dir | Shared utility modules — do not modify |
| `frontend/src/utils/api.js` | File | Central API client. All HTTP calls go through `apiFetch()`. Exports named functions: `getHealth`, `authorize`, `getSummary`, `getOrders`, `getProducts`, `getCustomers`, `getCities`. |
| `frontend/src/utils/ThemeContext.js` | File | React context for dark/light mode. `ThemeProvider` wraps the app in `App.js` and sets a `data-theme` attribute on `<html>`. `useTheme()` is consumed by `Navbar.js` to read the current theme and toggle it. Preference is persisted to `localStorage` under the key `nc-theme`. |
| **`router/`** | Dir | NGINX reverse proxy — do not modify |
| `router/Dockerfile` | File | Builds NGINX alpine image. On startup, fills in `FRONTEND_SERVICE` and `BACKEND_SERVICE` placeholders in the config template using environment variables. Note: the file says `EXPOSE 8000` but the router actually listens on port 9000 — `EXPOSE` is documentation only and does not change the actual port. |
| `router/nginx.conf.template` | File | NGINX routing rules. `/api/*` → backend (strips `/api` prefix), `/*` → frontend. Listens on port 9000 (the SPCS public endpoint). |
| **`data/`** | Dir | Local development data |
| `data/novacart_gold.db` | File | SQLite database pre-populated with ~30,000 orders, 400 customers, 15 products. Used only for local development. |
| **`.github/`** | Dir | GitHub configuration |
| `.github/workflows/` | Dir | GitHub Actions CI/CD workflow definitions |
| `.github/workflows/deploy-group.yml` | File | **Facilitator workflow.** Manually triggered. Checks out the intern's GitHub fork, builds all 3 Docker images, pushes to Snowflake registry, creates or recreates the SPCS service, then polls until live and prints the public URL. |
| `.github/workflows/prewarm.yml` | File | **Facilitator workflow.** Builds and pushes the unmodified starter images to pre-warm the Snowflake registry cache before the capstone begins, so later deployments are faster. |
| `.github/workflows/suspend-group.yml` | File | **Facilitator workflow.** Suspends a group's running SPCS service to save compute costs (e.g., overnight). |
| `.github/workflows/resume-group.yml` | File | **Facilitator workflow.** Resumes a suspended SPCS service and outputs the public URL. |
| `.github/scripts/` | Dir | Helper scripts used by CI workflows |
| `.github/scripts/get_url.py` | File | Python script used by `deploy-group.yml` and `resume-group.yml`. Parses the JSON output of `SHOW ENDPOINTS IN SERVICE` and extracts the public ingress URL once provisioning is complete. |

---

## 14. Known Issues & Gotchas

These are things discovered during the analysis of this project that could cause confusion or errors. Be aware of them before you start.

### `frontend/nginx.conf` is missing from the repository

The `frontend/Dockerfile` includes this line:
```dockerfile
COPY nginx.conf /etc/nginx/conf.d/default.conf
```
However, `frontend/nginx.conf` **does not exist as a tracked file** in the repository. This means running `docker build` on the frontend directory will fail with a "file not found" error.

**Who this affects:**
- `npm start` (local development) — **unaffected**, it doesn't use Docker
- `docker build ./frontend` run manually by a developer — **will fail**
- Facilitator's `deploy-group.yml` workflow — **will fail** when building from the intern fork unless the file is created first
- Facilitator's `prewarm.yml` workflow — **will also fail** since it runs `docker build ./frontend` directly from the starter repo itself

**Resolution:** Before running `docker build` on the frontend, create `frontend/nginx.conf` with appropriate NGINX static-file serving config, or ask your facilitator if they have a standard version to provide. A minimal working example:
```nginx
server {
    listen 3000;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri /index.html;
    }
}
```

---

### The Lab Guide and `main.py` header comment both show outdated route paths with `{franchise_id}`

The official **Lab Guide PDF** defines all endpoints as:
```
GET /franchise/{franchise_id}/summary
GET /franchise/{franchise_id}/orders
...
```
The docstring at the top of `backend/main.py` also shows:
```
GET /franchise/{id}/summary
GET /franchise/{id}/orders
...
```
The actual route decorators in the code are:
```
GET /franchise/summary
GET /franchise/orders
...
```
**There is no `{id}` parameter in the starter code.** Both the Lab Guide and the comment block reflect an earlier design. The frontend `api.js` was also built without this parameter. **Always follow the actual `@app.get(...)` decorators in the code.** Be prepared to explain this discrepancy during the Q&A — the panel may ask about it.

---

### The Lab Guide calls the 5th endpoint `/countries`; the starter code uses `/cities`

The Lab Guide defines the 5th endpoint as `GET /franchise/{franchise_id}/countries`. The starter code implements it as `GET /franchise/cities`. The frontend `api.js` calls `getCities()` → `/franchise/cities`. **Use `/cities`.** The underlying data (from `dim_customer.addr_city` / `addr_state`) is US city/state data, not country-level data. The Lab Guide name is from the earlier design which used international data.

---

### `execute_query` parameter placeholder differs by backend

As documented in `backend/connection.py`, the placeholder character for parameterised SQL queries is different depending on which database you're connected to:
- SQLite → use `?`
- Snowflake → use `%s`

Since local development always uses SQLite, write `?` in your queries. If you are passing no parameters (hardcoded SQL with no user input), this is irrelevant.

---

### Default date range is hardcoded to 2022

All five endpoints default to `start=2022-01-01` and `end=2022-12-31` if no date parameters are provided. The local SQLite database only contains data from 2022, so this is correct for local development. In production on Snowflake, the actual date range of data may differ.

---

### Execution Guide code snippet imports `snowflake_connection` — the actual file is `connection.py`

The Execution Guide (PDF) includes a code example showing:
```python
from snowflake_connection import get_connection
```
The actual file in the starter repo is named **`connection.py`**, not `snowflake_connection.py`. If you copy this snippet directly, you will get an `ImportError`. The correct import (already in `main.py`) is:
```python
from connection import get_connection, execute_query
```

---

### Execution Guide says to build `/health` on Day 2 — it's already implemented

The Execution Guide tells developers to start with `/health` and `/franchise/{id}/summary` on Day 2. In the actual starter code, `/health` is **already fully implemented** and working. You do not need to build it — only implement the 5 `TODO` endpoints in `main.py`.

---

### `suspend-group.yml` and `resume-group.yml` reference different service names than `deploy-group.yml`

`deploy-group.yml` creates a single unified service named `FRONTEND_SERVICE_GROUP<N>`. However, the `suspend` and `resume` workflows target **two separate names**: `backend_service_group<N>` and `frontend_service_group<N>` (lowercase, separate). These names do not match the service that was created. This means the suspend/resume workflows may silently do nothing (`IF EXISTS` prevents an error).

**Who this affects:** Facilitators managing cost (suspend/resume). Interns are not expected to run these workflows. If the facilitator needs to suspend or resume a group, they should verify the actual service name using `SHOW SERVICES` in Snowflake.

---

## 15. Glossary

Terms used in this project that may be unfamiliar. See also Section 14 for practical gotchas.

| Term | Plain-English Definition |
|------|--------------------------|
| **API** | Application Programming Interface. A set of URLs that a server exposes so other software can request data from it. In this project, the backend API is how the frontend gets its data. |
| **FastAPI** | A Python framework for building APIs. It automatically generates interactive documentation (Swagger UI) at `/docs`. |
| **React** | A JavaScript library for building web user interfaces. Components are small, reusable pieces of UI. |
| **Recharts** | A charting library for React. Makes it easy to add bar charts, line charts, etc. |
| **JSON** | JavaScript Object Notation. A standard text format for sending structured data between a server and a browser. Looks like `{"key": "value"}`. |
| **SQLite** | A lightweight database that stores everything in a single file. No server required. Perfect for local development. |
| **Snowflake** | A cloud-based data warehouse (database service). Stores large amounts of data and can be queried with SQL. |
| **SPCS** | Snowflake Container Services. Snowflake's platform for running Docker containers in the cloud — similar to AWS ECS or Google Cloud Run, but inside Snowflake. |
| **Docker** | A tool that packages an application and all its dependencies into a portable "container" that runs the same way on any machine. |
| **Docker image** | A blueprint for a container. A running instance of an image is a container. |
| **NGINX** | A high-performance web server. Used here both to serve the compiled React app and as the reverse proxy router. |
| **Reverse proxy** | A server that sits in front of other servers and routes incoming requests to the right destination. In this project, NGINX routes `/api/...` to the backend and everything else to the frontend. |
| **CORS** | Cross-Origin Resource Sharing. A browser security rule that blocks a web page from calling an API on a different domain/port. In local dev, the backend explicitly allows calls from `localhost:3000`. |
| **OAuth** | An authentication protocol. In SPCS, Snowflake automatically handles user login and passes the logged-in user's identity to the backend via a token — no password management needed in the code. |
| **Swagger UI** | An auto-generated interactive documentation page for APIs. Available at `http://localhost:8000/docs`. Lets you test API endpoints directly in the browser. |
| **Star schema** | A database design pattern for analytics. One central fact table (orders) connects to several dimension tables (customers, products, dates) via foreign keys. |
| **Gold Layer** | In data engineering, data pipelines are typically split into Bronze (raw), Silver (cleaned), and Gold (ready for reporting) layers. The Gold Layer is the final, analytics-ready data. |
| **SCD Type 2** | Slowly Changing Dimension Type 2. A technique where instead of overwriting a record when it changes, a new row is added. The `dim_customer` table uses this, so always filter `WHERE is_current = 1` for current records. |
| **Environment variable** | A configuration value stored outside the code (in a `.env` file or the OS environment) so sensitive values like database credentials are never hardcoded. |
| **GitHub Actions** | A CI/CD (automated build/deploy) service built into GitHub. Workflows run automatically or on-demand. |
| **Compute pool** | In SPCS, the group of virtual machines that runs your containers. `NOVACART_BACKEND_POOL` is the pre-provisioned pool for this capstone. |
| **Ingress URL** | The public internet address assigned to a running SPCS service — the URL you give to end users. |

---

*Report generated by Bob · IBM HC&D Capstone — NovaCart Account Dashboard*
