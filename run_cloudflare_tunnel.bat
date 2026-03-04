@echo off
cd /d C:\Users\luis_\Desktop\personal_shopper
C:\Progra~2\cloudflared\cloudflared.exe tunnel --url http://127.0.0.1:5173 --no-autoupdate --metrics 127.0.0.1:20250 > C:\Users\luis_\Desktop\personal_shopper\cloudflared.out.log 2>&1
