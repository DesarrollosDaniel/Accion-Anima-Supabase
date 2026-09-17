# Guía de mantenimiento y copias preventivas

Esta guía cubre la aplicación, la base de datos Supabase y los archivos clínicos locales de Acción Animal. Los respaldos contienen datos personales y clínicos: deben guardarse en unidades cifradas con BitLocker y nunca en un repositorio público.

## 1. Mapa de rutas

### Instalación actual de trabajo

| Elemento | Ruta |
|---|---|
| Raíz recibida | `C:\Users\DLopez\OneDrive - Singledigits\Escritorio\Por\Accion_Animal-main\Accion_Animal-main` |
| Aplicación nueva y repositorio Git | `C:\Users\DLopez\OneDrive - Singledigits\Escritorio\Por\Accion_Animal-main\Accion_Animal-main\accion-animal-supabase` |
| Archivos clínicos configurados actualmente | `C:\Users\DLopez\OneDrive - Singledigits\Escritorio\Por\Accion_Animal-main\Accion_Animal-main\accion-animal-supabase\uploaded` |
| Configuración activa | `accion-animal-supabase\.env.local` y `accion-animal-supabase\.env.server` |
| Compilación regenerable | `accion-animal-supabase\dist` |
| Migraciones de base de datos | `accion-animal-supabase\supabase\migrations` |
| Edge Function de usuarios | `accion-animal-supabase\supabase\functions\manage-users` |
| Servidor local | `accion-animal-supabase\server\local-server.mjs` |

La configuración actual de `.env.server` usa `AA_STORAGE_ROOT=uploaded`; por ser una ruta relativa, corresponde a la carpeta `uploaded` dentro de `accion-animal-supabase`. Al revisar esta instalación había 8,566 archivos y aproximadamente 14.74 GiB. En esta PC de trabajo no se detectó la tarea programada `Accion Animal - Servidor local`; esa tarea corresponde a la instalación definitiva.

### Instalación definitiva prevista en la PC servidor

| Elemento | Ruta recomendada |
|---|---|
| Aplicación | `E:\AccionAnimal\app\accion-animal-supabase` |
| Imágenes y documentos | `E:\AccionAnimal\uploaded` |
| Configuración | `E:\AccionAnimal\app\accion-animal-supabase\.env.local` |
| Tarea de Windows | `Accion Animal - Servidor local` |
| Servicio web local | `http://localhost:4173` |
| Comprobación | `http://localhost:4173/api/health` |
| Proyecto Supabase | `hvfubwyzarikudisbwfy` |

No mezclar ambas distribuciones. En producción, `AA_STORAGE_ROOT` debe ser `E:\AccionAnimal\uploaded`; no debe quedar `uploaded\uploaded`.

## 2. Qué debe respaldarse

Un respaldo recuperable consta de cuatro piezas:

1. **Base de datos:** roles, esquema, datos e historial de migraciones de Supabase.
2. **Archivos:** toda la carpeta indicada por `AA_STORAGE_ROOT`.
3. **Aplicación:** código, `package-lock.json`, migraciones y Edge Functions.
4. **Configuración del servidor:** `.env.local`, `.env.server`, tarea programada, regla de firewall y notas de red.

`node_modules` y `dist` no necesitan copiarse: se reconstruyen con `npm.cmd ci` y `npm.cmd run build`.

La base de datos solo guarda las rutas de imágenes y documentos. Un volcado de Supabase **no** contiene los archivos de `uploaded`, y copiar `uploaded` **no** respalda la base de datos.

## 3. Frecuencia y retención

Aplicar la regla 3-2-1: tres copias, en dos medios distintos y una fuera de la PC servidor.

| Frecuencia | Acción | Retención mínima |
|---|---|---|
| Diario, al cerrar | Volcado de Supabase y copia incremental de `uploaded` | 30 volcados de base y 7 días de archivos |
| Semanal | Copia completa fechada de `uploaded`, aplicación y configuración | 8 semanas |
| Mensual | Copia completa en un segundo disco, desconectado después | 12 meses |
| Antes de cualquier mantenimiento | Base, archivos, aplicación y configuración | Hasta verificar el cambio y el siguiente respaldo normal |
| Trimestral | Prueba de restauración en una ubicación o proyecto de prueba | Conservar el acta de la prueba |

