#!/bin/sh

set -e

echo "Starte Backend..."
cd /app/backend
node index.js &
BACKEND_PID=$!

echo "Starte Frontend (Nginx)..."
nginx -g 'daemon off;' &
FRONTEND_PID=$!

# Kubernetes / Docker Stop sauber abfangen
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit 0" SIGTERM SIGINT
# Wenn ein Prozess stirbt → Container stoppen
wait -n
echo "Ein Prozess ist abgestürzt → Container wird beendet"
kill $BACKEND_PID $FRONTEND_PID