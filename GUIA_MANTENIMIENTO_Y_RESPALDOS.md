# Guía de respaldos y recuperación de Acción Animal

## 1. Alcance

Esta guía explica, paso a paso, cómo respaldar y recuperar la instalación definitiva de Acción Animal sin depender de comandos.

### Código de colores

| Color | Identifica | Ejemplos |
|---|---|---|
| <span style="color:#2563EB"><b>Azul</b></span> | Carpetas y rutas | <span style="color:#2563EB"><b>E:\AccionAnimal\uploaded</b></span> |
| <span style="color:#D97706"><b>Naranja</b></span> | Archivos | <span style="color:#D97706"><b>schema.sql</b></span>, <span style="color:#D97706"><b>data.sql</b></span> |
| <span style="color:#15803D"><b>Verde</b></span> | Programas, CLI y herramientas | Supabase CLI, PowerShell, Docker Desktop |

Las etiquetas de color sirven para identificar rápidamente qué se debe abrir, qué se debe copiar y qué programa se debe ejecutar.

La instalación definitiva utiliza únicamente estas ubicaciones:

| Elemento | Ubicación definitiva |
|---|---|
| Aplicación | <span style="color:#2563EB"><b>E:\AccionAnimal\app\accion-animal-supabase</b></span> |
| Fotografías y documentos | <span style="color:#2563EB"><b>E:\AccionAnimal\uploaded</b></span> |
| Servidor local | <span style="color:#2563EB"><b>http://localhost:4173</b></span> |
| Comprobación del servidor | <span style="color:#2563EB"><b>http://localhost:4173/api/health</b></span> |
| Tarea de inicio | <span style="color:#2563EB"><b>Accion Animal - Servidor local</b></span> |
| Proyecto Supabase | <span style="color:#2563EB"><b>hvfubwyzarikudisbwfy</b></span> |

Los respaldos deben guardarse en un disco externo cifrado. No se debe inventar otra ubicación dentro de la instalación ni guardar respaldos dentro de <span style="color:#2563EB"><b>uploaded</b></span>.

> **Nota:** los pasos de Supabase que requieren exportar la base de datos completa deben hacerlos el administrador o soporte técnico. Si no aparece la opción indicada, no se debe improvisar: hay que solicitar la exportación técnica y conservar el resultado en el disco externo.

## 2. Qué debe respaldarse

Un respaldo completo incluye cinco grupos:

1. **Base de datos:** datos, tablas, relaciones, índices, funciones, triggers, reglas RLS, usuarios y configuración propia.
2. **Archivos:** toda la carpeta <span style="color:#2563EB"><b>E:\AccionAnimal\uploaded</b></span>.
3. **Aplicación:** el contenido de <span style="color:#2563EB"><b>E:\AccionAnimal\app\accion-animal-supabase</b></span>.
4. **Funciones y configuración:** Edge Functions, configuración del servidor, tarea de Windows y secretos guardados en el administrador de contraseñas.
5. **Información para migración:** exportación por tabla y un registro de qué reglas o funciones deberán adaptarse si se cambia a MySQL.

La base de datos no contiene las fotografías ni los documentos físicos. Copiar solo la base de datos no es suficiente.

## 3. Preparación general

Antes de cualquier respaldo:

1. Avisar a todas las personas usuarias que se hará un respaldo.
2. Confirmar que nadie esté usando Acción Animal.
3. En el servidor, cerrar la aplicación y verificar que la tarea **Accion Animal - Servidor local** no esté ejecutándose durante la copia.
4. Conectar el disco externo cifrado.
5. Crear en el disco externo una carpeta con la fecha y hora, por ejemplo <span style="color:#2563EB"><b>2026-09-19_2200</b></span>.
6. Dentro de esa carpeta crear:

   - <span style="color:#2563EB"><b>01-base-de-datos</b></span>;
   - <span style="color:#2563EB"><b>02-exportacion-para-migracion</b></span>;
   - <span style="color:#2563EB"><b>03-uploaded</b></span>;
   - <span style="color:#2563EB"><b>04-aplicacion</b></span>;
   - <span style="color:#2563EB"><b>05-configuracion</b></span>;
   - <span style="color:#2563EB"><b>06-verificacion</b></span>.

