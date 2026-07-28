import os
import sys
import tempfile
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))


def main() -> None:
    db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=True)
    os.environ["DATABASE_URL"] = f"sqlite:///{db_file.name}"
    os.environ["SECRET_KEY"] = "cors-smoke-test-secret"

    from fastapi.testclient import TestClient

    from app.main import app

    client = TestClient(app)
    response = client.options(
        "/api/auth/register",
        headers={
            "Origin": "http://127.0.0.1:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200, response.text
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:5173"

    db_file.close()
    print("cors smoke test passed")


if __name__ == "__main__":
    main()
