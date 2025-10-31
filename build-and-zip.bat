@echo off
title FlySky - Build and Zip Script
color 0E

echo ===============================
echo   🔧 Building your project...
echo ===============================
npm run build

IF ERRORLEVEL 1 (
    echo ❌ Build failed! Check your code.
    pause
    exit /b
)

echo.
echo ===============================
echo   📦 Compressing /dist folder...
echo ===============================
powershell -Command "Compress-Archive -Path dist\* -DestinationPath ready-to-upload.zip -Force"

echo.
echo ✅ Done! File [ready-to-upload.zip] is ready for upload to Hostinger.
echo 👉 Location: %cd%\ready-to-upload.zip
pause
