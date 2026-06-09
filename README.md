# Laura vs Eze Railway V2

Novedades:
- Foto de perfil para Eze y Lau.
- Borrado de publicaciones y archivos subidos.
- Más desafíos, preguntas, películas y opciones de ruleta.
- Más juegos:
  - Atrapa helados
  - Atrapa corazones
  - Click rápido
  - Memoria de emojis
- Respuestas debajo de cada sección.

## Cómo actualizar

1. Reemplazá en tu repo:
   - server.js
   - package.json
   - public/index.html
   - public/styles.css
   - public/app.js
2. Hacé commit y push.
3. Railway redeploya solo.

## Importante

La base se migra sola: agrega avatar_url, points y meta si faltan.
No hace falta borrar la base anterior.

## Variables

SESSION_SECRET=clave_larga
EZE_PASSWORD=clave_eze
LAU_PASSWORD=clave_lau
