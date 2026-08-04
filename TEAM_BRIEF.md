# NovaCart Account Dashboard — Team Brief
### Presentation Prep · All Roles

> **Purpose:** Everything the team needs to understand, explain, and present the application.
> Read this before the presentation. No prior technical knowledge assumed.

---

## Table of Contents

1. [What We Built](#1-what-we-built)
2. [How the System Works — Plain English](#2-how-the-system-works--plain-english)
3. [Local Testing vs. Live Snowflake — The Key Difference](#3-local-testing-vs-live-snowflake--the-key-difference)
4. [Architecture Diagrams](#4-architecture-diagrams)
5. [The Database — What Data We're Working With](#5-the-database--what-data-were-working-with)
6. [The Backend — API Endpoints](#6-the-backend--api-endpoints)
7. [How the Frontend Calls the Backend](#7-how-the-frontend-calls-the-backend)
8. [The Three Dashboard Pages](#8-the-three-dashboard-pages)
9. [What We Implemented — Plain English Summary](#9-what-we-implemented--plain-english-summary)
10. [Key Design Decisions & Trade-offs](#10-key-design-decisions--trade-offs)
11. [What's Left (Deployment)](#11-whats-left-deployment)
12. [Key Technical Terms (Glossary)](#12-key-technical-terms-glossary)
13. [Likely Panel Questions & Answers](#13-likely-panel-questions--answers)

---

## 1. What We Built

**The client is NovaCart** — a growing online retailer with customers in 30+ countries. Their problem: years of order data sitting in a database with no way to visualise it. Account managers were getting weekly Excel reports, always a week out of date.

**We built them a live web dashboard** with three pages:

| Page | What it shows |
|------|---------------|
| **Orders** | Total revenue, total orders, unique customers — plus a monthly revenue bar chart and a top-10 cities revenue chart |
| **Products** | Horizontal bar chart of the top 10 products by revenue + a full product details table |
| **Customers** | Sortable table of the top 20 customers by spending |

Every page has:
- A **date range filter** (change the date range, hit Apply, data updates)
- A **live service status indicator** in the navbar (green dot = backend connected)
- **Dark/light mode** toggle

---

## 2. How the System Works — Plain English

The application has three layers that talk to each other:

```
  User's Browser
       │
       │  Opens a URL, sees a web page
       ▼
  Frontend  (the React website)
       │
       │  "Give me the revenue data" → gets back JSON numbers
       ▼
  Backend  (the Python API server)
       │
       │  Runs a SQL query → gets rows back
       ▼
  Database  (where all NovaCart's order data lives)
```

**Frontend** — A React web app. It's what the user sees and interacts with. It calls the backend to get data and renders it as charts and tables.

**Backend** — A Python server (FastAPI). It has 7 URLs (called endpoints) that the frontend can call. When called, each endpoint runs a SQL query against the database and returns the results as JSON (a standard data format that looks like `{"total_revenue": 3219003.52}`).

**Database** — Where all the order data actually lives. Locally this is a file on your laptop (SQLite). In production it's Snowflake (a cloud database).

**Router (NGINX)** — Only exists in production. Acts as a traffic director — routes `/api/...` requests to the backend and everything else to the frontend. The user only ever sees one URL.

---

## 3. Local Testing vs. Live Snowflake — The Key Difference

This is one of the most important things to understand for the presentation.

### Local Development (what we've been doing)

```
Backend  ──────────────────►  SQLite file on laptop
                               data/novacart_gold.db
                               ~30,000 orders · 400 customers · 15 products
```

- The database is a **single file** already in the repository
- No internet connection needed, no credentials needed
- `DATA_BACKEND=sqlite` in `backend/.env` activates this mode
- The data is **sample data** that mirrors the real Snowflake schema exactly
- This is how all our development and testing was done

### Production (waiting on DE team)

```
Backend  ──────────────────►  Snowflake (cloud database)
                               Account: VEB81086.us-east-1
                               Database: NOVACART_DB
                               Schema: APP
```

- The backend connects to Snowflake using an **OAuth token** that the SPCS platform injects automatically — no username/password in the code
- `DATA_BACKEND=snowflake` activates this mode
- This is **real NovaCart data** — the same tables, same schema, just with actual production records
- We are currently waiting on the Data Engineering team to provision our Snowflake access

### What the demo will look like if we're still on local data

If Snowflake access isn't ready before the presentation, we demo on local SQLite data. The numbers (~$3.2M revenue, 17,083 orders, 400 customers) are sample data — not real NovaCart figures. The panel knows this. What they're evaluating is whether the **application works correctly**, not whether the numbers match production. Be upfront: "We're demonstrating on sample data — the structure and behaviour are identical to what will run against real Snowflake data."

### Why this matters for the presentation

The **SQL queries are identical** between local and production. The same query that works against SQLite will work against Snowflake — the connection layer handles the difference transparently. When we deploy and connect to the real database, no code changes are needed. The numbers will change (real data vs sample data), but everything else stays the same.

### The two environment variables that control the mode

| Variable | Local value | Production value |
|----------|-------------|-----------------|
| `DATA_BACKEND` | `sqlite` | `snowflake` |
| `CLIENT_VALIDATION` | `Dev` | `Snowflake` |

`CLIENT_VALIDATION=Dev` skips the login flow and auto-connects locally as `dev_user`. `CLIENT_VALIDATION=Snowflake` enables real Snowflake OAuth login — the user is prompted to log in with their Snowflake credentials and MFA when they first open the app. After that, the session is managed by Snowflake automatically.

---

## 4. Architecture Diagrams

### Local Development

```
Developer's Browser  (localhost:3000)
        │
        │  HTTP — page requests and navigation
        ▼
┌─────────────────────────────────┐
│  Frontend — React 18            │
│  localhost:3000  (npm start)    │
│                                 │
│  /orders    → OrdersView.js     │
│  /products  → ProductsView.js   │
│  /customers → CustomersView.js  │
└─────────────────────────────────┘
        │
        │  CORS-enabled HTTP to localhost:8000
        │  All calls go through src/utils/api.js
        ▼
┌─────────────────────────────────┐     ┌────────────────────────────┐
│  Backend — FastAPI / Python     │     │  SQLite Database           │
│  localhost:8000                 │◄───►│  data/novacart_gold.db     │
│  uvicorn main:app --reload      │     │  30K orders, sample data   │
│                                 │     └────────────────────────────┘
│  GET /health                    │
│  GET /authorize                 │
│  GET /franchise/summary         │
│  GET /franchise/orders          │
│  GET /franchise/products        │
│  GET /franchise/customers       │
│  GET /franchise/cities          │
│  GET /docs  (Swagger UI)        │
└─────────────────────────────────┘
```

### Production — Snowflake Container Services (SPCS)

All three containers run inside a single SPCS service. Only the router is exposed to the internet — the backend and frontend are internal.

```
NovaCart Account Manager (any browser, any location)
        │
        │  HTTPS — public URL assigned by Snowflake
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  SPCS Service Pod  (FRONTEND_SERVICE_GROUP<N>)                    │
│  Compute Pool: NOVACART_BACKEND_POOL                              │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Router container  (NGINX · port 9000 — public endpoint)  │   │
│  │                                                            │   │
│  │  /api/*  ─────► strips /api ─────► backend :8000          │   │
│  │  /*      ──────────────────────► frontend :3000            │   │
│  └──────────────────┬──────────────────────┬───────────────────┘  │
│                     │                      │                       │
│        ┌────────────▼──────────┐  ┌────────▼──────────────────┐   │
│        │  Backend container   │  │  Frontend container        │   │
│        │  FastAPI · port 8000 │  │  NGINX serving React build │   │
│        │  DATA_BACKEND=       │  │  port 3000                 │   │
│        │    snowflake         │  └────────────────────────────┘   │
│        └──────────┬───────────┘                                    │
└───────────────────│────────────────────────────────────────────────┘
                    │  OAuth token auto-mounted at
                    │  /snowflake/session/token
                    ▼
          ┌──────────────────────────────┐
          │  Snowflake                   │
          │  NOVACART_DB · Schema: APP   │
          │  Tables: fact_orders,        │
          │    dim_customer, dim_product,│
          │    dim_date                  │
          └──────────────────────────────┘
```

---

## 5. The Database — What Data We're Working With

The Data Engineering team built a "Gold Layer" — clean, analytics-ready data organised into four tables:

```
┌──────────────────────────────────────────────────────────────────┐
│  fact_orders  (one row per order)                                │
│  order_id · customer_id · product_id · order_date · amount      │
│  currency · status · quantity · date_key                        │
└───────────┬──────────────────────────┬───────────────┬──────────┘
            │ customer_id              │ product_id    │ date_key
            ▼                          ▼               ▼
┌────────────────────────┐  ┌─────────────────────┐  ┌────────────────────┐
│  dim_customer          │  │  dim_product        │  │  dim_date          │
│  customer_id           │  │  product_id         │  │  date_key          │
│  name · email          │  │  name · category    │  │  year · quarter    │
│  addr_city · addr_state│  │  price              │  │  month · month_name│
│  is_current            │  └─────────────────────┘  │  day_of_week       │
│  valid_from · valid_to │                            └────────────────────┘
└────────────────────────┘
```

**Two rules every query must follow:**

1. **Revenue filter** — Only count orders where `status IN ('delivered', 'shipped')`. Cancelled and returned orders don't count as revenue.

2. **Customer history (SCD Type 2)** — `dim_customer` stores the full history of customer record changes. Always add `WHERE is_current = 1` to get only current customer records, not historical ones.

**Local database contents:** ~30,000 orders · 400 customers · 15 products · all from 2022

---

## 6. The Backend — API Endpoints

The backend is a Python server built with **FastAPI**. It exposes 7 URLs. You can browse and test all of them interactively at **`http://localhost:8000/docs`** (Swagger UI).

### System endpoints (pre-built, always working)

| Endpoint | What it does |
|----------|-------------|
| `GET /health` | Returns `{"status": "healthy"}` and confirms the database is connected. The green dot in the navbar calls this every 30 seconds. |
| `GET /authorize` | Returns the logged-in user's identity. Locally returns `dev_user`. In SPCS returns the real Snowflake username via OAuth. |

### Data endpoints (we implemented these)

All of these return JSON. The date-filtering endpoints accept `?start=YYYY-MM-DD&end=YYYY-MM-DD` as optional query parameters — if omitted, they default to the full 2022 dataset.

| Endpoint | Date filter? | What the SQL does | Returns |
|----------|-------------|-------------------|---------|
| `GET /franchise/summary` | ❌ No | `COUNT` orders, `SUM` amount, `COUNT DISTINCT` customers, `MIN`/`MAX` dates from `fact_orders` | Single object |
| `GET /franchise/orders` | ✅ Yes | `JOIN fact_orders + dim_date`, `GROUP BY` year/month, filtered by date range | Array — one object per month |
| `GET /franchise/products` | ✅ Yes | `JOIN fact_orders + dim_product`, `GROUP BY` product, `ORDER BY` revenue | Array — all products by revenue |
| `GET /franchise/customers` | ✅ Yes | `JOIN fact_orders + dim_customer` (`is_current=1`), `GROUP BY` customer, top 20 | Array — 20 customers |
| `GET /franchise/cities` | ✅ Yes | `JOIN fact_orders + dim_customer` (`is_current=1`), `GROUP BY` city/state | Array — all cities by revenue |

### Example responses

**`/franchise/summary`**
```json
{
  "total_revenue": 3219003.52,
  "total_orders": 17083,
  "unique_customers": 400,
  "date_range": { "start": "2022-01-01", "end": "2022-12-31" }
}
```

**`/franchise/orders`** (one entry per month)
```json
[
  { "month": "2022-01", "month_name": "January", "order_count": 1514, "revenue": 289570.84 },
  { "month": "2022-02", "month_name": "February", "order_count": 1292, "revenue": 241617.40 }
]
```

**`/franchise/customers`** (top 20)
```json
[
  { "customer_id": "C001", "name": "Alice Johnson", "city": "Austin",
    "state": "TX", "total_orders": 14, "total_spent": 1240.50 }
]
```

---

## 7. How the Frontend Calls the Backend

**Plain English:** Every time a page needs data, it sends a request to the backend and waits for a response. The backend runs a SQL query and sends back a JSON object (structured text data). React then takes those numbers and renders them as charts and tables on screen. The user sees none of this — from their perspective, the page just loads with data.

All API calls are centralised in **`frontend/src/utils/api.js`**. Every page imports named functions from this file — so if the backend URL ever changes, you update it in one place. A consultant can think of `api.js` as the "phone book" — it knows the address of every backend endpoint and how to call it.

```javascript
// api.js — the single source of truth for all backend calls
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
//                  ↑ locally = http://localhost:8000
//                  ↑ in SPCS = /api  (router strips /api and forwards to backend)

export async function getSummary()      { return apiFetch('/franchise/summary'); }
export async function getOrders(s, e)   { return apiFetch(`/franchise/orders?start=${s}&end=${e}`); }
export async function getProducts(s, e) { return apiFetch(`/franchise/products?start=${s}&end=${e}`); }
export async function getCustomers(s,e) { return apiFetch(`/franchise/customers?start=${s}&end=${e}`); }
export async function getCities(s, e)   { return apiFetch(`/franchise/cities?start=${s}&end=${e}`); }
```

**How a page uses it (for developers):**
```javascript
// Inside OrdersView.js — simplified
const [summary, setSummary] = useState(null);  // empty box to hold the data

async function loadData() {
  const s = await getSummary();  // ask the backend: "give me the summary"
  setSummary(s);                 // put the response in the box
}
// React sees the box was filled and automatically re-draws the page with the numbers
```

**What triggers a data fetch:**
- On page load — data fetches automatically when you navigate to a page
- When you click **Apply** in the date filter — `loadData()` is called again with the new dates
- On any page, the data is only re-fetched when Apply is clicked — changing dates without clicking Apply does nothing

**Local vs SPCS URL routing:**

| Mode | `REACT_APP_BACKEND_URL` | What happens |
|------|------------------------|--------------|
| Local dev | `http://localhost:8000` | Frontend calls backend directly on the same laptop |
| SPCS | `/api` | Frontend calls `/api/franchise/summary` → the NGINX router strips `/api` → backend receives `/franchise/summary` |

---

## 8. The Three Dashboard Pages

All three pages share common behaviour: they show a **loading spinner** while data is being fetched, an **error banner** if the API call fails, and a **date range filter bar** at the top with From/To date inputs and an Apply button. The navbar at the top of every page shows the NovaCart logo, navigation links (with the active page highlighted), a live service status dot, and the dark/light mode toggle.

---

### Page 1 — Orders Overview (`/orders`)

**Purpose:** The main landing page. Gives account managers a high-level summary of revenue performance — total numbers at a glance, how revenue trended month by month, and which cities are generating the most business.

**What's on the page:**

**1. Stat Cards (three boxes at the top)**
- **Total Revenue** — the sum of all order amounts with `status = 'delivered'` or `'shipped'`, formatted as currency (e.g. `$3,219,003.52`)
- **Total Orders** — total count of delivered/shipped orders
- **Unique Customers** — count of distinct customers who placed at least one delivered/shipped order

> ⚠️ **Important behaviour:** The stat cards show **all-time totals** and do **not** change when you use the date filter. This is because the `/franchise/summary` endpoint has no date parameters — it always returns aggregate totals across the full dataset. The charts below them do respond to the filter.

**2. Monthly Revenue Bar Chart**
- Shows revenue broken down by month across the selected date range
- X-axis: month names (January, February, …)
- Y-axis: revenue in thousands (e.g. `$289k`)
- Hovering over a bar shows the exact revenue for that month
- Includes a subtle grid for readability
- Data comes from `GET /franchise/orders?start=...&end=...`

**3. Revenue by City Bar Chart (horizontal)**
- Shows the top 10 cities by revenue for the selected date range
- Laid out horizontally — city names on the left, bar extending right
- Clicking Apply with a different date range re-fetches and updates this chart
- Data comes from `GET /franchise/cities?start=...&end=...` — the backend returns all cities ordered by revenue, the frontend takes only the first 10

**Date filter behaviour on this page:**
- Changing dates and clicking Apply → monthly chart and city chart update with new data
- Stat cards stay the same (all-time, by design)

---

### Page 2 — Product Performance (`/products`)

**Purpose:** Shows which products are driving revenue. Useful for account managers who want to know what's selling best and how each product is performing in detail.

**What's on the page (two panels side by side):**

**1. Top 10 Products by Revenue — Bar Chart (left panel)**
- Horizontal bar chart showing the top 10 products ranked by revenue for the selected date range
- Each bar represents one product; longer bar = more revenue
- Product names are truncated to 20 characters on the chart to prevent overflow
- Y-axis: product names; X-axis: revenue (formatted as `$125K`, `$1.2M`, etc.)
- Data: the backend returns all products ordered by revenue, the frontend slices to 10 for this chart

**2. Product Details Table (right panel)**
- A full table of **all products** (no limit) with these columns:
  - **Name** — full product name
  - **Category** — product category
  - **Units Sold** — total quantity sold across all delivered/shipped orders
  - **Revenue** — total revenue formatted as currency
- Rows alternate in background colour for readability
- Scrollable if there are many products (max height 300px, scrolls vertically)
- Same data source as the chart — just showing all rows instead of top 10

**Date filter behaviour on this page:**
- Changing dates and clicking Apply re-fetches from `/franchise/products` with the new range
- Both the chart and the table update together (they share the same dataset)

---

### Page 3 — Customer List (`/customers`)

**Purpose:** Shows who the top spending customers are. Account managers can sort by different columns to find their most valuable customers, most frequent buyers, etc.

**What's on the page:**

**1. Sortable Customer Table**
- Shows the **top 20 customers by total spending** for the selected date range
- Columns:
  - **Name** — customer full name
  - **City** — customer's current city
  - **State** — customer's current state (US state abbreviation, e.g. `TX`, `CA`)
  - **Orders** — total number of delivered/shipped orders placed
  - **Total Spent** — total revenue attributed to this customer, formatted as currency

**Sorting behaviour:**
- Click any column header to sort by that column
- Click the same header again to reverse the sort direction (ascending ↔ descending)
- The active sort column is highlighted in the accent colour (teal/green) and shows a ↑ or ↓ arrow
- **Name column** sorts by last name first, then first name (alphabetical by surname)
- **Numbers** (Orders, Total Spent) sort numerically
- **City/State** sort alphabetically
- Default sort on load: Total Spent descending (highest spenders at top)
- Sorting happens instantly in the browser — no API call needed

**Other features:**
- The filter bar shows a live customer count (e.g. `20 customers`)
- The page title updates dynamically based on the active sort column (e.g. "Top 20 Customers by City" when sorted by city)
- Rows alternate in background colour

**Date filter behaviour on this page:**
- Changing dates and clicking Apply re-fetches from `/franchise/customers` with the new range
- The table fully reloads with the new top 20 for that period
- The sort state is preserved — if you were sorted by Name, it stays sorted by Name after the filter applies

---

## 9. What We Implemented — Plain English Summary

### What the team built

**Backend (SQL queries):** The starter code gave us a Python server with 5 empty endpoints — each one was set up to return an error saying "not implemented yet." Our job was to write the SQL query inside each one. Each query reaches into the database, pulls the right data, and sends it back. Five endpoints, five SQL queries written by the team.

**Frontend (charts and tables):** The starter code gave us three page files where the data-fetching was already wired up — the pages already knew how to call the backend and handle loading/error states. Our job was to take the data that came back and render it visually — build the bar charts, tables, and stat cards. Three pages, all UI implemented by the team.

**In plain terms:** Think of the backend as the kitchen and the frontend as the dining room. The starter code set up the kitchen equipment and the dining room layout. We wrote the recipes (SQL) and plated the dishes (charts/tables).

---

### Backend SQL queries — `backend/main.py`

All 5 SQL queries, each replacing a `raise HTTPException(status_code=501)` stub:

**`GET /franchise/summary`**
```sql
SELECT
    COUNT(DISTINCT order_id)    AS total_orders,
    SUM(amount)                 AS total_revenue,
    COUNT(DISTINCT customer_id) AS unique_customers,
    MIN(order_date)             AS start_date,
    MAX(order_date)             AS end_date
FROM fact_orders
WHERE status IN ('delivered', 'shipped')
```

**`GET /franchise/orders`**
```sql
SELECT
    d.year || '-' || printf('%02d', d.month) AS month,
    d.month_name,
    COUNT(f.order_id) AS order_count,
    SUM(f.amount)     AS revenue
FROM fact_orders f
JOIN dim_date d ON f.date_key = d.date_key
WHERE f.status IN ('delivered', 'shipped')
  AND f.order_date BETWEEN ? AND ?
GROUP BY d.year, d.month, d.month_name
ORDER BY d.year, d.month
```

**`GET /franchise/products`**
```sql
SELECT
    f.product_id, p.name, p.category,
    SUM(f.quantity) AS units_sold,
    SUM(f.amount)   AS revenue
FROM fact_orders f
JOIN dim_product p ON f.product_id = p.product_id
WHERE f.status IN ('delivered', 'shipped')
  AND f.order_date BETWEEN ? AND ?
GROUP BY f.product_id, p.name, p.category
ORDER BY revenue DESC
```

**`GET /franchise/customers`**
```sql
SELECT
    f.customer_id, c.name,
    c.addr_city AS city, c.addr_state AS state,
    COUNT(f.order_id) AS total_orders,
    SUM(f.amount)     AS total_spent
FROM fact_orders f
JOIN dim_customer c ON f.customer_id = c.customer_id
WHERE f.status IN ('delivered', 'shipped')
  AND c.is_current = 1
  AND f.order_date BETWEEN ? AND ?
GROUP BY f.customer_id, c.name, c.addr_city, c.addr_state
ORDER BY total_spent DESC
LIMIT 20
```

**`GET /franchise/cities`**
```sql
SELECT
    c.addr_city AS city, c.addr_state AS state,
    COUNT(f.order_id) AS order_count,
    SUM(f.amount)     AS revenue
FROM fact_orders f
JOIN dim_customer c ON f.customer_id = c.customer_id
WHERE f.status IN ('delivered', 'shipped')
  AND c.is_current = 1
  AND f.order_date BETWEEN ? AND ?
GROUP BY c.addr_city, c.addr_state
ORDER BY revenue DESC
```

### Frontend UI — pages

- **`OrdersView.js`** — stat cards with formatted currency, monthly revenue bar chart (Recharts `BarChart` with `CartesianGrid`), revenue by city horizontal bar chart (top 10)
- **`ProductsView.js`** — horizontal bar chart of top 10 products (product names truncated to 20 chars), scrollable product details table with all products
- **`CustomersView.js`** — sortable table with last-name-first name sorting, alternating row colours, currency-formatted total spent

### What was already provided by the starter scaffold

The following were pre-built and handed to us — we did not write these:

| What | What it does |
|------|-------------|
| `connection.py` | Handles all database connections. Automatically switches between SQLite locally and Snowflake in production. We just call `get_connection()` and `execute_query()`. |
| `api.js` | All frontend API call functions. We just call `getSummary()`, `getOrders()`, etc. |
| `Navbar.js` | The top navigation bar with links, service status, and dark/light toggle. |
| `ServiceStatus.js` | The coloured dot that polls `/health` every 30 seconds. |
| `App.js` | Sets up all URL routing (`/orders`, `/products`, `/customers`). |
| `App.css` | All styles, colours, and CSS variables for light/dark mode. |
| All Dockerfiles | Instructions for packaging each service as a container. |
| NGINX router config | The reverse proxy routing rules for production. |
| GitHub Actions workflows | The automated build and deploy pipelines (facilitator-managed). |
| `novacart_gold.db` | The pre-populated local SQLite database with 30K sample orders. |
| Page data-fetching scaffolding | Each page already fetched data and handled loading/error states. We only built the visual layer. |

---

## 10. Key Design Decisions & Trade-offs

These are the decisions our team made and the reasoning behind them. The panel will likely ask about at least two of these.

---

**Decision 1: SQLite for local development, Snowflake for production**

*What we chose:* Use a local SQLite database file for development and switch to Snowflake when deployed.

*Why:* Every developer can run the full application on their laptop with zero setup — no cloud account, no internet connection, no credentials. The local database has the same table structure as Snowflake, so all our SQL works identically in both. This is a standard engineering practice called "environment parity."

*Trade-off:* The local data is sample data (~30K orders) while Snowflake has real production data. Developers can't test against real data without cloud access. We accepted this trade-off because the schema is identical and the sample data is realistic enough to verify the logic.

---

**Decision 2: FastAPI for the backend**

*What we chose:* Python with FastAPI as the API framework.

*Why:* FastAPI auto-generates Swagger documentation at `/docs` with zero additional code — anyone can open a browser and see exactly what every endpoint does and test it interactively. It's also fast to write, widely used in production, and has built-in support for type checking.

*Trade-off:* Python is slower than compiled languages (like Go or Java) for raw performance. For a dashboard serving a small number of account managers, this is completely irrelevant — the bottleneck is database query time, not the Python server.

---

**Decision 3: NGINX as the production router**

*What we chose:* Run all three services (frontend, backend, router) inside a single SPCS service, with NGINX routing traffic between them.

*Why:* SPCS exposes only one public URL per service. Without the router, users would need separate URLs for the frontend and backend, and the browser would block cross-origin requests (CORS). NGINX solves this by making everything appear as one URL — `/api/*` goes to the backend, everything else goes to the frontend.

*Trade-off:* Adds a third container to manage. In local development we skip the router entirely and communicate directly between frontend and backend using CORS headers.

---

**Decision 4: Frontend-only sorting for the Customers page**

*What we chose:* The backend returns the top 20 customers ordered by total spending. All sorting (by name, city, orders, etc.) happens in the browser without making a new API call.

*Why:* The dataset is small (20 rows) — sorting 20 objects in the browser is instantaneous and doesn't require a network round-trip. This makes the sort feel immediate to the user.

*Trade-off:* The "top 20" is always determined by total spending, regardless of what column the user has sorted by. If a user sorts by City, they're seeing the top-20-spenders sorted by city — not the top 20 customers from that city. This is a known limitation of the current design.

---

## 11. What's Left (Deployment)

Waiting on the DE team for Snowflake access. Once received:

```bash
# 1. Set your values (facilitator provides these)
export REPO_URL=<snowflake_image_repo_url>
export GROUP=<your_group_number>

# 2. Build and push all 3 Docker images
bash build-and-push.sh

# 3. Notify facilitator — they run the deploy workflow
# 4. Get the public URL, open in browser, verify with real data
```

The facilitator's GitHub Actions workflow (`deploy-group.yml`) handles creating the SPCS service automatically. No manual SQL needed from our side.

If something breaks after deployment, check logs in Snowsight:
```sql
CALL SYSTEM$GET_SERVICE_LOGS('FRONTEND_SERVICE_GROUP<N>', '0', 'backend', 50);
CALL SYSTEM$GET_SERVICE_LOGS('FRONTEND_SERVICE_GROUP<N>', '0', 'frontend', 50);
```

Common issues after deployment: wrong environment variable names, missing `CLIENT_VALIDATION` causing CORS errors, or `bcrypt` ELF format error (ensure `.dockerignore` is present).

---

## 12. Key Technical Terms (Glossary)

For the consultant and anyone presenting to the panel:

| Term | Plain-English Definition |
|------|--------------------------|
| **API** | A set of URLs a server exposes so other software can request data from it. Our backend API is how the frontend gets its data. |
| **FastAPI** | The Python framework we used to build the backend. Auto-generates the `/docs` Swagger UI. |
| **React** | The JavaScript library used for the frontend. Builds the interactive web pages. |
| **Recharts** | The charting library used for all bar charts in the dashboard. |
| **JSON** | The data format used between frontend and backend. Looks like `{"total_revenue": 3219003.52}`. |
| **SQLite** | A lightweight database that lives in a single file. Used locally — no setup required. |
| **Snowflake** | The cloud data warehouse where real NovaCart data lives. Used in production. |
| **SPCS** | Snowflake Container Services — Snowflake's platform for running Docker containers in the cloud. |
| **Docker** | Packages the app and all its dependencies into a portable container that runs the same anywhere. |
| **NGINX** | A web server. Used here both to serve the React app and as the router in production. |
| **Reverse proxy** | A server that routes incoming requests to the right destination. Our NGINX router does this. |
| **OAuth** | The authentication protocol. In SPCS, Snowflake handles user login and injects a token — no passwords in our code. |
| **Swagger UI** | The auto-generated API documentation page at `/docs`. Lists every endpoint and lets you test them. |
| **Star schema** | Database design pattern: one central fact table (orders) linked to dimension tables (customer, product, date). |
| **Gold Layer** | The DE team's cleaned, analytics-ready data. We query it but didn't build it. |
| **SCD Type 2** | How `dim_customer` tracks history — new row added on changes, old row marked `is_current = 0`. Always filter `WHERE is_current = 1`. |

---

## 13. Likely Panel Questions & Answers

**"Why FastAPI?"**
Fast to write, auto-generates the `/docs` Swagger UI with zero extra code, excellent Python ecosystem, used in real HC&D client work.

**"Why SQLite for local development?"**
Zero setup — it's a single file already in the repo. Every developer can run the full app locally without a database server or cloud credentials. The schema is identical to Snowflake so all our SQL works in both.

**"How does the app authenticate to Snowflake in production?"**
It doesn't need credentials in the code. SPCS automatically mounts an OAuth token at `/snowflake/session/token` inside the container. `connection.py` reads that file and uses it. This is how all SPCS applications authenticate.

**"Why NGINX as a router?"**
In SPCS, only one port per service can be exposed publicly. NGINX lets us run three containers (frontend, backend, router) but expose only one URL. It routes `/api/*` to the backend and everything else to the frontend transparently.

**"What does 'Gold Layer' mean?"**
The DE team runs a data pipeline: raw data (Bronze) → cleaned data (Silver) → analytics-ready data (Gold). We only interact with the Gold layer — we don't know or care how the raw data gets there.

**"Why don't the stat cards change when you change the date filter?"**
The `/franchise/summary` endpoint returns all-time totals — it has no date parameters by design. The stat cards are meant to show the overall picture. The charts (monthly revenue, cities) do respond to the date filter.

**"What is SCD Type 2 and why does it matter?"**
Slowly Changing Dimension — instead of overwriting a customer record when it changes (e.g. they move cities), the database adds a new row and marks the old one as `is_current = 0`. We always filter `WHERE is_current = 1` to avoid counting the same customer twice or getting their old address.

**"What's the difference between your local results and what the panel will see?"**
The numbers will be different — local uses ~30,000 sample orders, Snowflake has real NovaCart production data. But the structure, charts, and behaviour are identical. The code doesn't change between environments.

---

*NovaCart Account Dashboard · HC&D Associates Capstone · App Developer + App Consultant*
