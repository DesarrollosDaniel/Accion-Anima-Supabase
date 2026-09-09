# Publicación en GitHub Pages

El proyecto ya contiene el workflow `.github/workflows/deploy-pages.yml`. Se ejecutará automáticamente con cada cambio enviado a la rama `main` y también puede iniciarse manualmente desde la pestaña **Actions**.

## Datos que harán falta

- nombre de la cuenta u organización de GitHub;
- nombre del repositorio;
- URL pública resultante, normalmente `https://USUARIO.github.io/REPOSITORIO/`;
- acceso al repositorio para configurar GitHub Pages y dos variables de Actions.

No se debe copiar `.env.local` al repositorio. El archivo está ignorado por Git y contiene solamente la configuración de esta computadora.

## Primera publicación

1. Crear un repositorio vacío en GitHub, sin README, licencia ni `.gitignore` adicionales.
2. En el repositorio abrir **Settings → Secrets and variables → Actions → Variables** y crear:

   | Variable | Valor |
   | --- | --- |
   | `VITE_SUPABASE_URL` | La URL del proyecto Supabase, con formato `https://PROYECTO.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | La clave publicable `sb_publishable_...` |

   Estos valores se incluyen en la aplicación que ejecuta el navegador. Nunca debe usarse una clave secreta ni `service_role`.

3. Desde esta carpeta, asociar el repositorio y enviar la rama `main`:

   ```powershell
   git remote add origin https://github.com/USUARIO/REPOSITORIO.git
   git push -u origin main
   ```

4. Abrir **Settings → Pages** y elegir **GitHub Actions** como origen de publicación.
5. Si la primera ejecución estaba esperando esta configuración, abrir **Actions → Publicar en GitHub Pages → Run workflow**. Al finalizar, GitHub mostrará la dirección pública.

## Conectar la URL pública con Supabase

Una vez conocida la URL exacta de GitHub Pages, se deben realizar dos cambios:

1. En Supabase abrir **Authentication → URL Configuration**:
   - establecer **Site URL** con la URL pública exacta;
   - agregar la misma URL exacta a **Redirect URLs**;
   - conservar `http://127.0.0.1:5173/**` para desarrollo local.
2. Actualizar la URL usada por la función de invitaciones:

   ```powershell
   npx --yes supabase@2.117.0 secrets set APP_URL=https://USUARIO.github.io/REPOSITORIO/ --project-ref hvfubwyzarikudisbwfy
   ```

La barra `/` final es importante. Después de actualizar `APP_URL` no hace falta volver a desplegar la función.

## Verificación final

- abrir la página publicada en una ventana privada;
- comprobar que aparezca el inicio de sesión;
- iniciar sesión con el dueño;
- invitar una cuenta de prueba;
- abrir el correo y confirmar que el enlace regrese a la página pública;
- crear la contraseña y comprobar que el nuevo usuario vea las mascotas, pero no la sección exclusiva del dueño.

La carpeta histórica `uploaded/` no debe subirse a GitHub. La migración de esos archivos se hará aparte al servicio de almacenamiento elegido.
