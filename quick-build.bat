@echo off
REM Simple Build Script - No Chinese Characters
REM This script works on all Windows systems without encoding issues

echo ================================================
echo   Telegram AI Assistant - Quick Build Script
echo ================================================
echo.

REM Check if node exists
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js found
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    echo.
)

REM Create build dir if not exists
if not exist "build" mkdir build

echo Choose build mode:
echo   1 = NSIS Installer (Recommended)
echo   2 = Portable Version  
echo   3 = Both (Installer + Portable)
echo   4 = Dev Mode (No package)
echo.
set /p mode=Enter number (1-4):

if "%mode%"=="1" goto installer
if "%mode%"=="2" goto portable
if "%mode%"=="3" goto both
if "%mode%"=="4" goto devmode

echo Invalid choice. Using default (Installer)...
goto installer

:installer
echo.
echo ================================================
echo   Building NSIS Installer...
echo ================================================
call npm run build:win
goto done

:portable
echo.
echo ================================================
echo   Building Portable Version...
echo ================================================
call npx electron-builder --win portable
goto done

:both
echo.
echo ================================================
echo   Building Installer...
echo ================================================
call npm run build:win
if %errorlevel% equ 0 (
    echo.
    echo ================================================
    echo   Building Portable...
    echo ================================================
    call npx electron-builder --win portable
)
goto done

:devmode
echo.
echo ================================================
echo   Starting Development Mode...
echo ================================================
call npm run desktop:dev
goto done

:done
echo.
if %errorlevel% equ 0 (
    echo ================================================
    echo   BUILD SUCCESSFUL!
    echo ================================================
    echo Output folder: dist-electron\
    start explorer dist-electron
) else (
    echo ================================================
    echo   BUILD FAILED
    echo ================================================
    echo.
    echo Try these fixes:
    echo   1. Delete the dist-electron folder
    echo   2. Run this script as Administrator
    echo   3. Check your internet connection
)
echo.
pause