7. Anotar en una hoja o bitácora quién hizo el respaldo y en qué disco se guardó.

## 4. Respaldo de la base de datos de Supabase

### 4.1 Consideración especial del plan Free

Supabase indica que los respaldos automáticos diarios del panel están disponibles para los planes Pro, Team y Enterprise. El plan Free debe mantenerse mediante exportaciones lógicas periódicas con la <span style="color:#15803D"><b>Supabase CLI</b></span> y copias fuera del proyecto.

Por eso, para este proyecto no se debe depender de **Database → Backups** ni de PITR como único respaldo. El respaldo obligatorio es la exportación lógica generada por soporte y guardada en el disco externo. Debe hacerse mientras el proyecto <span style="color:#2563EB"><b>hvfubwyzarikudisbwfy</b></span> todavía funciona, no después de una falla.

La restauración desde el panel solo debe usarse si el proyecto y el plan muestran una copia disponible. En el plan Free, la recuperación prevista en esta guía es restaurar los archivos SQL en un proyecto de reemplazo.

El panel de Supabase sí puede usarse para revisar el proyecto, Storage y la configuración, pero no se considera por sí solo un respaldo recuperable.

### 4.2 Obtener una exportación completa para recuperación

La exportación completa debe producir estos archivos:

- <span style="color:#D97706"><b>roles.sql</b></span>: roles y permisos exportables;
- <span style="color:#D97706"><b>schema.sql</b></span>: tablas, tipos, llaves, índices, funciones, triggers y políticas incluidas;
- <span style="color:#D97706"><b>data.sql</b></span>: registros de las tablas;
- <span style="color:#D97706"><b>migration-history-schema.sql</b></span> y <span style="color:#D97706"><b>migration-history-data.sql</b></span>: historial de migraciones;
- <span style="color:#D97706"><b>auth-storage-custom.sql</b></span>: cambios propios de <span style="color:#2563EB"><b>auth</b></span> y <span style="color:#2563EB"><b>storage</b></span>, si existen;
- <span style="color:#D97706"><b>SHA256.csv</b></span>: comprobación de integridad.

### Herramientas y cómo abrirlas

