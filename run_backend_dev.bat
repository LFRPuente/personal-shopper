@echo off
cd /d C:\Users\luis_\Desktop\personal_shopper\backend
venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000 --noreload > C:\Users\luis_\Desktop\personal_shopper\backend.out.log 2>&1
