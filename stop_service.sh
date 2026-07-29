#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$ROOT_DIR/.service-pids"

if [ ! -f "$PID_FILE" ]; then
  echo "No Universal App PID file found. Services may already be stopped."
  exit 0
fi

# shellcheck disable=SC1090
. "$PID_FILE"

stop_pid() {
  local name="$1"
  local pid="$2"

  if [ -z "$pid" ]; then
    echo "$name PID is empty; skipping."
    return
  fi

  if kill -0 "$pid" 2>/dev/null; then
    echo "Stopping $name process $pid..."
    kill "$pid" 2>/dev/null || true
  else
    echo "$name process $pid is not running."
  fi
}

wait_for_stop() {
  local name="$1"
  local pid="$2"

  if [ -z "$pid" ]; then
    return
  fi

  if ! kill -0 "$pid" 2>/dev/null; then
    return
  fi

  for _ in 1 2 3 4 5; do
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "$name process $pid stopped."
      return
    fi
    sleep 1
  done

  if kill -0 "$pid" 2>/dev/null; then
    echo "$name process $pid is still running; forcing stop..."
    kill -9 "$pid" 2>/dev/null || true
  fi
}

stop_pid "backend" "${BACKEND_PID:-}"
stop_pid "frontend" "${FRONTEND_PID:-}"

wait_for_stop "backend" "${BACKEND_PID:-}"
wait_for_stop "frontend" "${FRONTEND_PID:-}"

rm -f "$PID_FILE"
echo "Universal App services stopped."
