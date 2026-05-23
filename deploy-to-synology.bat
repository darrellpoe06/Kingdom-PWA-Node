@echo off
REM ============================================================
REM  deploy-to-synology.bat
REM  Builds the React PWA and pushes it to the Synology DS1621xs
REM  Synology share: \\PoeTech\poetech-app
REM  Live URL:       https://192-168-1-26.poetech.direct.quickconnect.to/poetech-app/
REM
REM  How it works:
REM    1. Vite builds the React app with base "/poetech-app/" (see
REM       app\vite.config.js) so all asset paths resolve correctly under
REM       the Synology Web Station alias portal.
REM    2. The built dist\ folder is copied into the shared folder. The
REM       Web Station Nginx backend serves it immediately — no restart.
REM
REM  Run this every time you want the family-visible app to reflect the
REM  latest local commits. (A future GitHub Action can automate it.)
REM ============================================================

setlocal
cd /d "%~dp0app"

echo.
echo [1/3] Building React app...
echo.
call npm run build
if errorlevel 1 (
  echo.
  echo BUILD FAILED. Fix the error above, then re-run this script.
  pause
  exit /b 1
)

echo.
echo [2/3] Pushing dist\ to \\PoeTech\poetech-app ...
echo.
xcopy /E /I /Y /Q dist "\\PoeTech\poetech-app\"
if errorlevel 1 (
  echo.
  echo COPY FAILED. Check that \\PoeTech\poetech-app is reachable.
  echo Try opening it in File Explorer first to confirm your credentials.
  pause
  exit /b 1
)

echo.
echo [3/3] Done.
echo.
echo The PoeTech Family OS app is live at:
echo.
echo   https://192-168-1-26.poetech.direct.quickconnect.to/poetech-app/
echo.
echo Anyone in the family who already installed the PWA from that URL
echo will see the new build on their next refresh.
echo.
echo First-time install on each device:
echo   1. Open the URL above in Chrome on a laptop, or Safari/Chrome on a phone.
echo   2. Click the Install icon in Chrome's address bar
echo      (or Share - Add to Home Screen on iPhone).
echo   3. The icon appears as a regular app.
echo.
pause
