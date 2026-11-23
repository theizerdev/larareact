@echo off
title Fixsale - Servidor WhatsApp Multi-Dispositivo (Python Neonize)
cls
echo ================================================================
echo       INICIANDO MOTOR NATIVO DE WHATSAPP PARA FIXSALE
echo ================================================================
echo   * URL Local: http://127.0.0.1:3001
echo   * Docs API:  http://127.0.0.1:3001/docs
echo   * Motor:     Neonize (WhatsMeow / Go nativo en Python)
echo ================================================================

cd /d "%~dp0"

REM Detectar ejecutable de Python
set PYTHON_EXE=

if exist "venv\Scripts\python.exe" (
    set "PYTHON_EXE=venv\Scripts\python.exe"
    goto START_SERVER
)

if exist "C:\laragon\www\sismed\backend\venv\Scripts\python.exe" (
    set "PYTHON_EXE=C:\laragon\www\sismed\backend\venv\Scripts\python.exe"
    goto START_SERVER
)

if exist "C:\laragon\bin\python\python-3.13\python.exe" (
    set "PYTHON_EXE=C:\laragon\bin\python\python-3.13\python.exe"
    goto START_SERVER
)

REM Fallback a python global
set "PYTHON_EXE=python"

:START_SERVER
echo Usando Python: %PYTHON_EXE%
echo.

"%PYTHON_EXE%" -m uvicorn main:app --host 127.0.0.1 --port 3001 --reload

pause
