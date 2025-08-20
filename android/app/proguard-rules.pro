# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Firebase ProGuard Rules
# Keep Firebase classes
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Keep Capacitor Firebase plugin classes
-keep class com.capacitorjs.plugins.firebase.** { *; }
-keep class io.capawesome.capacitorjs.plugins.firebase.** { *; }

# Keep Firebase Messaging classes
-keep class com.google.firebase.messaging.** { *; }

# Keep Firebase Analytics classes
-keep class com.google.firebase.analytics.** { *; }

# Keep Firebase Crashlytics classes
-keep class com.google.firebase.crashlytics.** { *; }

# Keep Firebase Performance classes
-keep class com.google.firebase.perf.** { *; }

# Keep Firebase Config classes
-keep class com.google.firebase.remoteconfig.** { *; }

# Keep Firebase App Check classes
-keep class com.google.firebase.appcheck.** { *; }

# Keep Firebase Auth classes
-keep class com.google.firebase.auth.** { *; }

# Keep Firebase Firestore classes
-keep class com.google.firebase.firestore.** { *; }

# Keep Firebase Storage classes
-keep class com.google.firebase.storage.** { *; }

# Keep Firebase Functions classes
-keep class com.google.firebase.functions.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep Firebase serialization
-keepattributes Signature
-keepattributes *Annotation*
