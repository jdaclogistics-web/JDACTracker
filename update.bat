@echo off
REM ===== JDAC Tracker: GitHub se naya code laao + phone app ke liye build =====
REM Ek baar double-click karo. Uske baad Android Studio me Run dabao.
cd /d "%~dp0"
where git >nul 2>nul || (echo Git install nahi hai. CMD me chalao: winget install -e --id Git.Git & goto err)
if not exist .git (
  echo Pehli baar: is folder ko GitHub repo se jod rahe hain...
  git init -b main || goto err
  git remote add origin https://github.com/jdaclogistics-web/JDACTracker.git
)
echo GitHub se naya code aa raha hai...
git fetch origin main || goto err
git reset --hard origin/main || goto err
echo.
cd mobile
if not exist node_modules\@capacitor\cli (echo Packages install ho rahe hain... & call npm install || goto err)
call npm install --no-audit --no-fund >nul 2>nul
call npm run build || goto err
call npx cap sync android || goto err
powershell -NoProfile -Command "$f='android\app\build.gradle'; if(Test-Path $f){ $l='apply from: ''../../jdac-autobuild.gradle'''; if(-not (Select-String -Path $f -SimpleMatch $l -Quiet)){ Add-Content -Path $f -Value ([Environment]::NewLine + $l) } }"
echo.
echo ==========================================================
echo  DONE - naya code aa gaya. Android Studio me Run dabao.
echo ==========================================================
goto end
:err
echo. & echo ERROR - upar ka message Claude ko bhejein
:end
pause
