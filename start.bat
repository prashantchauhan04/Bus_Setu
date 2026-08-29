@echo off
title Bus Setu (बस सेतु) — Haryana Bus Service Live Server
echo ========================================================
echo        [+] Starting Bus Setu (बस सेतु)
echo        [+] Haryana Bus Service (हरियाणा बस सेवा)
echo        [+] Aapki Yatra Ka Setu • Live Bus Tracker
echo ========================================================
echo.

:: Add portable Node.js to PATH if present
if exist "%LOCALAPPDATA%\node\node-v22.16.0-win-x64\node.exe" (
    set "PATH=%LOCALAPPDATA%\node\node-v22.16.0-win-x64;%PATH%"
)

:: Run Node server
node server.js

pause
