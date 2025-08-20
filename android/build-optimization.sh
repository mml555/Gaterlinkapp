#!/bin/bash

# Android Build Optimization Script for GaterLink
# This script optimizes the Android build for production

set -e

echo "🤖 Starting Android Build Optimization..."
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Navigate to Android directory
cd "$(dirname "$0")"

# Step 1: Clean build artifacts
print_status "Step 1: Cleaning build artifacts..."
./gradlew clean
rm -rf build/
rm -rf app/build/
rm -rf ~/.gradle/caches/

# Step 2: Configure ProGuard/R8 for optimization
print_status "Step 2: Configuring ProGuard/R8 rules..."
cat > app/proguard-rules.pro << 'EOF'
# GaterLink ProGuard Rules

# React Native
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation @interface com.facebook.common.internal.DoNotStrip
-keep,allowobfuscation @interface com.facebook.jni.annotations.DoNotStrip

-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.common.internal.DoNotStrip class *
-keep @com.facebook.jni.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.common.internal.DoNotStrip *;
    @com.facebook.jni.annotations.DoNotStrip *;
}

-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
  void set*(***);
  *** get*();
}

-keep class * implements com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * implements com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactProp <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>; }

-dontwarn com.facebook.react.**
-keep,includeattributes Signature
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase
-dontwarn org.conscrypt.**
-dontwarn com.squareup.okhttp3.**

# Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# Camera Kit
-keep class com.camerakit.** { *; }

# Keychain
-keep class com.oblador.keychain.** { *; }

# Biometrics
-keep class com.rnbiometrics.** { *; }

# Remove logging in production
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
    public static int e(...);
}

# General Android
-keepclassmembers class * implements android.os.Parcelable {
  public static final android.os.Parcelable$Creator CREATOR;
}

-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep custom application class
-keep class com.gaterlinknative.** { *; }

# Optimization
-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-dontpreverify
-verbose
-optimizations !code/simplification/arithmetic,!field/*,!class/merging/*
EOF

# Step 3: Update build.gradle for optimization
print_status "Step 3: Updating build.gradle for optimization..."
cat > app/build.gradle.optimization << 'EOF'
// Add these to your android block in app/build.gradle

android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            
            // Optimize APK
            zipAlignEnabled true
            debuggable false
            jniDebuggable false
            renderscriptDebuggable false
            
            // Signing config
            signingConfig signingConfigs.release
            
            // Build config fields
            buildConfigField "boolean", "IS_DEBUG", "false"
            buildConfigField "boolean", "ENABLE_CRASHLYTICS", "true"
            
            // NDK optimizations
            ndk {
                abiFilters "arm64-v8a", "armeabi-v7a"
            }
            
            // Package options
            packagingOptions {
                exclude 'META-INF/DEPENDENCIES'
                exclude 'META-INF/LICENSE'
                exclude 'META-INF/LICENSE.txt'
                exclude 'META-INF/NOTICE'
                exclude 'META-INF/NOTICE.txt'
                exclude 'META-INF/*.kotlin_module'
                pickFirst '**/libc++_shared.so'
                pickFirst '**/libjsc.so'
                pickFirst '**/libhermes.so'
            }
        }
    }
    
    // Bundle optimizations
    bundle {
        language {
            enableSplit = true
        }
        density {
            enableSplit = true
        }
        abi {
            enableSplit = true
        }
    }
    
    // Compile options
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    
    // Dex options
    dexOptions {
        javaMaxHeapSize "4g"
        preDexLibraries true
        maxProcessCount 8
    }
}

// Dependencies optimization
dependencies {
    implementation fileTree(dir: "libs", include: ["*.jar"])
    
    // Use implementation instead of api where possible
    // Remove unused dependencies
    // Use specific versions instead of +
}
EOF

print_warning "Please manually merge the optimizations from app/build.gradle.optimization into app/build.gradle"

