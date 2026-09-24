# Guía general: Supabase local para trabajar sin Internet

## Objetivo

Instalar Supabase completo dentro de la red del consultorio para que autenticación, registro de usuarios, consultas, altas, modificaciones, eliminaciones y archivos sigan funcionando aunque no haya Internet.

## Decisión de arquitectura

- El Supabase local será la fuente principal de datos.
- La aplicación y todas las computadoras se conectarán al servidor mediante su IP privada.
- El proyecto actual de Supabase en la nube se conservará temporalmente para respaldo y recuperación.
- No se permitirán escrituras simultáneas en la nube y en el servidor local; no existe una sincronización bidireccional automática y segura para este caso.
- MySQL no será necesario: Supabase local incluye PostgreSQL, Auth, API, funciones y almacenamiento.

## Fase 1. Preparar el servidor

1. Elegir una computadora dedicada que permanezca encendida durante el horario de trabajo.
2. Confirmar que tenga recursos suficientes, almacenamiento SSD, espacio para crecimiento y conexión por cable a la red.
3. Asignarle una IP privada fija o una reserva DHCP.
4. Protegerla con contraseña, actualizaciones, firewall, regulador o UPS y acceso físico controlado.
5. Instalar Docker Desktop en Windows o Docker Engine en Linux.

## Fase 2. Inventariar y respaldar el sistema actual

1. Detener temporalmente los cambios durante la copia final.
2. Respaldar la base de datos alojada en Supabase, incluyendo roles, esquema y datos.
3. Confirmar que el respaldo incluya usuarios de Auth, tablas, políticas RLS, funciones y triggers.
4. Respaldar la carpeta local `uploaded` y cualquier otro archivo del sistema.
5. Guardar una copia de las migraciones, Edge Functions y configuración actual.
6. Conservar los respaldos en dos ubicaciones distintas antes de continuar.

## Fase 3. Instalar Supabase Self-Hosted

1. Desplegar la versión oficial de Supabase Self-Hosted mediante Docker Compose.
2. Usar una versión fija y probada, no imágenes cambiantes sin control.
3. Generar contraseñas, claves API y secretos nuevos.
4. Configurar la URL pública con la IP o nombre local del servidor.
5. Configurar Auth, API, PostgreSQL, Studio y Edge Functions.
6. Mantener el acceso limitado a la red privada del consultorio.
7. Comprobar que todos los servicios inicien correctamente y estén saludables.

> Para operación real se debe usar Supabase Self-Hosted; `supabase start` es únicamente para desarrollo y pruebas.

## Fase 4. Restaurar la base de datos y los usuarios

1. Preparar en el servidor local las mismas extensiones de PostgreSQL usadas en la nube.
2. Restaurar roles, esquema y datos desde el respaldo oficial.
3. Verificar que estén presentes todas las tablas del sistema.
4. Verificar que se hayan conservado `auth.users`, perfiles, contraseñas y relaciones.
5. Confirmar que las políticas RLS, funciones, triggers, índices y permisos sean equivalentes.
6. Comparar la cantidad de registros de las tablas principales entre nube y servidor local.
7. Solicitar a todos los usuarios iniciar sesión nuevamente, porque las sesiones anteriores no serán válidas con las claves nuevas.

## Fase 5. Restaurar funciones y archivos

1. Desplegar localmente la función `manage-users` y cualquier otra Edge Function utilizada.
2. Configurar sus secretos únicamente en el servidor; nunca colocar claves administrativas en el navegador.
3. Mantener la carpeta `uploaded` en el disco local y conectarla al servidor de archivos actual.
4. Conservar las mismas rutas históricas para evitar romper fotos o expedientes.
5. Si posteriormente se usa Supabase Storage, transferir sus objetos por separado y volver a validar sus políticas.

## Fase 6. Conectar la aplicación al Supabase local

