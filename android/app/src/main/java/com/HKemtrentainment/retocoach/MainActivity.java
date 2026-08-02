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

        // Dibujando de extremo a extremo la ventana ya no reserva espacio por
        // sí sola, así que el contenido se aparta a mano de tres cosas:
        //
        //  · el recorte de pantalla (muesca o cámara), para que no tape el
        //    logo ni el botón del menú;
        //  · las barras del sistema, por si el usuario las revela o el
        //    dispositivo las impone;
        //  · el teclado, que si no cubre el campo de reflexión del día.
        //
        // En pantalla completa adjustResize no alcanza: hay que calcularlo.
        View content = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(content, (view, insets) -> {
            Insets recorte = insets.getInsets(
                    WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.systemBars());
            Insets teclado = insets.getInsets(WindowInsetsCompat.Type.ime());

            view.setPadding(
                    recorte.left,
                    recorte.top,
                    recorte.right,
                    Math.max(recorte.bottom, teclado.bottom));
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
