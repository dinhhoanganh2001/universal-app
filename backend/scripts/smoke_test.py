import os
import sys
import tempfile
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))


def main() -> None:
    db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=True)
    os.environ["DATABASE_URL"] = f"sqlite:///{db_file.name}"
    os.environ["SECRET_KEY"] = "smoke-test-secret"

    from fastapi.testclient import TestClient

    from app.main import app

    client = TestClient(app)

    register = client.post(
        "/api/auth/register",
        json={
            "email": "demo@example.com",
            "full_name": "Demo User",
            "password": "strong-password",
        },
    )
    assert register.status_code == 201, register.text

    login = client.post(
        "/api/auth/login",
        json={"email": "demo@example.com", "password": "strong-password"},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me = client.get("/api/auth/me", headers=headers)
    assert me.status_code == 200, me.text

    transaction = client.post(
        "/api/money/transactions",
        headers=headers,
        json={
            "type": "expense",
            "category": "Food",
            "note": "Groceries",
            "amount": "42.50",
            "occurred_on": "2026-07-27",
        },
    )
    assert transaction.status_code == 201, transaction.text

    budget = client.put(
        "/api/money/budgets",
        headers=headers,
        json={"category": "Food", "month": "2026-07", "limit_amount": "500.00"},
    )
    assert budget.status_code == 200, budget.text

    summary = client.get("/api/money/summary?month=2026-07", headers=headers)
    assert summary.status_code == 200, summary.text
    payload = summary.json()
    assert payload["expenses"] == "42.50", payload
    assert payload["budgets"][0]["spent_amount"] == "42.50", payload

    db_file.close()
    print("backend smoke test passed")


if __name__ == "__main__":
    main()
