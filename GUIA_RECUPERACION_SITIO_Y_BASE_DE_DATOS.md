# Guía de recuperación de Acción Animal

## 1. Objetivo

Esta guía explica cómo volver a poner en funcionamiento Acción Animal utilizando el paquete de respaldo cuando falle la base de datos, el servidor, la aplicación o la carpeta de fotografías y documentos.

Está dirigida a soporte técnico. El personal operativo debe avisar a soporte y no intentar restaurar la base de datos por su cuenta.

### Código de colores

| Color | Identifica | Ejemplos |
|---|---|---|
| <span style="color:#2563EB"><b>Azul</b></span> | Carpetas, rutas y proyectos | `E:\AccionAnimal\uploaded`, `01-base-de-datos` |
| <span style="color:#D97706"><b>Naranja</b></span> | Archivos | `schema.sql`, `data.sql`, `SHA256.csv` |
| <span style="color:#15803D"><b>Verde</b></span> | Programas y herramientas | PowerShell, Supabase CLI, Docker Desktop |

## 2. Antes de restaurar

1. Avisar que Acción Animal estará fuera de servicio.
2. Conservar el paquete original de respaldo. Trabajar sobre una copia, no sobre el único respaldo.
3. Confirmar que el paquete contiene `01-base-de-datos`, `03-uploaded`, `04-aplicacion`, `05-configuracion` y `06-verificacion`.
4. Abrir `06-verificacion` y revisar el informe y `SHA256.csv`.
5. No continuar si faltan `schema.sql`, `data.sql`, los archivos de historial o la copia de `uploaded`.
6. Registrar la fecha, la hora, la persona responsable y el paquete utilizado.

## 3. Identificar qué falló

### 3.1 Solo dejó de funcionar la aplicación web

Si `http://localhost:4173/api/health` no responde, pero la base de datos sigue disponible:

1. Confirmar que el equipo servidor esté encendido.
2. Abrir el <span style="color:#15803D"><b>Administrador de tareas</b></span> y comprobar si la tarea **Accion Animal - Servidor local** está ejecutándose.
3. Iniciar o reiniciar la tarea.
4. Abrir `http://localhost:4173/api/health`.
5. Si responde correctamente, abrir `http://localhost:4173` y probar el inicio de sesión.
6. No restaurar la base de datos si la base sigue funcionando.

### 3.2 Falló la aplicación, pero existen los archivos de instalación

1. Cerrar Acción Animal.
2. Abrir la <span style="color:#2563EB"><b>carpeta</b></span> `E:\AccionAnimal\app\accion-animal-supabase`.
3. Comparar la carpeta con la copia de `04-aplicacion`.
4. Restaurar únicamente los archivos que falten o estén dañados.
5. No copiar `.env.local` ni `.env.server` desde una ubicación sin cifrar.
6. Recuperar los secretos desde el administrador de contraseñas.
7. Iniciar la tarea **Accion Animal - Servidor local**.
8. Verificar `http://localhost:4173/api/health` y después `http://localhost:4173`.

### 3.3 Falló la carpeta de fotografías o documentos

1. Cerrar Acción Animal.
2. Renombrar la carpeta dañada `E:\AccionAnimal\uploaded` como `uploaded-danada` solo si soporte ya verificó que la copia externa está completa.
3. Crear nuevamente `E:\AccionAnimal\uploaded`.
4. Copiar allí el contenido de `03-uploaded`.
5. Abrir varias fotografías y documentos de diferentes carpetas.
6. Iniciar la aplicación y comprobar que los archivos se muestran.

## 4. Recuperar la base de datos en Supabase

### 4.1 Confirmar si el proyecto original todavía responde

