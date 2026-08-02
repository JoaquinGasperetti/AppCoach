# ═══════════ Reglas de R8 para Reto 7D ═══════════
#
# Capacitor descubre los plugins y sus métodos por reflexión, a partir de
# anotaciones. R8 no puede seguir ese rastro: si no se conservan de forma
# explícita, la compilación pasa sin errores y la app falla en el teléfono
# al invocar un plugin. Por eso todo lo que se resuelve por reflexión se
# marca acá.

# ─── Núcleo de Capacitor ───
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep enum com.getcapacitor.** { *; }

# Plugins: la clase, sus métodos anotados y las que heredan de Plugin
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod <methods>;
}

# Plugins instalados en este proyecto
-keep class com.capacitorjs.plugins.** { *; }
-keep class com.getcapacitor.community.admob.** { *; }

# ─── Puente con el WebView ───
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ─── Clases propias de la app ───
-keep class com.HKemtrentainment.retocoach.** { *; }

# ─── Anuncios y consentimiento ───
# Ambas librerías traen sus propias reglas, pero se refuerza lo que se
# resuelve por reflexión desde la capa web.
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.ump.** { *; }

# ─── Utilidades ───
# JSON: Capacitor serializa los argumentos de los plugins con estas clases.
-keep class org.json.** { *; }

# Deja legibles los rastros de error de Play Console.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Silencia avisos de referencias opcionales que no se usan.
-dontwarn org.jetbrains.annotations.**
