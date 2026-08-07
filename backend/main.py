"""
main.py — NovaCart Account Dashboard API

Built with FastAPI. Auto-generated docs at: http://localhost:8000/docs

Endpoints:
  GET /health                                  — service health check
  GET /authorize                               — SPCS OAuth flow
  GET /franchise/{id}/home                     - data for home view dashboard
  GET /franchise/{id}/summary                  — overview stats
  GET /franchise/{id}/orders                   — monthly order volume and revenue
  GET /franchise/{id}/products                 — top products by revenue
  GET /franchise/{id}/customers                — top customers by revenue
  GET /franchise/{id}/countries                — revenue by country (city/state for US data)

Data schema (from the DE capstone Gold layer):
  fact_orders:   order_id, customer_id, product_id, order_date, amount, currency, status, quantity, date_key
  dim_customer:  customer_id, name, email, addr_city, addr_state, valid_from, valid_to, is_current
  dim_product:   product_id, name, category, price
  dim_date:      date_key, year, quarter, month, month_name, day_of_week

The connection and query helpers are already set up in connection.py.
"""

import os
import time
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from connection import get_connection, execute_query, DATA_BACKEND

load_dotenv()

# ── App setup ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title="NovaCart Account Dashboard API",
    description=(
        "REST API for the NovaCart account manager dashboard. "
        "Built on top of the Gold data layer produced by the Data Engineering team."
    ),
    version="1.0.0",
    root_path="" if os.getenv("CLIENT_VALIDATION", "Dev") == "Dev" else "/api",
)

PORT              = int(os.getenv("PORT", 8000))
CLIENT_VALIDATION = os.getenv("CLIENT_VALIDATION", "Dev")
START_TIME        = time.time()

# CORS — only needed for local development
# In SPCS, the NGINX router handles routing so CORS is not required
if CLIENT_VALIDATION == "Dev":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:3001"],
        allow_methods=["GET"],
        allow_headers=["*"],
    )


# ── Startup log ───────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    print("\nStarting NovaCart Dashboard API")
    print(f"Port:            {PORT}")
    print(f"Data backend:    {os.getenv('DATA_BACKEND', 'sqlite')}")
    print(f"Validation mode: {CLIENT_VALIDATION}")
    print(f"Docs:            http://localhost:{PORT}/docs\n")


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
def health():
    """
    Returns service health and confirms the database connection is working.
    Used by the frontend service status indicator.
    """
    uptime = round(time.time() - START_TIME)
    try:
        conn    = get_connection()
        results = execute_query(conn, "SELECT 1 AS ping")
        assert len(results) > 0
    except Exception as e:
        return JSONResponse(status_code=503, content={
            "status":   "degraded",
            "uptime_s": uptime,
            "database": {"status": "error", "message": str(e)},
        })
    return {
        "status":   "healthy",
        "uptime_s": uptime,
        "backend":  os.getenv("DATA_BACKEND", "sqlite"),
        "database": {"status": "connected"},
    }


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.get("/authorize", tags=["Auth"])
def authorize(request: Request):
    """
    SPCS OAuth authorization endpoint.

    When running inside SPCS, the platform injects the authenticated Snowflake
    username in the Sf-Context-Current-User header. This endpoint reads that
    header and returns the user's identity so the frontend can store it.

    In Dev mode: returns a mock user for local development.
    """
    if CLIENT_VALIDATION == "Dev":
        return {"user": "dev_user", "status": "authorized"}

    username = request.headers.get("sf-context-current-user")
    if not username:
        raise HTTPException(status_code=422, detail="Missing Sf-Context-Current-User header")

    return {"user": username, "status": "authorized"}


# ── Franchise endpoints ───────────────────────────────────────────────────────

