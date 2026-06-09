# Centro Anti Aburrimiento - Laura vs Eze

Página estática lista para GitHub Pages.

## Importante

Esta versión tiene:
- Registro simple con usuario y clave.
- Login.
- Guardado de respuestas.
- Lista de respuestas guardadas.
- Descarga de respuestas en JSON.

## Cómo guarda datos

Guarda todo con `localStorage`, o sea en el navegador donde se usa la página.

Esto sirve para GitHub Pages porque no necesita base de datos.

Limitación:
- Si Laura entra desde su celular, sus respuestas quedan en su celular.
- Si Eze entra desde su PC, sus respuestas quedan en su PC.
- Para compartir respuestas en tiempo real entre ambos dispositivos, hay que usar Firebase, Supabase o un backend PHP/MySQL.

## Cómo subir a GitHub Pages

1. Crear repositorio en GitHub.
2. Subir:
   - index.html
   - styles.css
   - script.js
   - README.md
3. Ir a Settings > Pages.
4. Elegir Branch: main.
5. Carpeta: /root.
6. Guardar.
