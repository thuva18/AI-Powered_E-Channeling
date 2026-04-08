#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/web"
AI_DIR="$ROOT_DIR/ai-service"

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed. Install Node.js and npm first."
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: python3 is not installed. Install Python 3 first."
  exit 1
fi

if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ] || [ ! -d "$AI_DIR" ]; then
  echo "Error: backend, frontend, or ai-service directory is missing."
  exit 1
fi

kill_port() {
  local port="$1"
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "Killing processes on port $port: $pids"
    echo "$pids" | xargs kill -9 >/dev/null 2>&1 || true
    sleep 1
  fi
}

install_if_missing() {
  local dir="$1"
  local name="$2"

  if [ ! -d "$dir/node_modules" ]; then
    echo "[$name] node_modules not found. Installing dependencies..."
    (cd "$dir" && npm install)
  fi
}

install_python_deps() {
  local dir="$1"
  local name="$2"

  if [ ! -f "$dir/requirements.txt" ]; then
    echo "[$name] requirements.txt not found. Skipping Python dependencies."
    return
  fi

  # Check if key packages are installed (simple check)
  if ! python3 -c "import flask, sklearn" >/dev/null 2>&1; then
    echo "[$name] Python dependencies not found. Installing..."
    (cd "$dir" && python3 -m pip install -r requirements.txt)
  fi
}

install_if_missing "$BACKEND_DIR" "backend"
install_if_missing "$FRONTEND_DIR" "frontend"
install_python_deps "$AI_DIR" "ai-service"

cleanup() {
  echo ""
  echo "Stopping services..."
  if [ -n "${BACKEND_PID:-}" ] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
  if [ -n "${FRONTEND_PID:-}" ] && kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi
  if [ -n "${AI_PID:-}" ] && kill -0 "$AI_PID" >/dev/null 2>&1; then
    kill "$AI_PID" >/dev/null 2>&1 || true
  fi
  wait 2>/dev/null || true
  echo "Services stopped."
}

trap cleanup INT TERM EXIT

echo "Starting backend, frontend, and AI service in development mode..."

# Kill existing processes on ports
kill_port 8000
kill_port 5173
kill_port 5001

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

(
  cd "$AI_DIR"
  # Use the dedicated venv if available (has all ML packages), else fall back to system python3
  if [ -f "$AI_DIR/venv/bin/python3" ]; then
    "$AI_DIR/venv/bin/python3" app.py
  else
    python3 app.py
  fi
) &
AI_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "AI Service PID: $AI_PID"
echo "Press Ctrl+C to stop all services."

wait "$BACKEND_PID" "$FRONTEND_PID" "$AI_PID"
