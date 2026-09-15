# Mantener Acción Animal siempre activo en Windows

La opción recomendada es usar el **Programador de tareas de Windows** en la PC que almacenará la carpeta `uploaded`. De esta manera, el servidor local se iniciará automáticamente al encender la computadora, incluso si nadie ha iniciado sesión.

## Crear la tarea automática

1. Abre el **Programador de tareas** de Windows.
2. En el panel derecho, selecciona **Crear tarea**. No uses “Crear tarea básica”.
3. En la pestaña **General**, configura:

   - Nombre: `Accion Animal - Servidor local`
   - Activa **Ejecutar tanto si el usuario inició sesión como si no**.
   - Activa **Ejecutar con los privilegios más altos**.
   - Selecciona la versión de Windows instalada en la PC.

4. En la pestaña **Desencadenadores**, crea uno con estos valores:

   - Iniciar la tarea: **Al iniciar el sistema**.
   - Retrasar la tarea: **30 segundos**.
   - Estado: **Habilitado**.

5. En la pestaña **Acciones**, selecciona **Iniciar un programa** y configura:

   Programa o script:

   ```text
   C:\Program Files\nodejs\node.exe
   ```

   Agregar argumentos:

   ```text
   --env-file-if-exists=.env.local --env-file-if-exists=.env.server server\local-server.mjs
   ```

   Iniciar en:

   ```text
   D:\AccionAnimal\app\accion-animal-supabase
   ```

   Ajusta la ruta `D:\AccionAnimal\app\accion-animal-supabase` si el proyecto se instala en otro lugar. El campo **Iniciar en** no debe llevar comillas.

6. En la pestaña **Condiciones**:

   - Desmarca **Iniciar la tarea solamente si el equipo está conectado a corriente alterna**.
   - Desmarca **Detener si el equipo cambia a alimentación por batería**.
   - Activa **Activar el equipo para ejecutar esta tarea**, si está disponible.

7. En la pestaña **Configuración**:

   - Activa **Permitir que la tarea se ejecute a petición**.
   - Activa **Si la tarea falla, reiniciar cada 1 minuto**.
   - Configura al menos `10` intentos de reinicio.
   - En **Si la tarea ya se está ejecutando**, selecciona **No iniciar una instancia nueva**.
   - Desactiva **Detener la tarea si se ejecuta durante más de...**.

8. Guarda la tarea. Windows puede solicitar la contraseña del usuario de esa PC.

## Probar la tarea

1. Selecciona la tarea `Accion Animal - Servidor local`.
2. Pulsa **Ejecutar**.
3. Espera unos segundos.
4. Abre esta dirección en la PC servidor:

   ```text
   http://localhost:4173/api/health
   ```

Debe aparecer una respuesta que incluya:

```json
{"ok":true,"storage":"available","mode":"local"}
```

Después abre la aplicación:

```text
http://localhost:4173
```

Desde las demás computadoras del consultorio se utilizará la IP privada de la PC servidor, por ejemplo:

```text
http://192.168.0.25:4173
```

## Preparar Windows y la red

- Configura Windows para que la PC no entre en suspensión.
- Reserva una IP local para la PC servidor en el módem Arris.
- Mantén el puerto TCP `4173` permitido únicamente para el perfil de red **Privada** de Windows.
- No configures `Port Forwarding`, `Virtual Server`, `NAT` ni `DMZ` en el módem.
- Si el BIOS lo permite, activa el encendido automático después de un corte eléctrico.
- Es recomendable utilizar un regulador o UPS.

## Detener o reiniciar el servicio

Desde el Programador de tareas:

- **Finalizar** detiene temporalmente el servidor.
- **Ejecutar** vuelve a iniciarlo.
- **Deshabilitar** evita que arranque al encender Windows.

Después de actualizar el código de la aplicación, ejecuta en PowerShell:

```powershell
cd "D:\AccionAnimal\app\accion-animal-supabase"
npm ci
npm run build
```

Finalmente, usa **Finalizar** y después **Ejecutar** en el Programador de tareas para cargar la nueva versión.