No conectar permanentemente ambos discos de respaldo: un ransomware o una sobretensión podría afectar al servidor y a las copias al mismo tiempo.

## 4. Preparación antes de respaldar o mantener

1. Avisar a los usuarios y cerrar la aplicación en todas las computadoras.
2. Confirmar que el sistema responde:

   ```powershell
   Invoke-RestMethod http://localhost:4173/api/health
   ```

3. Revisar espacio libre del servidor y del destino:

   ```powershell
   Get-Volume | Select-Object DriveLetter, FileSystemLabel, SizeRemaining, Size
   ```

4. Detener temporalmente la tarea `Accion Animal - Servidor local`. Si el servidor se inició en una consola, cerrarlo con `Ctrl+C` en esa consola.

   ```powershell
   Stop-ScheduledTask -TaskName 'Accion Animal - Servidor local'
   ```

Detener el servidor evita que un archivo cambie mientras se copia. Supabase seguirá disponible, pero nadie debe usar el sistema durante esta ventana.

## 5. Respaldo de la base de datos Supabase

Supabase Free no ofrece la misma retención diaria administrada que los planes de pago; se debe generar un volcado lógico periódico. Los siguientes comandos usan la versión de CLI ya adoptada por el proyecto.

Ejecutar desde la carpeta de la aplicación. Sustituir `F:` por la unidad cifrada destinada a respaldos:

```powershell
$aaStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$aaApp = 'E:\AccionAnimal\app\accion-animal-supabase'
$aaDbBackup = "F:\Respaldos\AccionAnimal\$aaStamp\base-datos"

New-Item -ItemType Directory -Force -Path $aaDbBackup
Set-Location -LiteralPath $aaApp

npx.cmd --yes supabase@2.117.0 db dump --linked --file "$aaDbBackup\roles.sql" --role-only
npx.cmd --yes supabase@2.117.0 db dump --linked --file "$aaDbBackup\schema.sql"
npx.cmd --yes supabase@2.117.0 db dump --linked --file "$aaDbBackup\data.sql" --data-only --use-copy --exclude 'storage.buckets_vectors' --exclude 'storage.vector_indexes'
npx.cmd --yes supabase@2.117.0 db dump --linked --file "$aaDbBackup\migration-history-schema.sql" --schema supabase_migrations
npx.cmd --yes supabase@2.117.0 db dump --linked --file "$aaDbBackup\migration-history-data.sql" --schema supabase_migrations --data-only --use-copy
```

La CLI puede pedir la contraseña de la base de datos. Obtenerla del administrador de contraseñas; no escribirla dentro de este documento, un script o el historial de PowerShell.

Verificar que los cinco archivos existen, no están vacíos y registrar sus hashes:

```powershell
Get-ChildItem -LiteralPath $aaDbBackup -File | Select-Object Name, Length, LastWriteTime
Get-ChildItem -LiteralPath $aaDbBackup -File | Get-FileHash -Algorithm SHA256 | Export-Csv "$aaDbBackup\SHA256.csv" -NoTypeInformation
```

Si cualquiera de los comandos devuelve error, el respaldo de base de datos se considera fallido. No continuar con una actualización destructiva.

