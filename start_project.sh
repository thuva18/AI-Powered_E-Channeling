#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed. Install Node.js and npm first."
  exit 1
fi

if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
  echo "Error: backend or frontend directory is missing."
  exit 1
fi

install_if_missing() {
  local dir="$1"
  local name="$2"

  if [ ! -d "$dir/node_modules" ]; then
    echo "[$name] node_modules not found. Installing dependencies..."
    (cd "$dir" && npm install)
  fi
}

install_if_missing "$BACKEND_DIR" "backend"
install_if_missing "$FRONTEND_DIR" "frontend"

cleanup() {
  echo ""
  echo "Stopping services..."
  if [ -n "${BACKEND_PID:-}" ] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
  if [ -n "${FRONTEND_PID:-}" ] && kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi
  wait 2>/dev/null || true
  echo "Services stopped."
}

trap cleanup INT TERM EXIT

echo "Starting backend and frontend in development mode..."

(
  cd "$BACKEND_DIR"
  npm run dev
) &
BACKEND_PID=$!

(
  cd "$FRONTEND_DIR"
  npm run dev
) &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop both services."

wait "$BACKEND_PID" "$FRONTEND_PID"
