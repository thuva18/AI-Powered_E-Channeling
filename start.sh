#!/bin/bash
# Start backend and frontend servers concurrently

echo "Starting backend (npx nodemon)..."
cd backend || exit 1
npx nodemon server.js &
BACKEND_PID=$!
cd ..

echo "Starting frontend (npx vite)..."
cd frontend || exit 1
npx vite &
FRONTEND_PID=$!
cd ..

# Wait for both processes
wait $BACKEND_PID
wait $FRONTEND_PID