Documentación oficial: [Database Backups](https://supabase.com/docs/guides/platform/backups) y [Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).

## 6. Respaldo de imágenes y documentos

### Copia diaria incremental

```powershell
$aaStorage = 'E:\AccionAnimal\uploaded'
$aaDailyFiles = 'F:\Respaldos\AccionAnimal\archivos-diario'

robocopy $aaStorage $aaDailyFiles /E /COPY:DAT /DCOPY:DAT /R:2 /W:5 /XJ /FFT
$LASTEXITCODE
```

Para `robocopy`, los códigos 0 a 7 indican ejecución útil; 8 o mayor indica fallo. No usar `/MIR` en el respaldo diario: también borraría en el destino los archivos eliminados por error en el origen.

### Copia semanal fechada

```powershell
$aaStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$aaStorage = 'E:\AccionAnimal\uploaded'
$aaWeeklyFiles = "F:\Respaldos\AccionAnimal\$aaStamp\uploaded"

robocopy $aaStorage $aaWeeklyFiles /E /COPY:DAT /DCOPY:DAT /R:2 /W:5 /XJ /FFT
$LASTEXITCODE
```

Verificación rápida de cantidad y tamaño:

```powershell
$aaSourceStats = Get-ChildItem -LiteralPath $aaStorage -Recurse -File | Measure-Object Length -Sum
$aaBackupStats = Get-ChildItem -LiteralPath $aaWeeklyFiles -Recurse -File | Measure-Object Length -Sum
$aaSourceStats
$aaBackupStats
```

`Count` y `Sum` deben coincidir. Una vez al mes, abrir desde el disco de respaldo varias fotos y documentos de diferentes carpetas; una copia que no puede leerse no es un respaldo válido.

## 7. Respaldo de aplicación y configuración

### Código y archivos no confirmados en Git

La copia de trabajo puede contener cambios todavía no enviados al repositorio. Por eso, además de Git, hacer una copia del árbol de trabajo excluyendo dependencias, compilación y archivos clínicos:

```powershell
$aaStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$aaApp = 'E:\AccionAnimal\app\accion-animal-supabase'
$aaSystemBackup = "F:\Respaldos\AccionAnimal\$aaStamp\sistema"

New-Item -ItemType Directory -Force -Path $aaSystemBackup
robocopy $aaApp "$aaSystemBackup\app" /E /COPY:DAT /DCOPY:DAT /R:2 /W:5 /XJ /XD node_modules dist uploaded .git .temp
```

Crear también un paquete portable del historial Git:

```powershell
Set-Location -LiteralPath $aaApp
git status --short | Out-File "$aaSystemBackup\git-status.txt" -Encoding utf8
git bundle create "$aaSystemBackup\accion-animal.bundle" --all
git bundle verify "$aaSystemBackup\accion-animal.bundle"
```

### Configuración de Windows

Guardar estos archivos únicamente dentro del respaldo cifrado:

```powershell
Copy-Item -LiteralPath "$aaApp\.env.local" -Destination $aaSystemBackup -ErrorAction SilentlyContinue
Copy-Item -LiteralPath "$aaApp\.env.server" -Destination $aaSystemBackup -ErrorAction SilentlyContinue
Export-ScheduledTask -TaskName 'Accion Animal - Servidor local' | Set-Content "$aaSystemBackup\tarea-servidor.xml" -Encoding utf8
Get-NetFirewallRule -DisplayName 'Accion Animal local 4173' | Format-List * | Out-File "$aaSystemBackup\firewall-4173.txt" -Encoding utf8
ipconfig /all | Out-File "$aaSystemBackup\red.txt" -Encoding utf8
```

Añadir manualmente al administrador de contraseñas, no al respaldo de texto:

- contraseña de la base de datos;
- acceso del propietario a Supabase;
- códigos de recuperación y segundo factor;
- contraseña de la cuenta de Windows que ejecuta la tarea.

## 8. Finalizar el respaldo

1. Iniciar nuevamente la tarea o el servidor:

   ```powershell
   Start-ScheduledTask -TaskName 'Accion Animal - Servidor local'
   Start-Sleep -Seconds 5
   Invoke-RestMethod http://localhost:4173/api/health
   ```

2. Iniciar sesión, abrir una mascota con foto y un expediente con documento.
3. Registrar fecha, responsable, destino, tamaños, códigos de `robocopy` y resultado de la prueba.
4. Expulsar y desconectar el disco cuando corresponda.

Formato mínimo de bitácora:

```text
Fecha/hora:
Responsable:
Base de datos: correcto / falló
Archivos: correcto / falló; robocopy=
Sistema/configuración: correcto / falló
Destino:
Prueba de lectura:
Observaciones:
```

## 9. Mantenimiento preventivo

### Diario

- comprobar `/api/health`;
- confirmar que usuarios pueden iniciar sesión y abrir un archivo;
- revisar que el disco no esté lleno;
- ejecutar el respaldo diario al terminar la jornada.

### Semanal

- revisar el estado de la tarea programada:

  ```powershell
  Get-ScheduledTask -TaskName 'Accion Animal - Servidor local' | Get-ScheduledTaskInfo
  ```

- comprobar Windows Defender y el Visor de eventos;
- crear copia semanal fechada;
- revisar en Supabase los avisos de seguridad, rendimiento y consumo.

### Mensual

- instalar actualizaciones de seguridad de Windows fuera del horario de uso;
- mantener Node.js en una versión LTS compatible, sin cambiar de versión mayor el mismo día que otra modificación;
- revisar dependencias sin actualizarlas automáticamente:

  ```powershell
  Set-Location -LiteralPath 'E:\AccionAnimal\app\accion-animal-supabase'
  npm.cmd audit
  npm.cmd outdated
  ```

- comprobar que las migraciones locales y remotas coinciden:

  ```powershell
  npx.cmd --yes supabase@2.117.0 migration list --linked
  ```

- probar una copia en el segundo disco y desconectarlo.

### Trimestral

- probar la restauración de `uploaded` en otra carpeta o disco;
- probar la restauración del volcado en un proyecto Supabase temporal, nunca sobre producción;
- comprobar acceso del propietario, segundo factor y códigos de recuperación;
- revisar UPS, cableado, temperatura, ventilación y arranque después de un corte eléctrico.

## 10. Procedimiento antes y después de actualizar

### Antes

1. Completar las cuatro copias de la sección 2.
2. Confirmar que `git status --short` no contiene cambios desconocidos. No ejecutar `git pull` hasta identificar y respaldar cualquier cambio local.
3. Registrar el commit actual:

   ```powershell
   git rev-parse HEAD
   ```

4. Confirmar que el volcado y la copia de `uploaded` fueron verificados.

### Después

```powershell
Set-Location -LiteralPath 'E:\AccionAnimal\app\accion-animal-supabase'
npm.cmd ci
npm.cmd run typecheck
npm.cmd run build
```

Reiniciar la tarea y probar:

- `/api/health`;
- inicio de sesión;
- búsqueda y apertura de mascota;
- lectura de foto y documento;
- alta o edición controlada de un registro de prueba;
- permisos de propietario, veterinaria y recepción.

No borrar el respaldo previo hasta que estas pruebas pasen y exista al menos un respaldo normal posterior.

## 11. Recuperación

### Solo falla la aplicación

1. Detener la tarea.
2. Restaurar el código desde Git, el `bundle` o la copia `sistema\app`.
3. Restaurar `.env.local` y `.env.server` desde el medio cifrado.
4. Ejecutar `npm.cmd ci` y `npm.cmd run build`.
5. Importar o recrear la tarea programada si fuera necesario.
6. Iniciar y probar `/api/health`.

### Se pierde la carpeta `uploaded`

1. Detener la tarea.
2. Restaurar primero en una carpeta vacía, no encima de restos dudosos:

   ```powershell
   robocopy 'F:\Respaldos\AccionAnimal\20260917-220000\uploaded' 'E:\AccionAnimal\uploaded-restaurado' /E /COPY:DAT /DCOPY:DAT /R:2 /W:5 /XJ /FFT
   ```

3. Comparar cantidad y tamaño, y abrir una muestra de archivos.
4. Cambiar `AA_STORAGE_ROOT` temporalmente a `E:\AccionAnimal\uploaded-restaurado`.
5. Iniciar y verificar fotos y documentos antes de retirar la carpeta dañada.

### Se pierde o corrompe la base de datos

1. Detener la aplicación y conservar el estado actual; no intentar reparaciones repetitivas.
2. Si el plan de Supabase dispone de respaldo administrado o PITR, restaurar desde **Database → Backups** al punto anterior al incidente.
3. Para un volcado manual, crear un proyecto Supabase nuevo y seguir la guía oficial de restauración con `psql`, usando `roles.sql`, `schema.sql`, `data.sql` y el historial de migraciones.
4. Reconfigurar secretos de la Edge Function y cualquier opción de Auth que no forme parte del volcado.
5. Probar el proyecto nuevo y cambiar `VITE_SUPABASE_URL` y la clave publicable solo después de validar datos, usuarios, RLS y archivos.

Nunca probar una restauración manual sobre el proyecto de producción. La restauración administrada causa indisponibilidad y debe programarse fuera del horario de uso.

## 12. Criterio de respaldo válido

El trabajo termina únicamente cuando:

- los comandos finalizaron sin error;
- los archivos de base tienen tamaño mayor que cero y hashes registrados;
- origen y copia de `uploaded` tienen la misma cantidad y suma de bytes;
- el código y la configuración están incluidos;
- una muestra de archivos puede abrirse desde el respaldo;
- el servicio volvió a responder y la bitácora quedó completada.
