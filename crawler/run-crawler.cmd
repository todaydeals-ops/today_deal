@echo off
cd /d "%~dp0"
"C:\Program Files\nodejs\node.exe" collect-headless.mjs >> crawl.log 2>&1
"C:\Program Files\nodejs\node.exe" collect-ohou.mjs >> crawl.log 2>&1
"C:\Program Files\nodejs\node.exe" collect-coupang-goldbox.mjs >> crawl.log 2>&1
