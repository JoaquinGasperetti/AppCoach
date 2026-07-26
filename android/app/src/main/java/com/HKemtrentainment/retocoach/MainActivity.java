package com.HKemtrentainment.retocoach;

import android.os.Bundle;
import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // El contenido ocupa toda la pantalla, por debajo de las barras.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Con la ventana en pantalla completa, adjustResize deja de funcionar:
        // hay que empujar el contenido a mano cuando aparece el teclado, o si no
        // tapa el campo de reflexión del día.
        View content = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(content, (view, insets) -> {
            Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
            view.setPadding(0, 0, 0, ime.bottom);
            return insets;
        });

        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // Al volver de otra app, o después de que el usuario revele las barras
        // deslizando, se vuelven a ocultar.
        if (hasFocus) {
            hideSystemBars();
        }
    }

    private void hideSystemBars() {
        WindowInsetsControllerCompat controller =
                new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        controller.hide(WindowInsetsCompat.Type.systemBars());
        // Deslizando desde un borde las barras aparecen un momento y se vuelven
        // a ir solas, sin reacomodar el contenido.
        controller.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
