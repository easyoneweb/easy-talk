const {
  withMainApplication,
  withDangerousMod,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const PACKAGE_PATH = 'ru/easyoneweb/easytalk/gifkeyboard';

const KOTLIN_FILES = {
  'GifEditText.kt': `package ru.easyoneweb.easytalk.gifkeyboard

import android.content.Context
import android.os.Build
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import android.view.inputmethod.InputMethodManager
import androidx.core.view.inputmethod.EditorInfoCompat
import androidx.core.view.inputmethod.InputConnectionCompat
import com.facebook.react.views.textinput.ReactEditText
import java.io.File
import java.util.concurrent.Executors

/**
 * Subclass of ReactEditText that overrides onCreateInputConnection to:
 * 1. Declare supported image MIME types so keyboards (Gboard etc.) show the GIF button.
 * 2. Wrap the InputConnection with InputConnectionCompat to receive commitContent callbacks.
 * 3. Copy the content:// URI to a temp file:// path on a background thread so RN's XHR
 *    and expo-image can read it. Emits onGifLoading immediately, then onGifReceived when done.
 */
class GifEditText(context: Context) : ReactEditText(context) {

    var onGifLoading: (() -> Unit)? = null
    var onGifCommitted: ((uri: String, mime: String) -> Unit)? = null

    override fun onCreateInputConnection(outAttrs: EditorInfo): InputConnection? {
        val ic = super.onCreateInputConnection(outAttrs) ?: return null

        EditorInfoCompat.setContentMimeTypes(
            outAttrs,
            arrayOf("image/gif", "image/png", "image/jpeg", "image/webp")
        )

        val callback = InputConnectionCompat.OnCommitContentListener { inputContentInfo, flags, _ ->
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N_MR1 &&
                (flags and InputConnectionCompat.INPUT_CONTENT_GRANT_READ_URI_PERMISSION) != 0
            ) {
                try {
                    inputContentInfo.requestPermission()
                } catch (e: Exception) {
                    return@OnCommitContentListener false
                }
            }

            // Dismiss the keyboard immediately
            val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
            imm?.hideSoftInputFromWindow(windowToken, 0)

            // Notify JS that a GIF is being prepared
            onGifLoading?.invoke()

            val mime = inputContentInfo.description
                .takeIf { it.mimeTypeCount > 0 }
                ?.getMimeType(0) ?: "image/gif"

            val ext = mime.substringAfter("/").let { if (it.contains("+")) it.substringBefore("+") else it }
            val tempFile = File(context.cacheDir, "gif_keyboard_\${System.currentTimeMillis()}.\$ext")

            // Copy on a background thread to avoid blocking the main thread
            Executors.newSingleThreadExecutor().execute {
                try {
                    context.contentResolver.openInputStream(inputContentInfo.contentUri)?.use { input ->
                        tempFile.outputStream().use { output -> input.copyTo(output) }
                    }
                    onGifCommitted?.invoke("file://\${tempFile.absolutePath}", mime)
                } catch (e: Exception) {
                    onGifCommitted?.invoke(inputContentInfo.contentUri.toString(), mime)
                } finally {
                    inputContentInfo.releasePermission()
                }
            }

            true
        }

        return InputConnectionCompat.createWrapper(ic, outAttrs, callback)
    }
}
`,

  'GifTextInputManager.kt': `package ru.easyoneweb.easytalk.gifkeyboard

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.textinput.ReactEditText
import com.facebook.react.views.textinput.ReactTextInputManager

/**
 * Replaces ReactTextInputManager to return GifEditText instances.
 * Registered under the same name ("AndroidTextInput") so it overrides the default.
 * Works with New Architecture (Fabric) — GIF support is at the EditText/InputConnection
 * level which the IME framework calls regardless of RN architecture.
 */
class GifTextInputManager(
    private val reactContext: ReactApplicationContext
) : ReactTextInputManager() {

    override fun createViewInstance(context: ThemedReactContext): ReactEditText {
        val editText = GifEditText(context)
        editText.onGifLoading = {
            if (reactContext.hasActiveReactInstance()) {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(GifKeyboardModule.EVENT_LOADING, null)
            }
        }
        editText.onGifCommitted = { uri, mime ->
            if (reactContext.hasActiveReactInstance()) {
                val params = Arguments.createMap().apply {
                    putString("uri", uri)
                    putString("mime", mime)
                }
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(GifKeyboardModule.EVENT_NAME, params)
            }
        }
        return editText
    }
}
`,

  'GifKeyboardModule.kt': `package ru.easyoneweb.easytalk.gifkeyboard

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Minimal NativeModule needed for DeviceEventEmitter listener management on New Architecture.
 * Actual GIF interception happens in GifTextInputManager / GifEditText.
 */
class GifKeyboardModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "GifKeyboard"
        const val EVENT_NAME = "onGifReceived"
        const val EVENT_LOADING = "onGifLoading"
    }

    override fun getName() = NAME

    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}
}
`,

  'GifKeyboardPackage.kt': `package ru.easyoneweb.easytalk.gifkeyboard

import com.facebook.react.ReactPackage
import com.facebook.react.ViewManagerOnDemandReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * Implements ViewManagerOnDemandReactPackage so Fabric's BridgelessViewManagerResolver
 * picks up GifTextInputManager via the lazy lookup before MainReactPackage returns its
 * ReactTextInputManager for "AndroidTextInput".
 * Must be inserted at index 0 in the package list (before MainReactPackage).
 */
class GifKeyboardPackage : ReactPackage, ViewManagerOnDemandReactPackage {

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(GifKeyboardModule(reactContext))

    // Not used by Fabric (ViewManagerOnDemandReactPackage path is used instead)
    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()

    override fun getViewManagerNames(reactContext: ReactApplicationContext): Collection<String> =
        listOf("AndroidTextInput")

    override fun createViewManager(
        reactContext: ReactApplicationContext,
        viewManagerName: String
    ): ViewManager<*, *>? {
        if (viewManagerName == "AndroidTextInput") {
            return GifTextInputManager(reactContext)
        }
        return null
    }
}
`,
};

function withGifKeyboardKotlinFiles(config) {
  return withDangerousMod(config, [
    'android',
    (mod) => {
      const projectRoot = mod.modRequest.projectRoot;
      const androidSrc = path.join(
        projectRoot,
        'android/app/src/main/java',
        PACKAGE_PATH,
      );
      fs.mkdirSync(androidSrc, { recursive: true });
      for (const [filename, content] of Object.entries(KOTLIN_FILES)) {
        fs.writeFileSync(path.join(androidSrc, filename), content, 'utf8');
      }
      return mod;
    },
  ]);
}

function withGifKeyboardMainApplication(config) {
  return withMainApplication(config, (mod) => {
    let contents = mod.modResults.contents;

    const importLine =
      'import ru.easyoneweb.easytalk.gifkeyboard.GifKeyboardPackage';
    const packageRegistration = 'add(0, GifKeyboardPackage())';

    if (!contents.includes(importLine)) {
      contents = contents.replace(
        'import com.facebook.react.PackageList',
        `import com.facebook.react.PackageList\n${importLine}`,
      );
    }

    if (!contents.includes(packageRegistration)) {
      contents = contents.replace(
        /PackageList\(this\)\.packages\.apply \{[^}]*\}/s,
        (match) => {
          // Replace the comment placeholder with our registration
          const replaced = match.replace(
            /\s*\/\/[^\n]*\n\s*\/\/[^\n]*\n/,
            `\n          ${packageRegistration}\n        `,
          );
          // If replacement didn't find the comment pattern, just append before closing brace
          if (replaced === match) {
            return match.replace(
              /(\s*\})$/,
              `\n          ${packageRegistration}$1`,
            );
          }
          return replaced;
        },
      );
    }

    mod.modResults.contents = contents;
    return mod;
  });
}

module.exports = function withGifKeyboard(config) {
  config = withGifKeyboardKotlinFiles(config);
  config = withGifKeyboardMainApplication(config);
  return config;
};
