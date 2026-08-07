# NovaCart Account Dashboard

## URL: [NovaCart](https://nlbmyoub-se58322-snowflake-containers-adrianm.snowflakecomputing.app/ "Go to NovaCart")

### HC&D Associates Capstone — App Developer + App Consultant

Your starting point for the NovaCart Account Dashboard capstone. The infrastructure is already set up. Your job is to implement the API endpoints and the frontend UI.

---

## What's in this repo

```
backend/
  main.py
  connection.py
  requirements.txt
  Dockerfile

frontend/
  src/pages/
    OrdersView.js
    ProductsView.js
    CustomersView.js
    CustomerHistoryView.js
    HomeView.js
  src/components/
  src/utils/
  Dockerfile

router/           NGINX reverse proxy — do not modify
data/
  novacart_gold.db

build-and-push.sh
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

## Our Work

### App Developer

**Backend** — open `backend/main.py` and implement the 5 endpoints:

| Endpoint | Description |
|---|---|
| `GET /franchise/summary` | Total revenue, orders, unique customers |
| `GET /franchise/orders` | Monthly order volume and revenue |
| `GET /franchise/products` | Top 10 products by revenue |
| `GET /franchise/customers` | Top 20 customers by revenue |
| `GET /franchise/cities` | Revenue by city and state |
| `GET /franchise/{customer_id}/history` | Detailed customer information |

**Frontend** — open the three files in `frontend/src/pages/` and implement the UI:

| File | Description |
|---|---|
| `HomeView.js` | KPI cards and other summary statistics |
| `OrdersView.js` | Revenue analytics |
| `ProductsView.js` | Product analytics |
| `CustomersView.js` | Customer list |
| 'CustomerHistoryView.js` | Customer information |


### App Consultant

- Documented each step of the development process
- Prepared presentations and led discussions with clients
- Curated documentation for the clients

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

## Team Members
Developers:

Danny Mendler

Kenneth Huang

Ivan Li

Consultants

Joon Jung

Nifemi Ayodele-Esho

Yaire Lopez-Quiroz
