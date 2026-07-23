@echo off
title La Chispa Gamer - Sistema
cd /d "%~dp0"
setlocal enabledelayedexpansion

echo ==========================================
echo    LA CHISPA GAMER - Arrancando sistema
echo ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [X] Falta instalar Node.js en esta PC.
  echo     1. Anda a  https://nodejs.org  y descarga la version LTS
  echo     2. Instalala con Siguiente, Siguiente
  echo     3. Volve a hacer doble clic en este archivo
  echo.
  pause
  exit /b
)

if not exist node_modules (
  echo Instalando dependencias por primera vez, espera unos minutos...
  call npm install
)

echo.
echo ------------------------------------------
echo  EN ESTA PC abri:      http://localhost:3000
echo  PANEL ADMIN:          http://localhost:3000/admin
echo.
echo  EN EL CELULAR (misma WiFi) abri una de estas:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
  set ip=%%a
  set ip=!ip: =!
  echo     http://!ip!:3000
)
echo ------------------------------------------
echo.
echo  DEJA ESTA VENTANA ABIERTA mientras usas el sistema.
echo  Para apagarlo: cerra esta ventana.
echo.

call npm run dev
pause
