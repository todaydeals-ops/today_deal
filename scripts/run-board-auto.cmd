@echo off
cd /d "C:\Users\user\Desktop\today_deal"
"C:\Program Files\nodejs\node.exe" scripts/board-auto.mjs >> scripts/board-auto.log 2>&1
