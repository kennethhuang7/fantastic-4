# NovaCart Account Dashboard
### HC&D Associates Capstone — App Developer + App Consultant

Your starting point for the NovaCart Account Dashboard capstone. The infrastructure is already set up. Your job is to implement the API endpoints and the frontend UI.

---

## What's in this repo

```
backend/          Python + FastAPI API skeleton
  main.py         ← Your main work — implement the 5 TODO endpoints
  connection.py   ← Already done — handles local dev + SPCS automatically
  requirements.txt
  Dockerfile

frontend/         React 18 frontend skeleton
  src/pages/      ← Your main work — implement the UI in these 3 files
    OrdersView.js
    ProductsView.js
    CustomersView.js
  src/components/ ← Already done — Navbar, ServiceStatus
  src/utils/      ← Already done — api.js, ThemeContext.js
  Dockerfile

router/           NGINX reverse proxy — do not modify
data/
  novacart_gold.db  ← SQLite database for local development
                      30,000 orders · 400 customers · 15 products

build-and-push.sh   ← Run this on Day 4 to deploy to SPCS
```

---

## Quick Start — Local Development

### 1. Backend

```bash
cd backend
cp .env.example .env
# No changes needed — DATA_BACKEND=sqlite works out of the box

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Open **http://localhost:8000/docs** — Swagger UI with all endpoints.

Test the health endpoint:
```bash
curl http://localhost:8000/health
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env

npm install
npm start
# Opens at http://localhost:3000
```

---

## Your Work

### App Developer

**Backend** — open `backend/main.py` and implement the 5 endpoints:

| Endpoint | Description |
|---|---|
| `GET /franchise/summary` | Total revenue, orders, unique customers |
| `GET /franchise/orders` | Monthly order volume and revenue |
| `GET /franchise/products` | Top 10 products by revenue |
| `GET /franchise/customers` | Top 20 customers by revenue |
| `GET /franchise/cities` | Revenue by city and state |

Each endpoint has a `TODO` comment with hints and the expected response format.

**Frontend** — open the three files in `frontend/src/pages/` and implement the UI:

| File | What to build |
|---|---|
| `OrdersView.js` | Stat cards + monthly revenue chart + cities chart |
| `ProductsView.js` | Products bar chart + products table |
| `CustomersView.js` | Sortable customers table |

Each file has `TODO` comments explaining exactly what to build and which data is available.

### App Consultant

- Write the requirements document before any code is written (end of Day 1)
- Validate each endpoint against requirements before marking it done
- Write the Solution Design Document by Day 4
- Prepare and lead the client presentation on Day 5

---

## Data Schema

The SQLite database has four tables matching the Gold layer from the Data Engineering capstone:

```
fact_orders    order_id, customer_id, product_id, order_date, amount,
               currency, status, quantity, date_key

dim_customer   customer_id, name, email, signup_date,
               addr_street, addr_city, addr_state, addr_zip,
               valid_from, valid_to, is_current

dim_product    product_id, name, category, price, updated_at

dim_date       date_key, full_date, year, quarter, month,
               month_name, day_of_week, is_weekend
```

Use `status IN ('delivered', 'shipped')` for revenue calculations.

---

## Deploying to SPCS

When your endpoints are working and the UI is connected, on Day 4:

```bash
export REPO_URL=<provided by your facilitator>
export GROUP=<your team number>

bash build-and-push.sh
```

Then notify your facilitator — they will deploy your services and give you the public URL.

---

## Troubleshooting

**`501 Not implemented` error** — Expected. Those are the endpoints you need to build.

**Backend can't find the database** — Run `uvicorn` from inside the `backend/` directory.

**CORS error in browser** — Make sure `CLIENT_VALIDATION=Dev` in your backend `.env`.

**`snow` command not found** — Run:
```bash
pip3 install snowflake-cli-labs
export PATH="$HOME/Library/Python/3.9/bin:$PATH"
```

**Docker build fails** — Run with `--no-cache`:
```bash
docker build --no-cache --platform linux/amd64 ...
```

## Team Members (testing git)
Danny Mendler
Kenneth Huang
Ivan Li