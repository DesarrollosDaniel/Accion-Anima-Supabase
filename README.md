# Acción Animal — reconstrucción con Supabase

Esta carpeta contendrá la nueva versión del sistema. El proyecto PHP original se conserva intacto como referencia funcional y de datos.

## Objetivo confirmado

Reconstruir el sistema de Acción Animal con:

- código versionado en GitHub;
- PostgreSQL, autenticación y almacenamiento de archivos en Supabase;
- registro, consulta, edición, baja y eliminación de mascotas;
- expedientes clínicos con fotos y documentos;
- interfaz adaptable a computadora, tableta y teléfono;
- permisos y validaciones que eviten los riesgos presentes en la versión original.

## Arquitectura propuesta

### Aplicación

La aplicación será una SPA estática construida con React, TypeScript y Vite, conectada a Supabase mediante su cliente oficial. El código se versionará en GitHub y la compilación se publicará en GitHub Pages mediante GitHub Actions.

Esta elección evita depender de un servidor Node.js, que GitHub Pages no puede ejecutar. Toda autorización real se aplicará en Supabase mediante RLS; ocultar botones en el navegador será solamente una mejora de interfaz, no un mecanismo de seguridad.

### Base de datos

Modelo inicial propuesto:

- `profiles`: perfil y rol (`owner`, `veterinarian` o `reception`) de cada usuario autenticado;
- `pets`: información de las mascotas, nombre y teléfono del tutor, foto principal y estado activo/baja;
- `clinical_records`: consultas e historias clínicas;
- `clinical_files`: metadatos y ruta de cada foto o documento;
- tablas de catálogo si se necesitan especies, doctores u otros valores administrables.

Las relaciones, restricciones, índices, políticas RLS y reglas de eliminación se definirán mediante migraciones SQL versionadas.

### Imágenes y documentos

Supabase Storage sustituirá la carpeta local `uploaded/`.

Diseño acordado:

- bucket público `pet-photos`: foto principal de cada mascota;
- bucket privado `clinical-files`: fotografías clínicas y documentos;
- estructura de objetos basada en identificadores, no en nombres escritos por usuarios;
- la base de datos guardará ruta, nombre original, tipo MIME, tamaño, autor y fecha;
- los documentos privados se consultarán con sesión autenticada o URL firmada temporal;
- límites de tamaño y tipos permitidos se aplicarán tanto en Storage como en la aplicación.

Los archivos clínicos permanecerán privados y se consultarán únicamente por usuarios autenticados autorizados.

## Acceso y permisos acordados

- acceso mediante correo electrónico y contraseña;
- tres roles: dueño, veterinaria/o y recepción;
- existirá un único usuario con rol `owner`;
- solo el dueño podrá invitar y eliminar usuarios, activar o desactivar cuentas y asignar los roles de veterinaria/o o recepción;
- el registro público de cuentas permanecerá deshabilitado;
- todos los usuarios autenticados pueden consultar todas las mascotas y expedientes;
- recepción puede registrar y editar mascotas, incluyendo el nombre y teléfono del tutor en cada registro;
- veterinarias/os pueden registrar y editar mascotas, además de administrar toda la información clínica;
- solo veterinarias/os pueden dar de baja, reactivar o eliminar información;
- los roles usados para autorización no se confiarán a metadatos editables por el usuario;
- todas las tablas expuestas tendrán RLS y políticas explícitas;
- ninguna clave secreta o `service_role` formará parte de la aplicación publicada.

La administración de cuentas se realiza mediante la Supabase Edge Function autenticada `manage-users`. Esta comprueba en el servidor que quien realiza la solicitud sea el dueño antes de usar la API administrativa de Auth. La clave secreta permanece únicamente en el entorno seguro de Supabase. Desde la sección **Usuarios** el dueño indica nombre, correo y rol; la persona invitada recibe un enlace para crear su propia contraseña. El dueño también puede eliminar cuentas de Veterinaria o Recepción, pero no su propia cuenta ni otra cuenta dueña. Al eliminar, desaparecen el acceso de Auth y el perfil; las mascotas, expedientes, notas, eventos de auditoría y archivos creados por esa persona se conservan.

## Diseño visual acordado

- conservar logotipo y colores identificativos actuales;
- mejorar composición, navegación, formularios y adaptación responsive;
- apariencia profesional y sobria;
- tipografías legibles y controles accesibles;
- evitar animaciones o recursos visuales extravagantes.

## Funciones heredadas que se conservarán

- alta de mascota con nombre y teléfono de su tutor;
- búsqueda por mascota, propietario y teléfono;
- perfil con datos del animal y responsable;
- cálculo de edad;
- alta, edición y eliminación de expedientes clínicos;
- signos clínicos, diagnóstico, tratamiento, presupuesto y profesional responsable;
- múltiples fotos y documentos por expediente;
- galería y descarga de adjuntos;
- baja lógica y reactivación;
- eliminación definitiva, sujeta a permisos adecuados;
- diseño responsive.

## Módulos nuevos confirmados

- vacunas;
- medicamentos;
- alergias;
- notas;
- historial de peso.

## Ejecución local

La configuración real está en `.env.local`, archivo ignorado por Git. Para preparar otra computadora, copiar `.env.example` como `.env.local` y sustituir el marcador de la clave publicable.

```powershell
npm install
npm run dev
```

La compilación que se publicará en GitHub Pages se genera con:

```powershell
npm run build
```

## GitHub Pages

El proyecto incluye un workflow de GitHub Actions preparado para compilar y publicar automáticamente la rama `main`. Utiliza rutas relativas, por lo que funciona tanto en `https://usuario.github.io/repositorio/` como con un dominio personalizado sin cambiar el código.

Repositorio: `https://github.com/DesarrollosDaniel/Accion_animal_web`  
Sitio: `https://desarrollosdaniel.github.io/Accion_animal_web/`

Las instrucciones para crear el repositorio, configurar las variables públicas de Supabase y conectar la URL final con Auth están en [`GITHUB_PAGES.md`](GITHUB_PAGES.md).

## Decisiones pendientes

Antes de implementar se deben confirmar:

1. definir el procedimiento de migración cuando esté disponible la carpeta `uploaded/`;
2. completar perfil de mascota, formularios clínicos y archivos;
3. decidir el servicio definitivo para almacenar los aproximadamente 15 GB de archivos históricos.

## Estado

Arquitectura inicial, permisos y módulos documentados. El esquema local de Supabase está definido mediante migraciones versionadas e incluye pruebas pgTAP y una comprobación remota. El proyecto `hvfubwyzarikudisbwfy` está enlazado y existe exactamente un dueño activo. El modelo fue simplificado: no existen módulos independientes de tutores ni citas; cada mascota guarda directamente el nombre y teléfono del tutor, permitiendo datos repetidos. La aplicación React/Vite incluye acceso con correo y contraseña, panel, búsqueda y alta de mascotas. La sección Usuarios permite al dueño consultar perfiles, invitar personal de Veterinaria o Recepción y eliminar esas cuentas sin perder las acciones ni los archivos históricos; la Edge Function correspondiente está desplegada. El repositorio público y GitHub Pages están activos, y las redirecciones de Supabase apuntan al sitio publicado conservando el acceso local de desarrollo. La revisión TypeScript y la compilación de producción pasan correctamente. El respaldo `accion_animal_db.sql` fue localizado y analizado sin importarlo. La información histórica y la carpeta `uploaded/` aún no se han migrado.
