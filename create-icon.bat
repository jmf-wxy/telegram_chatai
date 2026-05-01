@echo off
echo ================================================
echo   Generate Default Icon (Optional)
echo ================================================
echo.
echo This script creates a minimal placeholder icon
echo so you can build without icon errors.
echo.
echo The app will use Electron's default icon.
echo You can replace it later with a custom icon.
echo.

set ICON_FILE=build\icon.ico

if exist "%ICON_FILE%" (
    echo [OK] Icon file already exists: %ICON_FILE%
    goto end
)

echo [INFO] Creating minimal ICO file...
echo.

:: Create a minimal valid ICO file (1x1 pixel, 16 colors)
:: This is a binary operation - creating smallest possible valid ICO

powershell -Command "
$bytes = [byte[]]@(0,0,1,0,1,0,16,16,0,0,1,0,32,0,104,4,0,0,22,0,0,0,40,0,0,0,16,16,0,0,1,0,32,0,0,0,0,0,128,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
[System.IO.File]::WriteAllBytes('%ICON_FILE%', $bytes)
"

if exist "%ICON_FILE%" (
    echo [SUCCESS] Created: %ICON_FILE%
    echo.
    echo NOTE: This is a placeholder icon.
    echo For production use, replace with a proper 256x256 icon.
) else (
    echo [ERROR] Failed to create icon
    echo You can still build without it - the config has been updated.
)
echo.

:end
pause
