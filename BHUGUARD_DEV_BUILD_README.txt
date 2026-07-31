BHUGUARD FULL DEV APK — QUICK STEPS

1. Copy BUILD_DEV_APK_NOW.ps1 and START_BHUGUARD_DEMO.ps1 into:
   C:\Users\Admin\Desktop\bhuguard-mobile

2. Open PowerShell and run:
   Set-ExecutionPolicy -Scope Process Bypass -Force
   cd "C:\Users\Admin\Desktop\bhuguard-mobile"
   .\BUILD_DEV_APK_NOW.ps1

3. APK output:
   C:\Users\Admin\Desktop\bhuguard-mobile\dist\Bhuguard-Full-Dev-Client.apk

4. For the client demo, keep the Laravel backend running:
   cd "C:\Users\Admin\Desktop\bhuguard-latest"
   php artisan serve --host=0.0.0.0 --port=8000

5. In another PowerShell window, start Metro:
   cd "C:\Users\Admin\Desktop\bhuguard-mobile"
   .\START_BHUGUARD_DEMO.ps1

6. Phone and PC must be on the same Wi-Fi if EXPO_PUBLIC_API_URL uses a LAN IP.
