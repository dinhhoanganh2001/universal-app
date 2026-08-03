import os
import sys
import tempfile
from decimal import Decimal
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
    assert me.json()["currency"] == "VND", me.text
    assert me.json()["monthly_income"] == "0.00", me.text
    assert me.json()["onboarding_completed"] is False, me.text
    demo_user_id = me.json()["id"]

    profile = client.patch(
        "/api/auth/me",
        headers=headers,
        json={
            "full_name": "Demo Updated",
            "avatar_url": "https://example.com/avatar.png",
            "currency": "USD",
            "monthly_income": "1200.00",
        },
    )
    assert profile.status_code == 200, profile.text
    assert profile.json()["full_name"] == "Demo Updated", profile.text
    assert profile.json()["avatar_url"] == "https://example.com/avatar.png", profile.text
    assert profile.json()["currency"] == "USD", profile.text
    assert profile.json()["monthly_income"] == "1200.00", profile.text

    avatar = client.post(
        "/api/auth/avatar",
        headers=headers,
        files={"file": ("avatar.png", b"\x89PNG\r\n\x1a\navatar", "image/png")},
    )
    assert avatar.status_code == 200, avatar.text
    avatar_url = avatar.json()["avatar_url"]
    assert avatar_url.startswith("http://testserver/uploads/avatars/user-"), avatar.text
    avatar_file = client.get(avatar_url.replace("http://testserver", ""))
    assert avatar_file.status_code == 200, avatar_file.text

    onboarding = client.patch(
        "/api/auth/onboarding",
        headers=headers,
        json={"monthly_income": "2500.00"},
    )
    assert onboarding.status_code == 200, onboarding.text
    assert onboarding.json()["monthly_income"] == "2500.00", onboarding.text
    assert onboarding.json()["onboarding_completed"] is True, onboarding.text

    password_update = client.patch(
        "/api/auth/password",
        headers=headers,
        json={"current_password": "strong-password", "new_password": "stronger-password"},
    )
    assert password_update.status_code == 204, password_update.text

    old_password_login = client.post(
        "/api/auth/login",
        json={"email": "demo@example.com", "password": "strong-password"},
    )
    assert old_password_login.status_code == 401, old_password_login.text

    new_password_login = client.post(
        "/api/auth/login",
        json={"email": "demo@example.com", "password": "stronger-password"},
    )
    assert new_password_login.status_code == 200, new_password_login.text

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
    id_friend_login = client.post(
        "/api/auth/login",
        json={"email": "idfriend@example.com", "password": "strong-password"},
    )
    assert id_friend_login.status_code == 200, id_friend_login.text
    id_friend_headers = {"Authorization": f"Bearer {id_friend_login.json()['access_token']}"}

    self_friend = client.post(
        "/api/friends?month=2026-07",
        headers=headers,
        json={"identifier": str(demo_user_id)},
    )
    assert self_friend.status_code == 400, self_friend.text

    friend_request = client.post(
        "/api/friends?month=2026-07",
        headers=headers,
        json={"identifier": "friend@example.com"},
    )
    assert friend_request.status_code == 201, friend_request.text
    friend_request_payload = friend_request.json()
    assert friend_request_payload["user_id"] == friend_user_id, friend_request_payload
    assert friend_request_payload["direction"] == "outgoing", friend_request_payload

    pending_friends = client.get("/api/friends?month=2026-07", headers=headers)
    assert pending_friends.status_code == 200, pending_friends.text
    assert len(pending_friends.json()["friends"]) == 0, pending_friends.text
    assert len(pending_friends.json()["outgoing_requests"]) == 1, pending_friends.text

    accepted_friend = client.post(
        f"/api/friends/requests/{friend_request_payload['request_id']}/accept?month=2026-07",
        headers=friend_headers,
    )
    assert accepted_friend.status_code == 200, accepted_friend.text

    id_friend_request = client.post(
        "/api/friends?month=2026-07",
        headers=headers,
        json={"identifier": str(id_friend_id)},
    )
    assert id_friend_request.status_code == 201, id_friend_request.text
    accepted_id_friend = client.post(
        f"/api/friends/requests/{id_friend_request.json()['request_id']}/accept?month=2026-07",
        headers=id_friend_headers,
    )
    assert accepted_id_friend.status_code == 200, accepted_id_friend.text

    friends = client.get("/api/friends?month=2026-07", headers=headers)
    assert friends.status_code == 200, friends.text
    friends_payload = friends.json()
    assert friends_payload["month"] == "2026-07", friends_payload
    assert len(friends_payload["friends"]) == 2, friends_payload
    added_friend_payload = next(friend for friend in friends_payload["friends"] if friend["id"] == friend_user_id)
    assert added_friend_payload["budget_percent_used"] == 75, added_friend_payload
    assert "spent_amount" not in added_friend_payload, added_friend_payload
    assert "limit_amount" not in added_friend_payload, added_friend_payload

    deleted_friend = client.delete(f"/api/friends/{id_friend_id}", headers=headers)
    assert deleted_friend.status_code == 204, deleted_friend.text

    game_today = client.get("/api/game/today", headers=headers)
    assert game_today.status_code == 200, game_today.text
    game_payload = game_today.json()
    assert game_payload["word_length"] == 5, game_payload
    assert game_payload["max_attempts"] == 6, game_payload
    assert game_payload["source_word_count"] == 3000, game_payload
    assert game_payload["status"] == "playing", game_payload

    game_guess = client.post("/api/game/guesses", headers=headers, json={"word": "apple"})
    assert game_guess.status_code == 200, game_guess.text
    game_guess_payload = game_guess.json()
    assert game_guess_payload["attempts_used"] == 1, game_guess_payload
    assert len(game_guess_payload["guesses"]) == 1, game_guess_payload
    assert len(game_guess_payload["guesses"][0]["result"]) == 5, game_guess_payload
    assert any(player["user_id"] == demo_user_id for player in game_guess_payload["progress"]), game_guess_payload
    demo_game_progress = next(player for player in game_guess_payload["progress"] if player["user_id"] == demo_user_id)
    assert demo_game_progress["board"] == [game_guess_payload["guesses"][0]["result"]], game_guess_payload
    assert "word" not in demo_game_progress, demo_game_progress

    duplicate_game_guess = client.post("/api/game/guesses", headers=headers, json={"word": "apple"})
    assert duplicate_game_guess.status_code == 409, duplicate_game_guess.text

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
        json={
            "category": "Food",
            "month": "2026-07",
            "limit_amount": "500.00",
            "minimum_amount": "300.00",
            "full_amount": "500.00",
            "color": "#0f766e",
        },
    )
    assert budget.status_code == 200, budget.text
    assert budget.json()["spent_amount"] == "42.50", budget.text
    assert budget.json()["minimum_amount"] == "300.00", budget.text
    assert budget.json()["full_amount"] == "500.00", budget.text
    assert budget.json()["color"] == "#0f766e", budget.text
    budget_id = budget.json()["id"]

    future_summary = client.get("/api/money/summary?month=2026-08", headers=headers)
    assert future_summary.status_code == 200, future_summary.text
    future_budget = next(item for item in future_summary.json()["budgets"] if item["category"] == "Food")
    assert future_budget["month"] == "2026-08", future_budget
    assert future_budget["limit_amount"] == "500.00", future_budget
    assert Decimal(future_budget["spent_amount"]) == Decimal("0.00"), future_budget

    future_budget_update = client.patch(
        f"/api/money/budgets/{budget_id}",
        headers=headers,
        json={"month": "2026-08", "limit_amount": "650.00", "color": "#0891b2"},
    )
    assert future_budget_update.status_code == 200, future_budget_update.text
    assert future_budget_update.json()["month"] == "2026-08", future_budget_update.text
    assert future_budget_update.json()["limit_amount"] == "650.00", future_budget_update.text

    july_summary = client.get("/api/money/summary?month=2026-07", headers=headers)
    assert july_summary.status_code == 200, july_summary.text
    july_budget = next(item for item in july_summary.json()["budgets"] if item["category"] == "Food")
    assert july_budget["limit_amount"] == "500.00", july_budget

    august_summary = client.get("/api/money/summary?month=2026-08", headers=headers)
    assert august_summary.status_code == 200, august_summary.text
    august_budget = next(item for item in august_summary.json()["budgets"] if item["category"] == "Food")
    assert august_budget["limit_amount"] == "650.00", august_budget

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
        json={"category": "Shopping", "limit_amount": "750.00", "color": "#7c3aed"},
    )
    assert updated_budget.status_code == 200, updated_budget.text
    assert updated_budget.json()["category"] == "Shopping", updated_budget.text
    assert updated_budget.json()["spent_amount"] == "10.00", updated_budget.text
    assert updated_budget.json()["color"] == "#7c3aed", updated_budget.text

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