@app.get("/franchise/home", tags=["Franchise"])
def get_home():
    """
    Returns all data needed to render the homepage dashboard in a single request:
      - summary:            total revenue, orders, unique customers, date range
      - monthly_revenue:    revenue per month for the most recent year
      - status_breakdown:   order count per status (all time)
      - top_categories:     top 5 product categories by revenue
      - recent_orders:      5 most recent orders

    Expected response:
    {
        "summary": {
            "total_revenue":    1284750.00,
            "total_orders":     8432,
            "unique_customers": 380,
            "date_range":       { "start": "2022-01-01", "end": "2022-12-31" }
        },
        "monthly_revenue": [
            { "month": "2022-01", "month_name": "January", "year": 2022,
              "order_count": 842, "revenue": 128450.00 }
        ],
        "status_breakdown": [
            { "status": "delivered", "order_count": 5120 },
            { "status": "shipped",   "order_count": 2100 },
            { "status": "pending",   "order_count":  800 },
            { "status": "cancelled", "order_count":  412 }
        ],
        "top_categories": [
            { "category": "Electronics", "order_count": 1240, "revenue": 412300.00 }
        ],
        "recent_orders": [
            { "order_id": "O001", "order_date": "2022-12-31", "customer_name": "Alice Johnson",
              "product_name": "Wireless Headphones", "amount": 89.99, "status": "delivered" }
        ]
    }
    """
    conn = get_connection()

    # Overall summary
    summary_rows = execute_query(conn, """
        SELECT
            COUNT(DISTINCT order_id)    AS total_orders,
            ROUND(SUM(amount), 2)       AS total_revenue,
            COUNT(DISTINCT customer_id) AS unique_customers,
            MIN(order_date)             AS start_date,
            MAX(order_date)             AS end_date
        FROM fact_orders
        WHERE status IN ('delivered', 'shipped')
    """)
    s = summary_rows[0]

    # Monthly revenue trend — most recent year only
    pad_month = "LPAD(CAST(d.month AS VARCHAR), 2, '0')" if DATA_BACKEND == "snowflake" else "printf('%02d', d.month)"
    monthly = execute_query(conn, f"""
        SELECT
            d.year || '-' || {pad_month} AS month,
            d.month_name,
            d.year,
            COUNT(DISTINCT f.order_id) AS order_count,
            ROUND(SUM(f.amount), 2)    AS revenue
        FROM fact_orders f
        JOIN (
            SELECT DISTINCT date_key, year, month, month_name
            FROM dim_date
        ) d ON f.date_key = d.date_key
        WHERE f.status IN ('delivered', 'shipped')
          AND d.year = (SELECT MAX(year) FROM dim_date)
        GROUP BY d.year, d.month, d.month_name
        ORDER BY d.month
    """)

    # Order status breakdown (all statuses)
    status_breakdown = execute_query(conn, """
        SELECT status, COUNT(DISTINCT order_id) AS order_count
        FROM fact_orders
        GROUP BY status
        ORDER BY order_count DESC
    """)

    # Top 5 categories by revenue
    top_categories = execute_query(conn, """
        SELECT
            p.category,
            COUNT(DISTINCT f.order_id) AS order_count,
            ROUND(SUM(f.amount), 2)    AS revenue
        FROM fact_orders f
        JOIN (
            SELECT DISTINCT product_id, category FROM dim_product
        ) p ON f.product_id = p.product_id
        WHERE f.status IN ('delivered', 'shipped')
        GROUP BY p.category
        ORDER BY revenue DESC
        LIMIT 5
    """)

    # 5 most recent orders
    recent_orders = execute_query(conn, """
        SELECT
            f.order_id,
            f.order_date,
            c.name  AS customer_name,
            p.name  AS product_name,
            f.amount,
            f.status
        FROM fact_orders f
        JOIN (
            SELECT DISTINCT customer_id, name FROM dim_customer WHERE is_current = 1
        ) c ON f.customer_id = c.customer_id
        JOIN (
            SELECT DISTINCT product_id, name FROM dim_product
        ) p ON f.product_id = p.product_id
        ORDER BY f.order_date DESC
        LIMIT 5
    """)

    return {
        "summary": {
            "total_revenue":    s["total_revenue"] or 0,
            "total_orders":     s["total_orders"],
            "unique_customers": s["unique_customers"],
            "date_range":       {"start": s["start_date"], "end": s["end_date"]},
        },
        "monthly_revenue":  monthly,
        "status_breakdown": status_breakdown,
        "top_categories":   top_categories,
        "recent_orders":    recent_orders,
    }


