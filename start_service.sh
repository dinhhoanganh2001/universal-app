#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
VENV_DIR="$BACKEND_DIR/.venv"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8000}"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

cd "$BACKEND_DIR"

if [ ! -d "$VENV_DIR" ]; then
  python3 -m venv "$VENV_DIR"
fi

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp ".env.example" ".env"
fi

"$VENV_DIR/bin/python" -m pip install -r requirements.txt

echo "Starting Universal App API at http://$HOST:$PORT"
echo "API docs: http://$HOST:$PORT/docs"
"$VENV_DIR/bin/uvicorn" app.main:app --host "$HOST" --port "$PORT" --reload &
BACKEND_PID=$!

cd "$ROOT_DIR"

echo "Starting Universal App UI at http://$FRONTEND_HOST:$FRONTEND_PORT"
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
