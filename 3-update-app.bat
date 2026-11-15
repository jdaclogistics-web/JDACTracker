@echo off
REM Naya code phone app me daalta hai + Android Studio Run par auto-build chalu karta hai
cd /d "%~dp0mobile"
if not exist node_modules\@capacitor\cli (echo Packages install ho rahe hain... & call npm install || goto err)
call npm run build || goto err
call npx cap sync android || goto err
powershell -NoProfile -Command "$f='android\app\build.gradle'; $l='apply from: ''../../jdac-autobuild.gradle'''; if(-not (Select-String -Path $f -SimpleMatch $l -Quiet)){ Add-Content -Path $f -Value ([Environment]::NewLine + $l) }; Write-Host 'auto-build ON' -ForegroundColor Green"
echo.
echo DONE - Android Studio me "Sync Project with Gradle Files" (hathi icon) dabao, phir Run
goto end
:err
echo. & echo ERROR - upar ka message Claude ko bhejein
:end
pause