@app.get("/franchise/summary", tags=["Franchise"])
def get_summary():
    """
    Returns an overview of all orders in the database:
    - Total revenue (delivered + shipped orders only)
    - Total orders
    - Number of unique customers
    - Date range of available data

    Expected response:
    {
        "total_revenue": 1284750.00,
        "total_orders": 8432,
        "unique_customers": 380,
        "date_range": { "start": "2022-01-01", "end": "2022-12-31" }
    }
    """
    conn = get_connection()

    results = execute_query(conn, """
        SELECT
            COUNT(DISTINCT order_id)    AS total_orders,
            SUM(amount)                 AS total_revenue,
            COUNT(DISTINCT customer_id) AS unique_customers,
            MIN(order_date)             AS start_date,
            MAX(order_date)             AS end_date
        FROM fact_orders
        WHERE status IN ('delivered', 'shipped')
    """)

    row = results[0]
    return {
        "total_revenue":    round(row["total_revenue"] or 0, 2),
        "total_orders":     row["total_orders"],
        "unique_customers": row["unique_customers"],
        "date_range": {"start": row["start_date"], "end": row["end_date"]},
    }


@app.get("/franchise/orders", tags=["Franchise"])
def get_orders(start: str = "2022-01-01", end: str = "2022-12-31"):
    """
    Returns monthly order volume and revenue for the given date range.
    Used to power the orders overview chart.

    Query parameters:
      start: start date (YYYY-MM-DD)
      end:   end date (YYYY-MM-DD)

    Expected response:
    [
        { "month": "2022-01", "month_name": "January", "order_count": 842, "revenue": 128450.00 },
        { "month": "2022-02", "month_name": "February", "order_count": 910, "revenue": 141230.00 }
    ]
    """
    conn = get_connection()

    # printf() is SQLite-only; Snowflake uses LPAD
    pad_month = "LPAD(CAST(d.month AS VARCHAR), 2, '0')" if DATA_BACKEND == "snowflake" else "printf('%02d', d.month)"
    results = execute_query(conn, f"""
        SELECT
            d.year || '-' || {pad_month} AS month,
            d.month_name,
            COUNT(DISTINCT f.order_id) AS order_count,
            SUM(f.amount)              AS revenue
        FROM fact_orders f
        JOIN (
            SELECT DISTINCT date_key, year, month, month_name
            FROM dim_date
        ) d ON f.date_key = d.date_key
        WHERE f.status IN ('delivered', 'shipped')
          AND f.order_date BETWEEN ? AND ?
        GROUP BY d.year, d.month, d.month_name
        ORDER BY d.year, d.month
    """, (start, end))

    return results


@app.get("/franchise/products", tags=["Franchise"])
def get_products(start: str = "2022-01-01", end: str = "2022-12-31"):
    """
    Returns the top 10 products by revenue for the given date range.

    Expected response:
    [
        { "product_id": "P001", "name": "Wireless Headphones", "category": "Electronics",
          "units_sold": 342, "revenue": 30578.58 }
    ]
    """
    conn = get_connection()

    results = execute_query(conn, """
        SELECT
            f.product_id,
            p.name,
            p.category,
            SUM(f.quantity) AS units_sold,
            SUM(f.amount)   AS revenue
        FROM fact_orders f
        JOIN (
            SELECT DISTINCT product_id, name, category FROM dim_product
        ) p ON f.product_id = p.product_id
        WHERE f.status IN ('delivered', 'shipped')
          AND f.order_date BETWEEN ? AND ?
        GROUP BY f.product_id, p.name, p.category
        ORDER BY revenue DESC
    """, (start, end))

    return results


@app.get("/franchise/customers", tags=["Franchise"])
def get_customers(start: str = "2022-01-01", end: str = "2022-12-31", limit: int = 20):
    """
    Returns the top N customers by revenue for the given date range.

    Query parameters:
      start: start date (YYYY-MM-DD)
      end:   end date (YYYY-MM-DD)
      limit: number of customers to return (default 20)

    Expected response:
    [
        { "customer_id": "C001", "name": "Alice Johnson", "city": "Austin",
          "state": "TX", "total_orders": 14, "total_spent": 1240.50 }
    ]
    """
    conn = get_connection()

    results = execute_query(conn, """
        SELECT
            f.customer_id,
            c.name,
            c.addr_city  AS city,
            c.addr_state AS state,
            COUNT(DISTINCT f.order_id) AS total_orders,
            SUM(f.amount)              AS total_spent
        FROM fact_orders f
        JOIN (
            SELECT DISTINCT customer_id, name, addr_city, addr_state
            FROM dim_customer
            WHERE is_current = 1
        ) c ON f.customer_id = c.customer_id
        WHERE f.status IN ('delivered', 'shipped')
          AND f.order_date BETWEEN ? AND ?
        GROUP BY f.customer_id, c.name, c.addr_city, c.addr_state
        ORDER BY total_spent DESC
        LIMIT ?
    """, (start, end, limit))

    return results