1. Cambiar la URL de Supabase por la IP privada o nombre local del servidor.
2. Sustituir la clave publicable por la generada en el Supabase local.
3. Mantener la clave secreta fuera de la aplicación web.
4. Configurar las URLs de Auth y redirección para la dirección local de la aplicación.
5. Compilar y publicar nuevamente la aplicación en la PC servidor.
6. Confirmar que todas las computadoras puedan abrirla desde la red local.

## Fase 7. Asegurar la red y el arranque automático

1. Permitir únicamente los puertos necesarios en el perfil de red privada.
2. No abrir el servidor directamente a Internet ni configurar port forwarding o DMZ.
3. Configurar Docker y la aplicación para iniciar automáticamente al encender la PC.
4. Configurar reinicio automático de los servicios cuando ocurra un fallo.
5. Evitar que Windows suspenda o hiberne la computadora servidor.
6. Comprobar el arranque completo después de reiniciar y después de un corte eléctrico simulado.

## Fase 8. Probar todo sin Internet

1. Desconectar Internet sin apagar la red local.
2. Iniciar sesión con cuentas de dueño, veterinaria y recepción.
3. Crear y eliminar usuarios según los permisos definidos.
4. Registrar, consultar, modificar y eliminar mascotas y expedientes.
5. Agregar, visualizar, modificar y eliminar vacunas, notas, archivos y fotografías.
6. Confirmar que cada rol solo pueda realizar las acciones permitidas por RLS.
7. Reiniciar el servidor y verificar que la información continúe disponible.
8. Reconectar Internet y confirmar que el funcionamiento local no cambie.

## Fase 9. Hacer el cambio definitivo

1. Programar una ventana breve sin captura de datos.
2. Crear el respaldo final de la nube y de la carpeta `uploaded`.
3. Restaurar cualquier cambio pendiente en el servidor local.
4. Cambiar todas las computadoras a la nueva dirección local.
5. Pedir a los usuarios que vuelvan a iniciar sesión.
6. Mantener el proyecto de nube sin escrituras durante un periodo de seguridad.
7. Declarar el servidor local como única fuente oficial después de validar los resultados.

## Fase 10. Respaldos y mantenimiento

1. Realizar respaldos automáticos diarios de PostgreSQL y de la carpeta `uploaded`.
2. Mantener al menos una copia desconectada y otra fuera de la PC servidor.
3. Probar periódicamente que los respaldos puedan restaurarse.
4. Vigilar espacio libre, salud de contenedores, errores y estado del disco.
5. Probar las actualizaciones de Supabase en una copia antes de aplicarlas al servidor principal.
6. Documentar contraseñas y procedimientos de recuperación en un lugar seguro.

## Fase 11. Plan de recuperación

1. Si la migración falla antes del cambio definitivo, volver a usar temporalmente Supabase en la nube.
2. Si el servidor local falla después del cambio, restaurar el último respaldo en otra computadora preparada.
3. No mezclar datos nuevos de ambos servidores sin un proceso de conciliación controlado.
4. Registrar la hora del último respaldo válido para conocer cualquier dato que deba capturarse nuevamente.

## Limitaciones que deben aceptarse

- Sin Internet no funcionarán servicios externos como correo SMTP, actualizaciones o acceso remoto.
- El alta de usuarios debe quedar confirmada por la función administrativa local y no depender de enlaces enviados por correo.
- La continuidad dependerá de que la PC servidor, Docker, el disco y la red local estén disponibles.
- Supabase Self-Hosted exige que el consultorio mantenga seguridad, actualizaciones, monitoreo y respaldos.

## Criterio de finalización

La migración estará terminada cuando todos los roles puedan iniciar sesión y realizar su trabajo completo sin Internet, los permisos sean correctos, los archivos estén disponibles, el servidor arranque solo y un respaldo se haya restaurado exitosamente en una prueba.

## Referencias oficiales

- [Supabase Self-Hosting con Docker](https://supabase.com/docs/guides/self-hosting/docker)
- [Restaurar un proyecto de Supabase Cloud en Self-Hosted](https://supabase.com/docs/guides/self-hosting/restore-from-platform)
