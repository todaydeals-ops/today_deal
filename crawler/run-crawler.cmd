@echo off
cd /d "%~dp0"
"C:\Program Files\nodejs\node.exe" collect-headless.mjs >> crawl.log 2>&1