@app.get("/franchise/customers/{customer_id}/history", tags=["Franchise"])
def get_customer_history(customer_id: str):
    """
    Returns the full order history and SCD Type 2 address history for a specific customer.

    Path parameters:
      customer_id: customer identifier (e.g. "C001")

    Expected response:
    {
        "customer_id": "C001",
        "current": { "name": "Alice Johnson", "email": "alice@example.com",
                     "city": "Austin", "state": "TX" },
        "address_history": [
            { "addr_city": "Dallas", "addr_state": "TX",
              "valid_from": "2021-01-01", "valid_to": "2022-06-30", "is_current": 0 },
            { "addr_city": "Austin", "addr_state": "TX",
              "valid_from": "2022-07-01", "valid_to": null, "is_current": 1 }
        ],
        "orders": [
            { "order_id": "O001", "order_date": "2022-03-15", "product_name": "Wireless Headphones",
              "category": "Electronics", "quantity": 2, "amount": 179.98,
              "currency": "USD", "status": "delivered" }
        ]
    }
    """
    conn = get_connection()

    # Current record for the customer profile header
    current_rows = execute_query(conn, """
        SELECT name, email, addr_city, addr_state
        FROM dim_customer
        WHERE customer_id = ? AND is_current = 1
        LIMIT 1
    """, (customer_id,))

    if not current_rows:
        raise HTTPException(status_code=404, detail=f"Customer '{customer_id}' not found")

    # Full SCD Type 2 address history — all versions, oldest first
    address_history = execute_query(conn, """
        SELECT DISTINCT addr_city, addr_state, valid_from, valid_to, is_current
        FROM dim_customer
        WHERE customer_id = ?
        ORDER BY valid_from ASC
    """, (customer_id,))

    # Total order count and spend via SQL — avoids floating-point accumulation in JS
    totals_rows = execute_query(conn, """
        SELECT COUNT(DISTINCT order_id) AS total_orders, ROUND(SUM(amount), 2) AS total_spent
        FROM fact_orders
        WHERE customer_id = ?
    """, (customer_id,))

    totals = totals_rows[0]

    # Full order history joined to product name and category
    orders = execute_query(conn, """
        SELECT DISTINCT
            f.order_id,
            f.order_date,
            p.name     AS product_name,
            p.category,
            f.quantity,
            f.amount,
            f.currency,
            f.status
        FROM fact_orders f
        JOIN (
            SELECT DISTINCT product_id, name, category FROM dim_product
        ) p ON f.product_id = p.product_id
        WHERE f.customer_id = ?
        ORDER BY f.order_date DESC
    """, (customer_id,))

    return {
        "customer_id":     customer_id,
        "current":         current_rows[0],
        "total_orders":    totals["total_orders"],
        "total_spent":     totals["total_spent"],
        "address_history": address_history,
        "orders":          orders,
    }


@app.get("/franchise/cities", tags=["Franchise"])
def get_cities(start: str = "2022-01-01", end: str = "2022-12-31"):
    """
    Returns revenue grouped by city and state.
    Used to power the geographic breakdown chart.

    Expected response:
    [
        { "city": "Austin", "state": "TX", "order_count": 420, "revenue": 38430.00 }
    ]
    """
    conn = get_connection()

    results = execute_query(conn, """
        SELECT
            c.addr_city  AS city,
            c.addr_state AS state,
            COUNT(DISTINCT f.order_id) AS order_count,
            SUM(f.amount)              AS revenue
        FROM fact_orders f
        JOIN (
            SELECT DISTINCT customer_id, addr_city, addr_state
            FROM dim_customer
            WHERE is_current = 1
        ) c ON f.customer_id = c.customer_id
        WHERE f.status IN ('delivered', 'shipped')
          AND f.order_date BETWEEN ? AND ?
        GROUP BY c.addr_city, c.addr_state
        ORDER BY revenue DESC
    """, (start, end))

    return results
