@echo off
cd /d C:\Users\luis_\Desktop\personal_shopper\backend
venv\Scripts\daphne.exe -b 0.0.0.0 -p 8000 backend.asgi:application > C:\Users\luis_\Desktop\personal_shopper\backend.out.log 2>&1
