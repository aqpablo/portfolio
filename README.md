# Portfolio · Pablo · Nexus Consulting

Casos de estudio de consultoría en tecnología y gestión para pymes.

**Sitio:** https://USUARIO.github.io/portfolio/  ·  **Editor:** https://USUARIO.github.io/portfolio/admin/

## Estructura

```
index.html          esqueleto de la página
css/styles.css      diseño
js/app.js           arma la página a partir del contenido
content/site.json   todos los textos, casos, secciones, colores y tipografías
img/                capturas de los casos
admin/              editor visual del contenido
tools/              utilidades (versión en un solo archivo)
```

## Cómo editar sin tocar código

1. Entrá a `/admin/` del sitio publicado.
2. Editá textos, casos, secciones, colores o tipografías. La vista previa se actualiza sola.
3. Tocá **Descargar site.json**.
4. En GitHub, entrá a la carpeta `content`, usá **Add file → Upload files** y subí el archivo descargado (reemplaza al anterior). Confirmá con **Commit changes**.
5. En uno o dos minutos el sitio publicado muestra los cambios.

Si cerrás el editor sin descargar, los cambios quedan guardados en ese navegador y te los ofrece recuperar la próxima vez.

**Imágenes nuevas:** subilas a la carpeta `img/` del repositorio y, en el editor, escribí la ruta (por ejemplo `img/mi-captura.jpg`) en el bloque de imágenes del caso.

**Formato de texto:** `**negrita**`, `*cursiva*`. En los chips, empezar con `*` lo destaca en color.

## Verlo en tu computadora

Abrir `index.html` con doble clic no funciona (el navegador bloquea la lectura de `site.json`). Con Python instalado, desde esta carpeta:

```
python -m http.server 8000
```

y entrá a http://localhost:8000 (el editor queda en http://localhost:8000/admin/).

## Versión en un solo archivo

`python tools/build-single.py` genera `dist/portfolio.html`, con todo incrustado, para mandar por mail o abrir sin servidor.
