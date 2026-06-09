# Laura vs Eze - Railway

App privada con:

- Login simple: eze / lau
- Clave por defecto: 1234
- Desafíos
- Aburrimiento 0%
- Subida de fotos, videos, audios y documentos
- Respuestas debajo de cada sección
- Galería
- Ranking de puntos
- Juego Atrapa Helados

## Deploy en Railway

1. Crear un repo en GitHub.
2. Subir estos archivos.
3. En Railway, crear New Project.
4. Elegir Deploy from GitHub Repo.
5. Seleccionar el repo.
6. Railway detecta Node.js.
7. Deploy.

## Variables recomendadas en Railway

En Variables:

```env
SESSION_SECRET=una_clave_larga_random
EZE_PASSWORD=tu_clave_para_eze
LAU_PASSWORD=tu_clave_para_lau
```

Opcional:

```env
DATA_DIR=/app/data
UPLOAD_DIR=/app/uploads
```

## Importante sobre Railway y archivos

Para que no se pierdan la base SQLite y los archivos subidos en cada redeploy, conviene agregar un Volume en Railway y montarlo en:

```text
/app/data
/app/uploads
```

Si no agregás volumen, puede funcionar, pero los datos podrían perderse en redeploys.

## Límites

El límite de archivo está en 80 MB.
Podés cambiarlo en `server.js`:

```js
fileSize: 80 * 1024 * 1024
```
