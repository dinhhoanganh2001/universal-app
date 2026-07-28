#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
VENV_DIR="$BACKEND_DIR/.venv"
ENV_FILE="$ROOT_DIR/.env"
RUNTIME_CONFIG_FILE="$ROOT_DIR/src/runtime-config.js"

if [ ! -f "$ENV_FILE" ] && [ -f "$ROOT_DIR/.env.example" ]; then
  cp "$ROOT_DIR/.env.example" "$ENV_FILE"
fi

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

BACKEND_HOST="${BACKEND_HOST:-${HOST:-127.0.0.1}}"
BACKEND_PORT="${BACKEND_PORT:-${PORT:-8000}}"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
API_BROWSER_HOST="$BACKEND_HOST"
if [ "$API_BROWSER_HOST" = "0.0.0.0" ]; then
  API_BROWSER_HOST="127.0.0.1"
fi
API_BASE_URL="${API_BASE_URL:-http://$API_BROWSER_HOST:$BACKEND_PORT}"

if [ ! -d "$VENV_DIR" ]; then
  python3 -m venv "$VENV_DIR"
fi

cat > "$RUNTIME_CONFIG_FILE" <<EOF
window.UNIVERSAL_APP_CONFIG = {
  API_BASE_URL: "$API_BASE_URL"
};
EOF

cd "$BACKEND_DIR"

"$VENV_DIR/bin/python" -m pip install -r requirements.txt

echo "Starting Universal App API at http://$BACKEND_HOST:$BACKEND_PORT"
echo "API docs: http://$BACKEND_HOST:$BACKEND_PORT/docs"
"$VENV_DIR/bin/uvicorn" app.main:app --host "$BACKEND_HOST" --port "$BACKEND_PORT" --reload &
BACKEND_PID=$!

cd "$ROOT_DIR"

echo "Starting Universal App UI at http://$FRONTEND_HOST:$FRONTEND_PORT"
echo "Frontend API URL: $API_BASE_URL"
python3 -m http.server "$FRONTEND_PORT" --bind "$FRONTEND_HOST" &
FRONTEND_PID=$!

cleanup() {
  echo
  echo "Stopping Universal App services..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}

trap cleanup INT TERM EXIT
wait "$BACKEND_PID" "$FRONTEND_PID"
