@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ========================================
echo   Telegram AI Assistant Build Tool
echo ========================================
echo.

:: Check Node.js installation
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

:: Check npm dependencies
if not exist "node_modules" (
    echo [INFO] Installing npm dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

:: Check build directory
if not exist "build" (
    mkdir build
)

:: Check icon file (optional)
if not exist "build\icon.ico" (
    echo [WARNING] icon.ico not found, using default icon
    echo [TIP] Place a 256x256 icon.ico in build/ directory for custom icon
)

echo.
echo Please select a build option:
echo   1. Full Installer (NSIS) - Recommended
echo   2. Portable Version
echo   3. Build All (Installer + Portable)
echo   4. Dev Mode Preview (No build required)
echo.
set /p choice=Enter option (1-4):

if "%choice%"=="1" goto build_nsis
if "%choice%"=="2" goto build_portable
if "%choice%"=="3" goto build_all
if "%choice%"=="4" goto dev_mode
echo Invalid option
pause
exit /b 1

:build_nsis
echo.
echo ========================================
echo   Building Windows Installer...
echo ========================================
call npm run build:win
goto check_result

:build_portable
echo.
echo ========================================
echo   Building Portable Version...
echo ========================================
call npx electron-builder --win portable
goto check_result

:build_all
echo.
echo ========================================
echo   Building All Versions...
echo ========================================
call npm run build:win
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   Building Portable Version...
    echo ========================================
    call npx electron-builder --win portable
)
goto check_result

:dev_mode
echo.
echo ========================================
echo   Starting Dev Mode...
echo ========================================
call npm run desktop:dev
goto end

:check_result
echo.
if %errorlevel% equ 0 (
    echo ========================================
    echo   [SUCCESS] Build completed!
    echo ========================================
    echo.
    echo Output directory: dist-electron\
    explorer dist-electron
) else (
    echo ========================================
    echo   [FAILED] Build error!
    echo ========================================
    echo.
    echo Common solutions:
    echo   1. Delete dist-electron/ folder and retry
    echo   2. Run as Administrator
    echo   3. Check network connection (for downloading Electron)
    echo   4. See BUILD_GUIDE.md for more help
)
goto end

:end
echo.
pause