1. Abrir [Supabase Dashboard](https://supabase.com/dashboard/project/hvfubwyzarikudisbwfy) e iniciar sesión.
2. Abrir **Database → Table Editor**.
3. Consultar una tabla principal de Acción Animal.
4. Si la tabla y sus datos responden, no crear otro proyecto. Soporte debe diagnosticar la aplicación y conservar el respaldo.
5. Si la base no responde temporalmente, comprobar primero el estado del proyecto y solicitar al administrador que confirme la incidencia. No crear todavía otro proyecto por una interrupción de red o mantenimiento. Solo si el administrador confirma que la base se perdió o no puede recuperarse, continuar con la recuperación en un proyecto nuevo.

### 4.2 Crear el proyecto de reemplazo

1. En <span style="color:#15803D"><b>Supabase Dashboard</b></span>, crear un proyecto nuevo en la misma región o en la región aprobada por el administrador. En el plan Free, este es el procedimiento previsto cuando el proyecto original no puede recuperarse; no se debe asumir que **Database → Backups** o PITR estarán disponibles.
2. Guardar de forma segura el nuevo **Project URL**, **Project reference** y contraseña de base de datos.
3. No borrar el proyecto original.
4. Esperar a que el nuevo proyecto indique que la base de datos está disponible.
5. Preparar en <span style="color:#15803D"><b>Docker Desktop</b></span> y <span style="color:#15803D"><b>PowerShell</b></span> la <span style="color:#2563EB"><b>carpeta</b></span> `E:\AccionAnimal\app\accion-animal-supabase`.

### 4.3 Restaurar la base de datos

Usar los archivos del respaldo en este orden:

1. `roles.sql`: roles y permisos.
2. `schema.sql`: tablas, índices, funciones, triggers y políticas de los esquemas incluidos.
3. `data.sql`: datos, incluidos los usuarios de `auth` que hayan sido exportados.
4. `migration-history-schema.sql` y `migration-history-data.sql`: historial de migraciones.
5. `auth-storage-custom.sql`: cambios personalizados en `auth` y `storage`, como triggers y políticas RLS.

#### Preparar la restauración

1. Confirmar que el nuevo proyecto ya tenga la base de datos disponible.
2. En <span style="color:#15803D"><b>Supabase Dashboard</b></span>, abrir **Connect**, elegir la conexión **Session pooler** y pulsar el botón de copiar que aparece junto a la cadena de conexión de PostgreSQL. Esta cadena contiene la dirección, el usuario, el puerto y la contraseña del proyecto nuevo; por eso `psql` la necesita para saber dónde restaurar los archivos.
3. Mantener la cadena copiada temporalmente en el portapapeles. No pegarla en este documento ni guardarla en un archivo.
4. Conectar el disco externo y abrir <span style="color:#15803D"><b>PowerShell</b></span> desde el menú Inicio.
5. Confirmar que `psql` esté instalado:

   ```powershell
   psql --version
   ```

6. En PowerShell, indicar la carpeta de respaldo y preparar el lugar donde se pegará la conexión:

   ```powershell
   $backup = 'R:\Respaldos\AccionAnimal\2026-09-19_2200\01-base-de-datos'
   $dbUrl = Read-Host 'Pegue la cadena de conexión del proyecto nuevo'
   ```

   Después de pulsar **Enter** en la segunda línea, PowerShell mostrará el mensaje `Pegue la cadena de conexión del proyecto nuevo:`. En ese momento, hacer clic dentro de la ventana de PowerShell, pulsar **Ctrl+V** para pegar la cadena copiada desde Supabase y pulsar **Enter**. La cadena queda guardada temporalmente en la variable `$dbUrl`; no se crea ningún archivo. Cambiar `R:` y la fecha por la ubicación real. Cerrar la ventana al terminar para eliminar la conexión de la memoria.

#### Ejecutar los archivos en orden

No ejecutar todos los archivos a ciegas. Después de cada paso, revisar el mensaje y confirmar que PowerShell no muestre un error.

1. Restaurar roles y permisos:

   ```powershell
   psql.exe --dbname "$dbUrl" --single-transaction --set=ON_ERROR_STOP=on --file "$backup\roles.sql"
   ```

2. Restaurar estructura, funciones, triggers y políticas:

   ```powershell
   psql.exe --dbname "$dbUrl" --single-transaction --set=ON_ERROR_STOP=on --file "$backup\schema.sql"
   ```

3. Restaurar datos:

   ```powershell
   psql.exe --dbname "$dbUrl" --single-transaction --set=ON_ERROR_STOP=on --file "$backup\data.sql"
   ```

4. Restaurar el esquema y el contenido del historial de migraciones:

   ```powershell
   psql.exe --dbname "$dbUrl" --single-transaction --set=ON_ERROR_STOP=on --file "$backup\migration-history-schema.sql"
   psql.exe --dbname "$dbUrl" --single-transaction --set=ON_ERROR_STOP=on --file "$backup\migration-history-data.sql"
   ```

5. Revisar el tamaño de `auth-storage-custom.sql`. Si tiene tamaño mayor que cero, aplicar los cambios personalizados:

   ```powershell
   Get-Item -LiteralPath "$backup\auth-storage-custom.sql" | Select-Object Name,Length
   psql.exe --dbname "$dbUrl" --single-transaction --set=ON_ERROR_STOP=on --file "$backup\auth-storage-custom.sql"
   ```

   Si el archivo tiene tamaño cero, no ejecutar el segundo comando y registrar en `06-verificacion` que no había cambios personalizados para aplicar.

6. Si cualquier comando devuelve un error, detenerse, conservar el texto del error y no ejecutar el siguiente archivo. No borrar líneas ni editar los SQL para ocultar el error.
7. Registrar en `06-verificacion` la fecha, hora, archivo ejecutado, resultado y cualquier error.
8. Cerrar PowerShell para eliminar de la memoria la cadena de conexión.

No abrir los archivos SQL con Word ni modificarlos sin guardar primero una copia. La restauración debe ejecutarla soporte con `psql` o con la herramienta aprobada. Si falla `schema.sql`, detener la restauración y corregir primero ese error. Si falla `data.sql` por una diferencia de versión de PostgreSQL, no borrar líneas: guardar el error y solicitar revisión del administrador.

### 4.4 Comprobar la recuperación de Auth, funciones y triggers

1. En el nuevo proyecto, abrir **Authentication → Users** y comprobar que existan usuarios recuperados.
2. Abrir una tabla principal y confirmar que sus registros estén presentes.
3. Abrir **Database → Functions** y comprobar las funciones propias de la aplicación.
4. Abrir la sección de triggers y confirmar los triggers de las tablas principales.
5. Revisar `auth-storage-custom.sql` y confirmar que los cambios propios de `auth` y `storage` se hayan aplicado.
6. Recordar que las claves JWT, proveedores OAuth, SMTP, secretos y configuraciones del proyecto no se restauran solo con los SQL; deben configurarse de nuevo desde `05-configuracion` y el administrador de contraseñas.

## 5. Recuperar la aplicación contra el proyecto nuevo

1. Abrir la <span style="color:#2563EB"><b>carpeta</b></span> `04-aplicacion` del respaldo.
2. Copiar el contenido a `E:\AccionAnimal\app\accion-animal-supabase`.
3. Recuperar la configuración aprobada desde `05-configuracion`.
4. Actualizar la URL y las claves del proyecto nuevo solo en los archivos de configuración protegidos.
5. No pegar claves de servicio en este documento, en la bitácora ni en el PDF.
6. Revisar `package.json`, `package-lock.json`, `supabase\migrations`, `supabase\functions` y `supabase\config.toml`.
7. Iniciar **Accion Animal - Servidor local**.
8. Verificar `http://localhost:4173/api/health`.
9. Abrir `http://localhost:4173`, iniciar sesión y probar una consulta, un registro y un archivo.

## 6. Recuperar Edge Functions y configuración externa

Las Edge Functions no se restauran mediante `schema.sql`. Soporte debe:

1. Copiar `supabase\functions` desde `04-aplicacion`.
2. Revisar en Supabase Dashboard la lista de funciones desplegadas.
3. Volver a desplegar las funciones en el proyecto nuevo con la herramienta aprobada.
4. Volver a registrar sus secretos desde el administrador de contraseñas.
5. Probar cada función desde la aplicación.

## 7. Si falló todo el equipo servidor

1. Preparar un equipo Windows aprobado.
2. Crear únicamente estas ubicaciones: `E:\AccionAnimal\app\accion-animal-supabase` y `E:\AccionAnimal\uploaded`.
3. Instalar las herramientas de soporte descritas en la guía de respaldos.
4. Restaurar `04-aplicacion` en la carpeta de la aplicación.
5. Restaurar `03-uploaded` en `E:\AccionAnimal\uploaded`.
6. Recuperar la tarea **Accion Animal - Servidor local**.
7. Configurar los secretos desde el administrador de contraseñas.
8. Si también falló Supabase, completar primero la sección 4 y actualizar la configuración de la aplicación.
9. Probar la salud, el inicio de sesión, una operación de base de datos y la apertura de archivos.

## 8. Criterio para declarar la recuperación terminada

La recuperación solo se considera terminada cuando:

- `http://localhost:4173/api/health` responde correctamente;
- la web abre en `http://localhost:4173`;
- un usuario puede iniciar sesión;
- una tabla principal permite consultar y guardar información;
- una fotografía y un documento se pueden abrir;
- las funciones, triggers y reglas principales fueron comprobados;
- `06-verificacion` contiene el informe de recuperación, los errores y las pruebas realizadas.

No borrar el paquete original de respaldo hasta que el administrador confirme que la recuperación fue aceptada.

## 9. Referencias oficiales

- [Supabase: Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Supabase: Database Backups](https://supabase.com/docs/guides/platform/backups)
