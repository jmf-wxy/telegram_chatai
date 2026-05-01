@echo off
echo ================================================
echo   FORCE KILL All Processes and Clean Build
echo ================================================
echo.

echo This script will:
echo   1. Force kill ALL Node.js processes
echo   2. Force kill ALL Electron processes  
echo   3. Delete dist-electron folder
echo   4. Restart the build
echo.
set /p confirm=Continue? (Y/N):
if /i not "%confirm%"=="Y" goto cancel

echo.
echo [Step 1] Force killing Node.js processes...
taskkill /f /im node.exe >nul 2>&1
echo     Done.

echo [Step 2] Force killing Electron processes...
taskkill /f /im electron.exe >nul 2>&1
taskkill /f /im "Telegram AI Assistant.exe" >nul 2>&1
echo     Done.

echo [Step 3] Waiting for processes to fully exit...
timeout /t 5 /nobreak >nul
echo     Done.

echo [Step 4] Deleting dist-electron folder...
if exist "dist-electron" (
    rd /s /q "dist-electron"
    if exist "dist-electron" (
        echo     [ERROR] Cannot delete some files
        echo.
        echo     MANUAL STEPS REQUIRED:
        echo     ========================
        echo     1. Close VS Code completely (File ^> Exit)
        echo     2. Close all browser windows
        echo     3. Close any file explorers showing this folder
        echo     4. Press Ctrl+Shift+Esc to open Task Manager
        echo     5. Find and end ALL node.exe processes
        echo     6. Find and end ALL electron.exe processes
        echo     7. Manually delete the dist-electron folder
        echo     8. Run rebuild.bat again
        echo.
        pause
        exit /b 1
    )
    echo     - Deleted successfully
) else (
    echo     - Folder does not exist
)

echo.
echo [Step 5] Starting build...
call npm run build:win

echo.
if %errorlevel% equ 0 (
    echo ================================================
    echo   BUILD SUCCESS!
    echo ================================================
    start explorer dist-electron
) else (
    echo ================================================
    echo   BUILD FAILED
    echo ================================================
)
echo.
pause
goto :eof

:cancel
echo Cancelled.
pause