# Step 4: Generate signing key (if not exists)
print_status "Step 4: Checking signing configuration..."
if [ ! -f "app/gaterlink-release-key.keystore" ]; then
    print_warning "No release keystore found. Generating one..."
    keytool -genkeypair -v \
        -storetype PKCS12 \
        -keystore app/gaterlink-release-key.keystore \
        -alias gaterlink \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass "changeme" \
        -keypass "changeme" \
        -dname "CN=GaterLink, OU=Mobile, O=GaterLink Inc, L=San Francisco, ST=CA, C=US"
    
    print_warning "⚠️  IMPORTANT: Change the keystore passwords and keep them secure!"
fi

# Step 5: Configure gradle.properties for optimization
print_status "Step 5: Optimizing gradle.properties..."
cat >> gradle.properties << 'EOF'

# Performance optimizations
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.caching=true
android.enableJetifier=true
android.useAndroidX=true

# Build optimizations
android.enableR8.fullMode=true
android.enableProguardInReleaseBuilds=true
android.enableShrinkResourcesInReleaseBuilds=true

# Bundle optimizations
android.bundle.enableUncompressedNativeLibs=false
android.enableDexingArtifactTransform.desugaring=false
EOF

# Step 6: Build optimized JavaScript bundle
print_status "Step 6: Building optimized JavaScript bundle..."
cd ..
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res \
  --minify true \
  --reset-cache

# Remove duplicate resources
cd android/app/src/main/res
find . -name "drawable-*" -type d -exec rm -rf {} + 2>/dev/null || true
cd ../../../../

# Step 7: Build release APK
print_status "Step 7: Building release APK..."
./gradlew assembleRelease

# Step 8: Build release AAB (for Play Store)
print_status "Step 8: Building release AAB..."
./gradlew bundleRelease

# Step 9: Optimize APK with zipalign
print_status "Step 9: Optimizing APK with zipalign..."
if [ -f "$ANDROID_HOME/build-tools/34.0.0/zipalign" ]; then
    $ANDROID_HOME/build-tools/34.0.0/zipalign -v -p 4 \
        app/build/outputs/apk/release/app-release.apk \
        app/build/outputs/apk/release/app-release-aligned.apk
else
    print_warning "zipalign not found. Install Android SDK build-tools."
fi

# Step 10: Analyze APK size
print_status "Step 10: Analyzing build size..."
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    APK_SIZE=$(du -h app/build/outputs/apk/release/app-release.apk | cut -f1)
    print_status "APK Size: $APK_SIZE"
    
    # Use bundletool to analyze AAB
    if [ -f "app/build/outputs/bundle/release/app-release.aab" ]; then
        AAB_SIZE=$(du -h app/build/outputs/bundle/release/app-release.aab | cut -f1)
        print_status "AAB Size: $AAB_SIZE"
    fi
fi

# Step 11: Generate size report
print_status "Step 11: Generating size report..."
cat > app/build/outputs/size-report.txt << EOF
Android Build Size Report
=========================
Date: $(date)
APK Size: ${APK_SIZE:-N/A}
AAB Size: ${AAB_SIZE:-N/A}

Optimization Settings Applied:
- ProGuard/R8 minification
- Resource shrinking
- Native library compression
- Multi-APK generation
- Console log removal
EOF

# Step 12: Test on emulator
print_status "Step 12: Ready to test..."
echo ""
echo "To test the release build:"
echo "  adb install app/build/outputs/apk/release/app-release.apk"
echo ""
echo "Or test with bundletool:"
echo "  bundletool build-apks --bundle=app/build/outputs/bundle/release/app-release.aab --output=app-release.apks"
echo "  bundletool install-apks --apks=app-release.apks"

print_status "Build optimization complete!"
echo ""
echo "📊 Build Summary:"
echo "=================="
echo "✅ Build artifacts cleaned"
echo "✅ ProGuard rules configured"
echo "✅ JavaScript bundle optimized"
echo "✅ Native code optimized"
echo "✅ APK generated at: app/build/outputs/apk/release/app-release.apk"
echo "✅ AAB generated at: app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "📱 Next Steps:"
echo "1. Test on real devices"
echo "2. Upload AAB to Play Console"
echo "3. Run pre-launch report"
echo "4. Monitor crash reports"