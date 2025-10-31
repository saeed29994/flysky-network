@echo off
echo 🚀 بدء حل التعارضات تلقائيًا عبر نسخة المستودع البعيد (theirs)...

:: جلب الملفات المتعارضة
for /f "delims=" %%i in ('git diff --name-only --diff-filter=U') do (
  echo ✅ حل التعارض للملف: %%i
  git checkout --theirs "%%i"
  git add "%%i"
)

:: أكمل rebase
git rebase --continue

echo 🚀 rebase اكتمل! جاهز للدفع النهائي.
pause
