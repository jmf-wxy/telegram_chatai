@echo off
echo ================================================
echo   Clean Build Cache and Restart Build
echo ================================================
echo.

echo [1/3] Stopping all Electron/Node processes...
taskkill /f /im electron.exe >nul 2>&1
taskkill /f /im "Telegram AI Assistant.exe" >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo [2/3] Force cleaning dist-electron folder...
if exist "dist-electron" (
    echo     Attempting to delete...
    rd /s /q "dist-electron" 2>nul
    if exist "dist-electron" (
        echo     [WARN] Some files still locked
        echo     Trying alternative method...
        call :forceDelete
    ) else (
        echo     - Successfully deleted old build files
    )
) else (
    echo     - No old build files found
)

echo [3/3] Starting fresh build...
echo.
call npm run build:win
goto end

:forceDelete
echo     Using force delete on remaining files...
pushd dist-electron
for /d %%d in (*) do (
    rd /s /q "%%d" 2>nul
)
for %%f in (*) do (
    del /f /q "%%f" 2>nul
)
popd
rd /s /q "dist-electron" 2>nul
goto :eof

:end
echo.
if %errorlevel% equ 0 (
    echo ================================================
    echo   BUILD SUCCESSFUL!
    echo ================================================
    start explorer dist-electron
) else (
    echo ================================================
    echo   BUILD FAILED
    echo ================================================
    echo.
    echo Manual cleanup required:
    echo   1. Close ALL applications (especially VS Code, browsers)
    echo   2. Open Task Manager (Ctrl+Shift+Esc)
    echo   3. End ALL node.exe and electron.exe processes
    echo   4. Manually delete: dist-electron folder
    echo   5. Run this script again
)
echo.
pause
