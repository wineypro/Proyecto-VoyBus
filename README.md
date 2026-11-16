# VoyBus

Aplicación móvil de transporte público (curso Desarrollo de Soluciones Móviles 2026-20, UCN).
Esta entrega cubre el módulo de **cuentas** (ACC) y el de **red de transporte** (RED-01 y RED-02) del ERS.

- Tablero de tareas: [Trello - VoyBus](https://trello.com/invite/b/6ac16544cd0f0bce0bbc9d44/ATTI6af3813f45548a2ffc39b85fcf105f8eFE8344E6/voybus-tablero)
- Integrantes: Israel Bolados (ACC-01, 02, 03, 04, 06) y Adriano Soca (ACC-05, 07, RED-01, 02)

## Estructura

| Carpeta | Contenido |
|---|---|
| `backend/` | API REST en Node.js + Express 5, Sequelize + SQLite, validación con Zod |
| `frontendmobile/` | App móvil con Expo (SDK 58) y Expo Router |
| `docs/` | Arquitectura, base de datos, casos de uso, diagrama de clases y riesgos |

## Requisitos

- Node.js 20 o superior y npm
- Expo Go en el celular (Android o iOS), con el celular y el computador en la **misma red WiFi**
- Conexión a internet en el celular: el mapa (OpenStreetMap) y el trazado por calles se descargan en línea

## 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # en Windows: copy .env.example .env
npm run db:reset            # crea la base de datos y carga los datos de demostración
npm run dev                 # queda escuchando en http://localhost:3000
```

El archivo `.env` **no se sube a Git**. Sus variables:

| Variable | Uso |
|---|---|
| `PORT` | Puerto del servidor (3000 por defecto) |
| `DB_PATH` | Ruta del archivo SQLite |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Envío de correos (opcional) |

**Correos.** Si `SMTP_USER` y `SMTP_PASS` quedan vacíos, los correos se **simulan**: el código de verificación se imprime en la consola del backend y se devuelve en la respuesta. Para enviar correos reales con Gmail se usa una *contraseña de aplicación* de 16 caracteres (no la contraseña normal de la cuenta). Algunos antivirus bloquean la conexión SMTP: si el envío falla con `self-signed certificate`, hay que desactivar su protección de correo.

Comandos útiles: `npm run db:seed` (recarga los datos de demostración sin borrar cuentas) y `npm run db:reset` (borra todo y vuelve a crear).

## 2. App móvil

```bash
cd frontendmobile
npm install
cp .env.example .env        # en Windows: copy .env.example .env
```

Edita `.env` y pon la **IP de tu computador en la red WiFi** (en el celular `localhost` no sirve):

```
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000
```

Luego:

```bash
npx expo start -c
```

Escanea el QR con Expo Go. Si la app no conecta, revisa que el backend esté corriendo, que la IP sea la correcta y que el firewall permita el puerto 3000. También se puede probar en el navegador con `w` en la terminal de Expo.

## Datos de demostración

Los datos cargados por el seed son **ficticios**: 3 líneas (L1, L2, L3, una de ellas suspendida), 10 paraderos y 6 recorridos. Los nombres de lugares existen en Antofagasta, pero las coordenadas son aproximadas y los recorridos y horarios son inventados; **no representan el servicio real**.

Cuenta de demostración (solo para pruebas locales):

- Correo: `demo@voybus.cl`
- Contraseña: `VoyBus123!`

## Qué incluye

**Cuentas**
- ACC-01 Registro con correo, verificación por código de 6 dígitos y términos de privacidad; al terminar se ofrece activar la verificación en dos pasos.
- ACC-02 Inicio de sesión con bloqueo temporal tras 5 intentos fallidos, código de la app autenticadora cuando el 2FA está activo, y acceso como invitado a líneas y paraderos.
- ACC-03 Cierre de sesión con confirmación.
- ACC-04 Recuperación de contraseña por código enviado al correo y cambio de contraseña con la sesión abierta (cierra las demás sesiones).
- ACC-05 Perfil (nombre, alias, foto, cambio de correo con verificación) y favoritos de líneas y paraderos.
- ACC-06 Preferencias: tema claro, oscuro o del sistema, y preferencia de notificaciones.
- ACC-07 Historial personal con filtros por fecha y línea.
- Verificación en dos pasos (TOTP RFC 6238) compatible con Google Authenticator, Microsoft Authenticator y Authy, con QR de configuración.

**Red de transporte**
- RED-01 Listado y búsqueda de líneas, sentidos, días y horarios, recorrido sobre un mapa real y paraderos en orden. Las suspendidas muestran aviso y las desactivadas no aparecen.
- RED-02 Listado y búsqueda de paraderos, mapa, líneas que pasan por cada uno y favoritos.

## Limitaciones conocidas

- **Registro e inicio de sesión con teléfono, Google o Apple**: no implementados (requieren servicios externos de pago o cuentas de desarrollador).
- **Recuperación de contraseña**: usa un código enviado al correo en lugar de un enlace temporal.
- **Notificaciones (ACC-06)**: solo se guarda la preferencia; no se envían notificaciones push ni se consulta el permiso del dispositivo.
- **Idioma**: solo español.
- **2FA**: no hay códigos de recuperación; si se pierde el celular con la autenticadora, la cuenta no se puede recuperar por la app.
- **Historial (ACC-07)**: queda vacío porque los viajes y solicitudes de parada pertenecen a módulos que no forman parte de esta entrega.
- **Eliminación de cuenta**: no implementada.
- **Términos de privacidad**: texto de ejemplo con fines académicos, sin revisión legal.
- **Mapa**: requiere internet. El trazado por calles usa el servicio público de demostración de OSRM; si no responde, se dibuja una línea recta entre paraderos.
- La contraseña de la cuenta de demostración está en el seed solo para pruebas locales.

## Flujo de trabajo

Ramas: `main` ← `dev` ← `IsraelBolados` / `AdrianoSoca`. Los cambios entran a `dev` mediante pull request con merge commit, y `dev` pasa a `main` al cerrar la entrega. Los commits siguen el formato `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.
