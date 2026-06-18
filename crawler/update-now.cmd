@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  [Today's Deal] Updating latest deals... (about 1 min)
echo.
"C:\Program Files\nodejs\node.exe" collect-headless.mjs
echo.
echo  [Done] Refresh the website to see updates. Closing in 8s...
timeout /t 8 >nul