| Herramienta | Cómo abrirla | Para qué sirve |
|---|---|---|
| Panel de Supabase | Abrir [Supabase Dashboard](https://supabase.com/dashboard/project/hvfubwyzarikudisbwfy) en el navegador e iniciar sesión | Revisar el proyecto, Storage, funciones y configuración |
| Supabase CLI | Abrir el acceso directo **Respaldo completo de base de datos - Acción Animal** en el escritorio | Solicitar la exportación lógica del proyecto |
| PowerShell | Presionar la tecla Windows, escribir <span style="color:#15803D"><b>PowerShell</b></span> y abrir la aplicación | Ventana que utiliza soporte para ejecutar la herramienta de respaldo |
| <span style="color:#15803D"><b>pg_dump</b></span> y <span style="color:#15803D"><b>psql</b></span> | No tienen una ventana propia; los abre la herramienta de respaldo | Generar y restaurar los archivos <span style="color:#D97706"><b>.sql</b></span> |
| Docker Desktop | Presionar la tecla Windows, escribir <span style="color:#15803D"><b>Docker Desktop</b></span> y abrirlo; esperar a que indique que está funcionando | Entorno que puede necesitar la CLI para ejecutar la exportación |

Enlaces de instalación para soporte: [Supabase CLI](https://supabase.com/docs/reference/cli/introduction), [PostgreSQL para Windows](https://www.postgresql.org/download/windows/) y [Docker Desktop](https://www.docker.com/products/docker-desktop/). El personal operativo no debe instalar estas herramientas.

### Cómo se realiza la exportación lógica

La exportación lógica convierte el proyecto en archivos que pueden volver a cargarse en PostgreSQL/Supabase. No es una fotografía del disco: guarda la estructura y los registros como instrucciones y datos.

#### Preparar la exportación

1. Confirmar que el proyecto de origen sea <span style="color:#2563EB"><b>hvfubwyzarikudisbwfy</b></span>.
2. Confirmar que la aplicación no esté siendo utilizada durante el respaldo.
3. Conectar el disco externo cifrado y abrir la carpeta fechada.
4. Entrar en <span style="color:#2563EB"><b>01-base-de-datos</b></span>.
5. Tener disponible la contraseña de la base de datos en el administrador de contraseñas. No escribirla en archivos ni en la bitácora.
6. Si es la primera vez que se prepara este equipo, seguir el procedimiento **Preparar las herramientas para soporte** de la siguiente sección. Después de prepararlas una vez, continuar con **Generar cada parte**.

#### Preparar las herramientas para soporte

Esta preparación se realiza una sola vez en la computadora servidor. Se necesita conexión a internet y una cuenta con permisos para instalar programas.

1. Instalar **Node.js LTS** desde [nodejs.org](https://nodejs.org/en/download/). Durante el instalador conservar las opciones recomendadas. Node.js permite ejecutar <span style="color:#15803D"><b>npx</b></span>, que descargará la versión fijada de Supabase CLI cuando se necesite.
2. Instalar **Docker Desktop para Windows** desde [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/). Reiniciar Windows si el instalador lo solicita. Abrir Docker Desktop desde el menú Inicio y esperar hasta que indique que está funcionando.
3. Instalar **PostgreSQL para Windows** desde [postgresql.org/download/windows](https://www.postgresql.org/download/windows/). En el instalador incluir las herramientas de línea de comandos. Para la exportación normal, la CLI ejecuta `pg_dump` dentro de Docker; `psql` se utiliza principalmente para restaurar manualmente los archivos SQL. No es necesario crear otra base de datos local para Acción Animal.
4. Abrir PowerShell desde el menú Inicio.
5. Entrar a la instalación definitiva:

   ```powershell
   Set-Location -LiteralPath 'E:\AccionAnimal\app\accion-animal-supabase'
   ```

6. Comprobar que Node.js y Supabase CLI estén disponibles:

   ```powershell
   node --version
   npx.cmd --yes supabase@2.117.0 --version
   ```

7. Comprobar que PostgreSQL instaló las dos herramientas:

   ```powershell
   pg_dump --version
   psql --version
   ```

8. Iniciar sesión en Supabase desde PowerShell:

   ```powershell
   npx.cmd --yes supabase@2.117.0 login
   ```

   La CLI abrirá el navegador para autorizarse o solicitará un token de acceso. Crear el token desde **Dashboard → Account → Access Tokens**, pegarlo solo cuando PowerShell lo solicite y no guardarlo en documentos.
9. Vincular la carpeta definitiva con el proyecto:

   ```powershell
   npx.cmd --yes supabase@2.117.0 link --project-ref hvfubwyzarikudisbwfy
   ```

   Cuando solicite la contraseña de la base de datos, obtenerla del administrador de contraseñas. El vínculo debe terminar indicando que el proyecto quedó enlazado.
10. Confirmar el vínculo ejecutando una consulta de ayuda o una lista de migraciones:

   ```powershell
   npx.cmd --yes supabase@2.117.0 migration list --linked
   ```

   Si muestra las migraciones del proyecto, la CLI está preparada.
11. Crear el archivo ejecutable de respaldo dentro de la instalación definitiva. Abrir el Explorador de archivos, entrar en `E:\AccionAnimal\app\accion-animal-supabase`, hacer clic derecho en un espacio vacío, elegir **Nuevo → Documento de texto**, cambiarle el nombre a `respaldo-base-de-datos.ps1` y confirmar que la extensión termine en `.ps1`, no en `.txt`.
12. Abrir `respaldo-base-de-datos.ps1` con el Bloc de notas, borrar su contenido, pegar este bloque y guardar:

   ```powershell
   Set-Location -LiteralPath 'E:\AccionAnimal\app\accion-animal-supabase'
   $out = Read-Host 'Escriba la ruta completa de la carpeta 01-base-de-datos del disco externo'
   New-Item -ItemType Directory -Force -Path $out | Out-Null
   npx.cmd --yes supabase@2.117.0 db dump --linked --file "$out\roles.sql" --role-only
   npx.cmd --yes supabase@2.117.0 db dump --linked --file "$out\schema.sql"
   npx.cmd --yes supabase@2.117.0 db dump --linked --file "$out\data.sql" --data-only --use-copy --exclude 'storage.buckets_vectors' --exclude 'storage.vector_indexes'
   npx.cmd --yes supabase@2.117.0 db dump --linked --file "$out\migration-history-schema.sql" --schema supabase_migrations
   npx.cmd --yes supabase@2.117.0 db dump --linked --file "$out\migration-history-data.sql" --schema supabase_migrations --data-only --use-copy
   npx.cmd --yes supabase@2.117.0 db diff --linked --schema auth,storage | Out-File -FilePath "$out\auth-storage-custom.sql" -Encoding utf8
   Get-ChildItem -LiteralPath $out -File | Get-FileHash -Algorithm SHA256 | Select-Object Path,Hash | Export-Csv "$out\SHA256.csv" -NoTypeInformation -Encoding UTF8
   Write-Host 'Respaldo terminado. Revise los archivos antes de cerrar esta ventana.'
   Pause
   ```

   Este archivo no guarda contraseñas. Solo solicita la ruta de destino cada vez que se ejecuta.
13. Crear el acceso directo: hacer clic derecho sobre `respaldo-base-de-datos.ps1`, elegir **Mostrar más opciones → Enviar a → Escritorio (crear acceso directo)**. En el escritorio, cambiar el nombre del acceso directo a **Respaldo completo de base de datos - Acción Animal**.
14. Configurar el acceso directo: hacer clic derecho sobre él, elegir **Propiedades** y completar:

   - En **Destino**, escribir exactamente: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "E:\AccionAnimal\app\accion-animal-supabase\respaldo-base-de-datos.ps1"`.
   - En **Iniciar en**, escribir: `E:\AccionAnimal\app\accion-animal-supabase`.
   - Pulsar **Aplicar** y después **Aceptar**.

   El acceso directo debe ejecutar la herramienta de exportación, no abrir una carpeta. Al ejecutarlo, PowerShell solicitará la ruta completa de la carpeta fechada del disco externo, por ejemplo `R:\Respaldos\AccionAnimal\2026-09-19_2200\01-base-de-datos`. No debe abrir `uploaded` ni guardar el respaldo dentro de la instalación definitiva.
15. Hacer una exportación de prueba y confirmar que se generan <span style="color:#D97706"><b>roles.sql</b></span>, <span style="color:#D97706"><b>schema.sql</b></span> y <span style="color:#D97706"><b>data.sql</b></span> antes de dar por preparado el equipo.

Si falla cualquiera de las comprobaciones, detenerse y corregir la instalación antes de respaldar datos reales. El personal operativo no debe instalar ni configurar estas herramientas.

#### Ejecutar el respaldo de la base de datos

Esta es una sola operación con dos formas de inicio. Usar el acceso directo si existe; si no existe, usar PowerShell. No se deben realizar ambas.

**Opción A: acceso directo preparado por soporte**

1. Abrir <span style="color:#15803D"><b>Docker Desktop</b></span> desde el menú Inicio y esperar a que indique que está funcionando.
2. Hacer doble clic en el acceso directo verde **Respaldo completo de base de datos - Acción Animal**.
3. Confirmar que la <span style="color:#15803D"><b>herramienta de respaldo</b></span> muestre el proyecto <span style="color:#2563EB"><b>hvfubwyzarikudisbwfy</b></span>.
4. Elegir la <span style="color:#2563EB"><b>carpeta</b></span> fechada del disco externo y dentro de ella la <span style="color:#2563EB"><b>carpeta</b></span> <span style="color:#2563EB"><b>01-base-de-datos</b></span>.
5. Pulsar **Iniciar respaldo**.
6. Esperar **Respaldo terminado correctamente**. No cerrar la ventana ni desconectar el disco.
7. Continuar con **Revisar el resultado de la exportación**.

**Opción B: ejecución manual con PowerShell**

1. Abrir <span style="color:#15803D"><b>Docker Desktop</b></span> desde el menú Inicio y esperar a que esté funcionando.
2. Abrir <span style="color:#15803D"><b>PowerShell</b></span> desde el menú Inicio.
3. Entrar en la <span style="color:#2563EB"><b>carpeta</b></span> de la aplicación definitiva:

   ```powershell
   Set-Location -LiteralPath 'E:\AccionAnimal\app\accion-animal-supabase'
   ```

4. Confirmar la versión de la <span style="color:#15803D"><b>Supabase CLI</b></span>:

   ```powershell
   npx.cmd --yes supabase@2.117.0 --version
   ```

5. Confirmar que el proyecto ya está vinculado:

   ```powershell
   npx.cmd --yes supabase@2.117.0 migration list --linked
   ```

   Si muestra las migraciones de <span style="color:#2563EB"><b>hvfubwyzarikudisbwfy</b></span>, continuar. Si informa que no hay proyecto vinculado, ejecutar primero <span style="color:#15803D"><b>npx.cmd --yes supabase@2.117.0 link --project-ref hvfubwyzarikudisbwfy</b></span> y usar la contraseña de la base de datos cuando la solicite.

6. Crear la <span style="color:#2563EB"><b>carpeta de destino</b></span>. Cambiar <span style="color:#2563EB"><b>R:</b></span> por la letra real del disco externo:

   ```powershell
   $out = 'R:\Respaldos\AccionAnimal\2026-09-19_2200\01-base-de-datos'
   New-Item -ItemType Directory -Force -Path $out
   ```

7. Generar los <span style="color:#D97706"><b>archivos de respaldo</b></span> de roles, estructura, datos e historial:

   ```powershell
   npx.cmd --yes supabase@2.117.0 db dump --linked --file "$out\roles.sql" --role-only
   npx.cmd --yes supabase@2.117.0 db dump --linked --file "$out\schema.sql"
   npx.cmd --yes supabase@2.117.0 db dump --linked --file "$out\data.sql" --data-only --use-copy --exclude 'storage.buckets_vectors' --exclude 'storage.vector_indexes'
   npx.cmd --yes supabase@2.117.0 db dump --linked --file "$out\migration-history-schema.sql" --schema supabase_migrations
   npx.cmd --yes supabase@2.117.0 db dump --linked --file "$out\migration-history-data.sql" --schema supabase_migrations --data-only --use-copy
   ```

8. Guardar los cambios propios de <span style="color:#2563EB"><b>auth</b></span> y <span style="color:#2563EB"><b>storage</b></span> en otro <span style="color:#D97706"><b>archivo</b></span>:

   ```powershell
   npx.cmd --yes supabase@2.117.0 db diff --linked --schema auth,storage | Out-File -FilePath "$out\auth-storage-custom.sql" -Encoding utf8
   ```

9. Si se usa una conexión directa en vez del vínculo, soporte debe reemplazar <span style="color:#2563EB"><b>--linked</b></span> por <span style="color:#2563EB"><b>--db-url "[CONNECTION_STRING]"</b></span> solo durante la ejecución. No guardar esa conexión en el documento ni en un archivo.
10. Después de cada comando, confirmar que aparece el <span style="color:#D97706"><b>archivo</b></span> correspondiente. Si uno muestra error, detenerse y no usar el respaldo como válido.
11. Continuar con **Revisar el resultado de la exportación**.

Cuando no exista un acceso directo con estas opciones, soporte debe realizar los mismos seis tipos de exportación usando la CLI de Supabase o <span style="color:#15803D"><b>pg_dump</b></span>. No hace falta que el personal operativo escriba los comandos: debe entregar el proyecto, la carpeta de destino y solicitar estos archivos con estos nombres.

#### Revisar el resultado de la exportación

1. Confirmar que aparezcan todos los archivos esperados.
2. Revisar que cada archivo tenga un tamaño mayor que cero.
3. Abrir <span style="color:#D97706"><b>schema.sql</b></span> como texto y confirmar que contiene definiciones de tablas y no solo comentarios.
4. Abrir <span style="color:#D97706"><b>data.sql</b></span> como texto y confirmar que contiene instrucciones de carga de datos.
5. Confirmar que los dos archivos de historial existan, aunque sean pequeños.
6. Generar <span style="color:#D97706"><b>SHA256.csv</b></span> para registrar la huella de cada archivo. Si se utilizó el acceso directo, este archivo se genera automáticamente al final del respaldo.
7. Copiar el informe y <span style="color:#D97706"><b>SHA256.csv</b></span> a <span style="color:#2563EB"><b>06-verificacion</b></span>.
8. No modificar, editar ni abrir los archivos SQL con un procesador de textos después de registrar sus huellas.

### Cómo generar `SHA256.csv` manualmente

Si el acceso directo no generó `SHA256.csv`, soporte debe hacerlo desde <span style="color:#15803D"><b>PowerShell</b></span>:

1. Abrir <span style="color:#15803D"><b>PowerShell</b></span> desde el menú Inicio.
2. Escribir la ruta de la carpeta que contiene los archivos SQL. En este ejemplo, cambiar la letra `R:` y la fecha por los datos reales:

   ```powershell
   $out = 'R:\Respaldos\AccionAnimal\2026-09-19_2200\01-base-de-datos'
   ```

3. Ejecutar este bloque. Creará el archivo naranja `SHA256.csv` dentro de `01-base-de-datos`:

```powershell
Get-ChildItem -LiteralPath $out -File | Get-FileHash -Algorithm SHA256 | Select-Object Path,Hash | Export-Csv "$out\SHA256.csv" -NoTypeInformation -Encoding UTF8
```

4. Abrir la carpeta `01-base-de-datos` y confirmar que aparezca `SHA256.csv` y que tenga un tamaño mayor que cero.
5. Copiar `SHA256.csv` a la carpeta `06-verificacion`.

El paquete queda listo para recuperación cuando contiene roles, estructura, datos, historial, cambios propios de <span style="color:#2563EB"><b>auth</b></span>/<span style="color:#2563EB"><b>storage</b></span>, informe y huellas. La copia de <span style="color:#2563EB"><b>uploaded</b></span> se realiza en el punto 5 y no debe mezclarse dentro de los archivos SQL.

### 4.3 Revisar que la exportación esté completa

1. Abrir <span style="color:#2563EB"><b>01-base-de-datos</b></span>.
2. Confirmar que los archivos no estén vacíos.
3. Confirmar que tengan la fecha y hora del respaldo.
4. Abrir <span style="color:#D97706"><b>SHA256.csv</b></span> y verificar que incluya todos los archivos SQL.
5. Guardar una copia del informe en <span style="color:#2563EB"><b>06-verificacion</b></span>.
6. Registrar cualquier error y avisar al administrador.

Supabase excluye normalmente los esquemas administrados <span style="color:#2563EB"><b>auth</b></span> y <span style="color:#2563EB"><b>storage</b></span> de los volcados generales. Por eso los cambios propios, las políticas y los triggers de esos esquemas se deben conservar por separado. Los archivos de Storage también deben copiarse aparte; la base de datos solo conserva sus metadatos.

## 5. Respaldo de la carpeta <span style="color:#2563EB"><b>uploaded</b></span>

### 5.1 Copia completa

1. Abrir el <span style="color:#15803D"><b>Explorador de archivos</b></span>.
2. Ir a la <span style="color:#2563EB"><b>carpeta</b></span> <span style="color:#2563EB"><b>E:\AccionAnimal\uploaded</b></span>.
3. Seleccionar toda la <span style="color:#2563EB"><b>carpeta</b></span> y elegir **Copiar**.
4. Abrir la <span style="color:#2563EB"><b>carpeta</b></span> fechada del disco externo y entrar a <span style="color:#2563EB"><b>03-uploaded</b></span>.
5. Elegir **Pegar**.
6. Esperar a que termine la copia; no desconectar el disco.
7. Abrir desde el disco externo varias fotografías y documentos de carpetas diferentes.
8. Registrar en <span style="color:#2563EB"><b>06-verificacion</b></span> la cantidad aproximada de archivos, el tamaño de la copia y el resultado de la prueba.

### 5.2 Copia diaria de cambios

Si soporte dejó preparado un acceso directo **Respaldo diario de archivos - Acción Animal**:

1. Cerrar Acción Animal.
2. Abrir el acceso directo.
3. Esperar el mensaje **Copia terminada correctamente**.
4. No elegir opciones que digan **espejo**, **sincronización destructiva** o **borrar destino**.
5. Abrir un archivo de muestra desde el disco externo.
6. Anotar el resultado en la bitácora.

Si el acceso directo no existe, hacer una copia completa semanal y solicitar a soporte que prepare el respaldo incremental.

## 6. Respaldo de la aplicación

1. Abrir la <span style="color:#2563EB"><b>carpeta</b></span> <span style="color:#2563EB"><b>E:\AccionAnimal\app\accion-animal-supabase</b></span>.
2. Crear dentro de <span style="color:#2563EB"><b>04-aplicacion</b></span> una <span style="color:#2563EB"><b>carpeta</b></span> llamada <span style="color:#2563EB"><b>accion-animal-supabase</b></span>.
3. Copiar el contenido de la aplicación a esa carpeta.
4. Confirmar que se incluyan:

   - <span style="color:#D97706"><b>package.json</b></span>;
   - <span style="color:#D97706"><b>package-lock.json</b></span>;
   - <span style="color:#2563EB"><b>supabase\migrations</b></span>;
   - <span style="color:#2563EB"><b>supabase\functions</b></span>;
   - <span style="color:#D97706"><b>supabase\config.toml</b></span>;
   - archivos de configuración y documentación.

5. No es necesario copiar <span style="color:#15803D"><b>node_modules</b></span> ni <span style="color:#2563EB"><b>dist</b></span> si el objetivo es reconstruir la aplicación.
6. No copiar <span style="color:#D97706"><b>.env.local</b></span> ni <span style="color:#D97706"><b>.env.server</b></span> a un disco sin cifrar.
7. Registrar la fecha de la copia y quién la realizó.

## 7. Respaldo de funciones, configuración y accesos

Dentro de <span style="color:#2563EB"><b>05-configuracion</b></span>, guardar de forma cifrada:

- código de <span style="color:#2563EB"><b>supabase\functions\manage-users</b></span>;
- lista de Edge Functions desplegadas;
- nombres de los secretos utilizados, sin sus valores;
- archivos <span style="color:#D97706"><b>.env.local</b></span> y <span style="color:#D97706"><b>.env.server</b></span>, solo en el disco cifrado;
- información de la tarea **Accion Animal - Servidor local**;
- regla del firewall para el puerto local;
- notas de red y del servidor.

Las contraseñas, la clave <span style="color:#2563EB"><b>service_role</b></span>, el segundo factor y los códigos de recuperación deben permanecer en el administrador de contraseñas. No escribirlos en la bitácora ni en el PDF.

## 8. Exportación para una futura migración a MySQL

Esta sección es para soporte técnico. Un archivo PostgreSQL <span style="color:#D97706"><b>.sql</b></span> no se puede cargar directamente en MySQL.

1. Abrir el proyecto <span style="color:#2563EB"><b>hvfubwyzarikudisbwfy</b></span>.
2. Exportar cada tabla de negocio a un archivo CSV dentro de <span style="color:#2563EB"><b>02-exportacion-para-migracion</b></span>.
3. Mantener la primera fila con los nombres originales de las columnas.
4. Conservar los UUID originales para no romper las relaciones.
5. Crear un archivo <span style="color:#D97706"><b>MAPA-MIGRACION.csv</b></span> con:

   - tabla y columna original;
   - tipo PostgreSQL;
   - tipo elegido para MySQL;
   - transformación aplicada;
   - observaciones.

6. Crear <span style="color:#D97706"><b>REGLAS-NO-PORTABLES.txt</b></span> y anotar las políticas RLS, funciones, triggers, roles, usuarios, Edge Functions, Storage y Realtime que deberán rediseñarse.
7. Conservar el <span style="color:#D97706"><b>schema.sql</b></span> original junto con los CSV.
8. No borrar el respaldo PostgreSQL después de preparar los CSV.

Para MySQL deberán revisarse manualmente, como mínimo:

- políticas RLS y permisos;
- funciones que usan <span style="color:#2563EB"><b>auth.uid()</b></span>;
- triggers y funciones PL/pgSQL;
- usuarios y contraseñas de Supabase Auth;
- buckets y políticas de Storage;
- rutas de fotografías y documentos;
- Edge Functions y secretos.

## 9. Comprobación de recuperación

La prueba debe hacerse en un proyecto Supabase temporal y en una carpeta temporal, nunca sobre producción.

1. Solicitar a soporte la creación del proyecto temporal.
2. Entregarle los archivos de <span style="color:#2563EB"><b>01-base-de-datos</b></span> y <span style="color:#2563EB"><b>04-aplicacion</b></span>.
3. Entregarle una copia de <span style="color:#2563EB"><b>03-uploaded</b></span>.
4. Pedir que restaure primero la base de datos y después los archivos.
5. Probar inicio de sesión, perfiles y permisos.
6. Buscar una mascota y abrir un expediente.
7. Abrir fotografías y documentos de varios expedientes.
8. Probar una alta y una edición controlada.
9. Confirmar que las reglas de propietario, veterinaria y recepción funcionan.
10. Guardar el resultado de la prueba en <span style="color:#2563EB"><b>06-verificacion</b></span>.

## 10. Restauración después de una falla

### Si falla la aplicación

1. No borrar <span style="color:#2563EB"><b>E:\AccionAnimal\app\accion-animal-supabase</b></span>.
2. Avisar al administrador.
3. Restaurar la aplicación desde <span style="color:#2563EB"><b>04-aplicacion</b></span> en una ubicación temporal.
4. Revisar la configuración y la tarea **Accion Animal - Servidor local**.
5. Probar <span style="color:#2563EB"><b>http://localhost:4173/api/health</b></span>.
6. Solo después de la prueba, volver a poner la aplicación en servicio.

### Si faltan archivos

1. No borrar ni renombrar archivos de <span style="color:#2563EB"><b>E:\AccionAnimal\uploaded</b></span>.
2. Restaurar la copia en una carpeta temporal del servidor.
3. Comparar cantidad y tamaño.
4. Abrir una muestra de fotografías y documentos.
5. Probar la aplicación con esa copia.
6. Cambiar la carpeta activa solo después de validar el resultado.

### Si falla la base de datos

1. No intentar reparaciones repetitivas.
2. Conservar el proyecto y la información actual sin modificarla.
3. Solicitar a soporte la restauración en un proyecto temporal.
4. Restaurar estructura, datos, historial y cambios propios de <span style="color:#2563EB"><b>auth</b></span> y <span style="color:#2563EB"><b>storage</b></span>.
5. Restaurar los archivos por separado.
6. Probar usuarios, permisos, datos y documentos.
7. Programar la recuperación definitiva fuera del horario de uso.

## 11. Cuándo hacer cada respaldo

| Frecuencia | Qué hacer |
|---|---|
| Diario | Copiar cambios de <span style="color:#2563EB"><b>E:\AccionAnimal\uploaded</b></span> y registrar el resultado |
| Semanal | Repetir copia completa de <span style="color:#2563EB"><b>uploaded</b></span> y comprobar una muestra |
| Mensual | Generar respaldo completo de base, aplicación, configuración y exportación para migración |
| Antes de actualizar | Hacer todos los respaldos y una prueba de lectura |
| Cada tres meses | Probar una restauración completa en un entorno temporal |

## 12. Bitácora

```text
Fecha y hora:
Responsable:
Disco externo utilizado:
Base de datos: correcto / falló
Archivos uploaded: correcto / falló
Aplicación y migraciones: correcto / falló
Funciones y configuración: correcto / falló
Exportación para MySQL: correcto / falló / pendiente
SHA-256 verificado: sí / no
Fotografía y documento abiertos desde el respaldo: sí / no
Restauración de prueba: sí / no / fecha prevista
Observaciones:
```

## 13. Regla final

Un respaldo válido es aquel que se puede leer y restaurar, no solo el que existe en una carpeta. Si falta la base de datos, <span style="color:#2563EB"><b>uploaded</b></span>, la aplicación, la configuración o la exportación de migración, el respaldo está incompleto.

Documentación oficial: [Backup and Restore using the Supabase CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) y [Database Backups](https://supabase.com/docs/guides/platform/backups).
