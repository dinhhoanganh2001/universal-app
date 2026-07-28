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
    demo_user_id = me.json()["id"]

    friend_register = client.post(
        "/api/auth/register",
        json={
            "email": "friend@example.com",
            "full_name": "Friend User",
            "password": "strong-password",
        },
    )
    assert friend_register.status_code == 201, friend_register.text
    friend_user_id = friend_register.json()["id"]

    friend_login = client.post(
        "/api/auth/login",
        json={"email": "friend@example.com", "password": "strong-password"},
    )
    assert friend_login.status_code == 200, friend_login.text
    friend_headers = {"Authorization": f"Bearer {friend_login.json()['access_token']}"}

    friend_budget = client.put(
        "/api/money/budgets",
        headers=friend_headers,
        json={"category": "Food", "month": "2026-07", "limit_amount": "100.00"},
    )
    assert friend_budget.status_code == 200, friend_budget.text
    friend_transaction = client.post(
        "/api/money/transactions",
        headers=friend_headers,
        json={
            "type": "expense",
            "category": "Food",
            "note": "Lunch",
            "amount": "75.00",
            "occurred_on": "2026-07-28",
        },
    )
    assert friend_transaction.status_code == 201, friend_transaction.text

    id_friend_register = client.post(
        "/api/auth/register",
        json={
            "email": "idfriend@example.com",
            "full_name": "ID Friend",
            "password": "strong-password",
        },
    )
    assert id_friend_register.status_code == 201, id_friend_register.text
    id_friend_id = id_friend_register.json()["id"]

    self_friend = client.post(
        "/api/friends?month=2026-07",
        headers=headers,
        json={"identifier": str(demo_user_id)},
    )
    assert self_friend.status_code == 400, self_friend.text

    added_friend = client.post(
        "/api/friends?month=2026-07",
        headers=headers,
        json={"identifier": "friend@example.com"},
    )
    assert added_friend.status_code == 201, added_friend.text
    added_friend_payload = added_friend.json()
    assert added_friend_payload["id"] == friend_user_id, added_friend_payload
    assert added_friend_payload["budget_percent_used"] == 75, added_friend_payload
    assert "spent_amount" not in added_friend_payload, added_friend_payload
    assert "limit_amount" not in added_friend_payload, added_friend_payload

    added_id_friend = client.post(
        "/api/friends?month=2026-07",
        headers=headers,
        json={"identifier": str(id_friend_id)},
    )
    assert added_id_friend.status_code == 201, added_id_friend.text

    friends = client.get("/api/friends?month=2026-07", headers=headers)
    assert friends.status_code == 200, friends.text
    friends_payload = friends.json()
    assert friends_payload["month"] == "2026-07", friends_payload
    assert len(friends_payload["friends"]) == 2, friends_payload

    deleted_friend = client.delete(f"/api/friends/{id_friend_id}", headers=headers)
    assert deleted_friend.status_code == 204, deleted_friend.text

    category = client.post("/api/money/categories", headers=headers, json={"name": "Food"})
    assert category.status_code == 201, category.text
    category_id = category.json()["id"]

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

    shopping_transaction = client.post(
        "/api/money/transactions",
        headers=headers,
        json={
            "type": "expense",
            "category": "Shopping",
            "note": "Notebook",
            "amount": "10.00",
            "occurred_on": "2026-07-28",
        },
    )
    assert shopping_transaction.status_code == 201, shopping_transaction.text

    budget = client.put(
        "/api/money/budgets",
        headers=headers,
        json={"category": "Food", "month": "2026-07", "limit_amount": "500.00"},
    )
    assert budget.status_code == 200, budget.text
    assert budget.json()["spent_amount"] == "42.50", budget.text
    budget_id = budget.json()["id"]

    category_update = client.patch(
        f"/api/money/categories/{category_id}",
        headers=headers,
        json={"name": "Meals"},
    )
    assert category_update.status_code == 200, category_update.text

    renamed_transactions = client.get("/api/money/transactions?category=Meals", headers=headers)
    assert renamed_transactions.status_code == 200, renamed_transactions.text
    assert len(renamed_transactions.json()) == 1, renamed_transactions.text

    updated_budget = client.patch(
        f"/api/money/budgets/{budget_id}",
        headers=headers,
        json={"category": "Shopping", "limit_amount": "750.00"},
    )
    assert updated_budget.status_code == 200, updated_budget.text
    assert updated_budget.json()["category"] == "Shopping", updated_budget.text
    assert updated_budget.json()["spent_amount"] == "10.00", updated_budget.text

    summary = client.get("/api/money/summary?month=2026-07", headers=headers)
    assert summary.status_code == 200, summary.text
    payload = summary.json()
    assert payload["expenses"] == "52.50", payload
    assert payload["budgets"][0]["category"] == "Shopping", payload
    assert payload["budgets"][0]["spent_amount"] == "10.00", payload

    deleted_budget = client.delete(f"/api/money/budgets/{budget_id}", headers=headers)
    assert deleted_budget.status_code == 204, deleted_budget.text

    category_delete = client.delete(f"/api/money/categories/{category_id}", headers=headers)
    assert category_delete.status_code == 409, category_delete.text

    db_file.close()
    print("backend smoke test passed")


if __name__ == "__main__":
    main()
