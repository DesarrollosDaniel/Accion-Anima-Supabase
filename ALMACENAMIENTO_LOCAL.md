# Instalación local con Supabase y la carpeta `uploaded`

## Resultado

Una PC Windows funciona como servidor dentro del consultorio:

- Supabase Free conserva la base de datos, usuarios y sesiones.
- El disco de esa PC conserva imágenes y documentos.
- Las demás computadoras abren la aplicación con la IP local de la PC servidor.
- No se necesita dominio, GitHub Pages, Tailscale ni abrir puertos en el módem Arris.
- Las rutas históricas `uploaded/...` y `uploaded/clinicos/...` se mantienen.

La aplicación requiere Internet para comunicarse con Supabase. Si se cae Internet, los archivos siguen en el disco, pero no se podrá iniciar sesión ni consultar la base de datos hasta recuperar la conexión.

## Antes de mover el sistema

1. Elige la PC Windows que permanecerá encendida durante el horario de uso.
2. Conéctala al módem por cable Ethernet si es posible.
3. Instala Node.js 22 LTS o una versión LTS posterior.
4. Prepara un disco con al menos 50 GB libres. Hoy la carpeta ocupa aproximadamente 15.8 GB, pero conviene dejar margen para crecimiento y respaldos.
5. Crea dos carpetas, por ejemplo:

   ```text
   D:\AccionAnimal\app
   D:\AccionAnimal\uploaded
   ```

6. Copia el contenido de este proyecto a `D:\AccionAnimal\app`.
7. Copia **el contenido** de la carpeta histórica que hoy corresponde a `uploaded\uploaded` dentro de `D:\AccionAnimal\uploaded`.

El resultado debe verse así:

```text
D:\AccionAnimal\uploaded\foto.jpg
D:\AccionAnimal\uploaded\clinicos\36\archivos\1679520418\archivo.pdf
```

No debe quedar un nivel duplicado como `D:\AccionAnimal\uploaded\uploaded\...`.

## Configurar la PC servidor

En `D:\AccionAnimal\app\accion-animal-supabase`, copia `.env.example` como `.env.local`. Conserva la URL y clave publicable actuales de Supabase y configura:

```dotenv
AA_STORAGE_ROOT=D:\AccionAnimal\uploaded
AA_HOST=0.0.0.0
AA_PORT=4173
AA_MAX_UPLOAD_BYTES=52428800
```

No coloques la clave `service_role` de Supabase en este archivo ni en la aplicación.

Abre PowerShell en esa carpeta y ejecuta:

```powershell
npm ci
npm run local
```

`npm run local` compila la aplicación y levanta el servidor completo en el puerto fijo `4173`. No uses `npm run dev` en la PC servidor: ese comando solo inicia la interfaz y mostrará que el almacenamiento local no está disponible.

La consola debe mostrar que Acción Animal está disponible y que el almacenamiento local está preparado. Mantén esa ventana abierta mientras uses el sistema; para iniciarlo automáticamente con Windows, sigue [`SERVICIO_SIEMPRE_ACTIVO.md`](SERVICIO_SIEMPRE_ACTIVO.md).

## Permitir acceso en la red local

Ejecuta PowerShell como administrador en la PC servidor y crea una regla limitada al perfil de red privada:

```powershell
New-NetFirewallRule -DisplayName "Accion Animal local 4173" -Direction Inbound -Protocol TCP -LocalPort 4173 -Action Allow -Profile Private
```

No configures `Port Forwarding`, `Virtual Server`, `NAT` ni `DMZ` en el módem Arris.

Comprueba que la conexión de Windows esté marcada como **Red privada**. Obtén la IPv4 de la PC servidor con:

```powershell
ipconfig
```

Desde otra computadora conectada al mismo módem, abre, por ejemplo:

```text
http://192.168.0.25:4173
```

Sustituye `192.168.0.25` por la IPv4 real del servidor. Conviene reservar esa IP para la PC en la configuración DHCP del módem o asignarle una IP fija dentro de la red local.

## Crear accesos

No se necesitan enlaces de invitación, dominio ni configuración de redirecciones. En la sección **Usuarios**, el dueño escribe el nombre, correo, rol y contraseña de la persona.

Supabase valida los datos en ese instante y deja la cuenta confirmada. Si el correo ya existe o la contraseña no cumple las reglas, la pantalla muestra el error y no crea un acceso incompleto. Solamente el rol `owner` puede ejecutar esta operación; las claves administrativas permanecen dentro de la función segura de Supabase.

## Seguridad y permisos

- Nadie puede leer `/uploaded/...` sin iniciar sesión con un usuario activo de Supabase.
- Dueño y Veterinaria pueden escribir y eliminar archivos clínicos.
- Recepción puede agregar fotos principales, pero no modificar archivos clínicos.
- El servidor rechaza rutas que intenten salir de la carpeta configurada y no muestra listados de directorios.
- Las sesiones locales se guardan solamente en memoria; al reiniciar el servidor, cada usuario vuelve a iniciar sesión.

## Respaldos recomendados

Usa dos destinos distintos:

1. copia diaria incremental de `D:\AccionAnimal\uploaded` a un disco USB que no permanezca siempre conectado;
2. copia semanal en otro disco o ubicación física.

Supabase respalda la base de datos según las condiciones del plan, pero no respalda esta carpeta local. Antes de borrar duplicados o archivos sin referencia, conserva una copia completa verificada.

## Comprobación rápida

En la PC servidor abre:

```text
http://localhost:4173/api/health
```

Debe responder con `"ok":true`. Después inicia sesión en `http://localhost:4173`. Las mascotas cuyo campo `photo_path` contenga un nombre o una ruta `uploaded/...` mostrarán la imagen servida desde el disco local.
