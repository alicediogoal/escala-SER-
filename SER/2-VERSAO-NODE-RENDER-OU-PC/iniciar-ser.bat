@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Ser - servidor
if not exist node_modules (
  echo Instalando dependencias, aguarde alguns minutos...
  call npm install --omit=dev
  if errorlevel 1 (
    echo.
    echo ERRO na instalacao. Tire um print desta tela e envie para ajuda.
    pause
    exit /b 1
  )
)
if not exist segredo.txt powershell -NoProfile -Command "([guid]::NewGuid().ToString('N')+[guid]::NewGuid().ToString('N')) | Out-File -Encoding ascii -NoNewline segredo.txt"
if not exist chave-ponte.txt powershell -NoProfile -Command "([guid]::NewGuid().ToString('N')) | Out-File -Encoding ascii -NoNewline chave-ponte.txt"
set /p APP_SECRET=<segredo.txt
set /p BRIDGE_KEY=<chave-ponte.txt
set PORT=3000
set TZ=America/Sao_Paulo
set DATA_DIR=%~dp0dados
rem DEV_LOGIN=true mostra o codigo de login na tela (so para testar). Use false quando o WhatsApp estiver configurado.
set DEV_LOGIN=true
:loop
node server.js
echo.
echo O servidor parou. Reiniciando em 5 segundos... (feche esta janela para encerrar)
timeout /t 5 >nul
goto loop
