@echo off
echo Starting Backend and Frontend...
start cmd /k "cd server && node server.js"
start cmd /k "cd client && npm run dev"
echo Both servers are starting in new windows.
