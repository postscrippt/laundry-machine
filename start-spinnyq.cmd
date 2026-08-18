@echo off
cd /d "%~dp0"
echo Starting sPinnyQ at http://localhost:4173
start "sPinnyQ" http://localhost:4173
node server.js
