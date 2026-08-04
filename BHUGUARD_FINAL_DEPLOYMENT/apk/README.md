APK STATUS: NOT PRODUCED

expo export: SUCCESS (dist/)
assembleRelease attempt 1: FAIL foojay IBM_SEMERU on Gradle 9.3.1
assembleRelease attempt 2: FAIL MAX_PATH via cursor-sandbox-cache GRADLE_USER_HOME
assembleRelease attempt 3+: retry with GRADLE_USER_HOME=C:\g and -PreactNativeArchitectures=arm64-v8a

When APK succeeds:
  copy android\app\build\outputs\apk\release\app-release.apk to this folder as Bhuguard-Production.apk
  also copy to mobile\releases\Bhuguard-Production.apk
  certutil -hashfile ... SHA256
