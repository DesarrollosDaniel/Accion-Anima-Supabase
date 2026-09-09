# Análisis del respaldo MySQL

Archivo analizado: `accion_animal_db.sql`.

El respaldo contiene información personal y clínica real. Debe mantenerse fuera del repositorio y transferirse únicamente por medios privados. Este informe no reproduce nombres, teléfonos, direcciones ni contenido médico.

## Inventario

- tamaño aproximado: 12.5 MB;
- 39,745 líneas de contenido SQL;
- 14,979 filas de mascotas;
- 24,416 filas de expedientes;
- 4,884 referencias textuales a rutas clínicas históricas;
- dos tablas: `mascota` y `expediente`.

## Estructura heredada

### `mascota`

Contiene en una sola fila los datos de la mascota y los del responsable: nombre, nacimiento, peso, características, especie, raza, alimento, sexo, esterilización, baja, foto, nombre del responsable, teléfono, dirección, medio de referencia y fecha.

### `expediente`

Contiene historia clínica, examen físico, diagnóstico, tratamiento, presupuesto, rutas de fotos y archivos, mascota asociada, profesional, signos clínicos y fecha.

## Problemas que no se trasladarán literalmente

- no se intentará deduplicar a los tutores: por decisión funcional, nombre y teléfono permanecerán dentro de cada mascota y podrán repetirse;
- ausencia de una clave foránea declarada entre expedientes y mascotas;
- identificadores enteros autoincrementales predecibles;
- pesos almacenados como `float`;
- presupuestos almacenados como texto;
- valores clínicos mezclados con texto libre;
- valores booleanos expresados con números o textos como sí/no;
- errores históricos de nombres, por ejemplo `estirilizado`;
- columnas llamadas `fecha_creacion` que se actualizan automáticamente con cada modificación;
- rutas locales de `uploaded/` guardadas directamente en la tabla;
- falta de campos separados `created_at` y `updated_at`;
- falta de auditoría sobre quién creó, editó, dio de baja o eliminó un registro.

## Destino propuesto en PostgreSQL

- `profiles`: usuario, nombre visible, estado y rol (`owner`, `veterinarian` o `reception`);
- `pets`: mascotas, nombre y teléfono del tutor, foto principal y estado;
- `clinical_records`: expediente o consulta clínica;
- `clinical_files`: metadatos y objeto de Storage asociado al expediente;
- `vaccinations`: vacunas y próximas dosis;
- `medications`: prescripciones y tratamientos farmacológicos;
- `allergies`: alergias conocidas;
- `pet_notes`: notas generales o internas;
- `weight_records`: historial de peso;
- `audit_events`: acciones sensibles y cambios de estado.

Los identificadores nuevos serán UUID. Los identificadores MySQL se conservarán temporalmente en columnas `legacy_id` únicas para relacionar la importación y comprobarla.

## Estrategia de migración

1. Crear el esquema nuevo, restricciones, índices y RLS mediante migraciones versionadas.
2. Importar mascotas conservando `legacy_id`, incluido el nombre y teléfono del tutor en cada fila.
3. Normalizar valores de especie, sexo, esterilización y baja sin descartar el valor original durante la validación.
4. Importar expedientes y comprobar que cada `ID_m` tenga una mascota válida.
5. Cuando llegue `uploaded/`, inventariar archivos, calcular hash, MIME y tamaño, y cruzarlos con las 4,884 rutas registradas.
6. Subir fotos principales a `pet-photos` y material clínico a `clinical-files` usando rutas basadas en UUID.
7. Crear las filas de `clinical_files` solo después de confirmar cada carga.
8. Comparar conteos, relaciones, archivos faltantes y muestras antes de aceptar la migración.
9. Conservar el respaldo original sin cambios hasta validar el nuevo sistema.

## Seguridad prevista

- todas las tablas expuestas usarán RLS;
- existirá una sola cuenta dueña y será la única autorizada para administrar cuentas y roles;
- el registro público estará deshabilitado y las cuentas se crearán mediante invitación;
- una Edge Function autenticada verificará el rol del dueño antes de llamar a la API administrativa de Supabase Auth;
- la clave secreta utilizada por esa función permanecerá exclusivamente en Supabase;
- todos los usuarios autenticados podrán consultar todos los registros;
- recepción podrá crear y editar mascotas y sus datos de tutor;
- solo veterinarias/os podrán crear o editar información clínica y ejecutar bajas, reactivaciones o eliminaciones;
- las fotos principales serán públicas, pero su carga, reemplazo y borrado requerirán autenticación;
- los archivos clínicos serán privados;
- la aplicación de GitHub Pages utilizará únicamente la URL del proyecto y la clave publicable de Supabase;
- la clave secreta o `service_role` no se incluirá en el navegador ni en GitHub.

## Validaciones pendientes al recibir `uploaded/`

- archivos referenciados que no existen;
- archivos existentes sin referencia en la base;
- duplicados por contenido;
- extensiones y tipos MIME no permitidos;
- nombres incompatibles con Storage;
- tamaño total y límites necesarios;
- fotos principales que no incluyen extensión o cuyo nombre histórico es ambiguo.
