# Tienda Vasquez · Frontend

Angular 22 con arquitectura **Vertical Slice**, TanStack Query para datos del servidor y Signals para estado local. Autenticación por correo/contraseña y Google contra una API NestJS.

## Desarrollo

```bash
npm ci
npm start
```

Frontend: **http://localhost:4200**. Backend: **http://localhost:3000**.
La URL de la API se configura en `src/environments/environment.ts`; usar HTTPS en producción.

## Arquitectura

Cada funcionalidad agrupa sus pantallas, API, modelos, consultas, mutaciones y rutas. No se utilizan capas `domain/application/infrastructure`, repositorios, casos de uso por operación ni stores adicionales para CRUD.

```text
src/app/
├── core/
│   ├── auth/
│   │   ├── auth.api.ts            # HTTP de login y canje de código
│   │   ├── auth.service.ts        # Sesión con Signals y expiración
│   │   ├── auth.model.ts
│   │   ├── auth.guard.ts          # Guards de sesión e invitado
│   │   └── auth.interceptor.ts    # Bearer y 401 protegidos
│   ├── access-control/            # Perfil, códigos, consulta y guard de permisos
│   ├── errors/api-error.ts
│   └── query/
│       ├── http-query.ts          # Observable → Promise con cancelación HTTP
│       └── session-query-cache.ts # Limpieza de caché entre sesiones
├── shared/components/            # UI genérica: campos, tabla, diálogo, paginación
├── layouts/admin-layout/         # Shell, menú y composición de rutas privadas
├── features/
│   ├── auth/
│   │   ├── login/
│   │   ├── auth-callback/
│   │   └── auth.routes.ts
│   ├── personas/
│   │   ├── pages/
│   │   │   ├── personas-list/
│   │   │   ├── persona-create/
│   │   │   ├── persona-edit/
│   │   │   └── persona-page.css
│   │   ├── components/persona-form/
│   │   │   ├── persona-form.ts / .html / .css
│   │   │   └── persona-form.defaults.ts
│   │   ├── api/personas.api.ts
│   │   ├── queries/
│   │   │   ├── personas.keys.ts
│   │   │   ├── personas.queries.ts
│   │   │   └── personas.mutations.ts
│   │   ├── models/
│   │   │   ├── persona.model.ts
│   │   │   └── persona-submission.model.ts
│   │   ├── persona-save-error.ts
│   │   └── personas.routes.ts
│   ├── empresa/
│   │   ├── pages/empresa/
│   │   │   └── empresa.ts / .html / .css
│   │   ├── api/empresa.api.ts
│   │   ├── queries/
│   │   │   ├── empresa.keys.ts
│   │   │   ├── empresa.queries.ts
│   │   │   └── empresa.mutations.ts
│   │   ├── models/empresa.model.ts
│   │   └── empresa.routes.ts
│   ├── usuarios/                 # Listado, detalle modal, creación y edición
│   ├── roles/                    # Listado, creación y gestión de permisos
│   ├── marcas/                   # Listado y CRUD de marcas
│   ├── categorias/               # Listado y CRUD de categorías
│   └── inicio/                   # Pantalla provisional reutilizada por el menú
├── app.config.ts
└── app.routes.ts
```

Los archivos `.spec.ts` viven junto al código que prueban. Empresa y personas se organizan por alcance: `pages/<pantalla>/` contiene cada pantalla; `api/`, `queries/` y `models/` reúnen lo compartido de la feature. Las features pequeñas que no necesitan estas divisiones pueden conservar archivos planos.

Marcas está disponible en `/admin/marcas`, con creación en `/admin/marcas/nueva` y edición en `/admin/marcas/:id/editar`. Consume `/marcas` y exige los permisos correspondientes; editar requiere también lectura. La eliminación requiere confirmación.

Categorías está disponible en `/admin/categorias`, con creación en `/admin/categorias/nueva` y edición en `/admin/categorias/:id/editar`. Consume `/categorias`; editar requiere lectura y edición, y la eliminación requiere confirmación y permiso específico.

### Organización por alcance

- Lo utilizado por varias páginas vive a nivel de la feature: `components/`, `services/`, `api/`, `queries/` o `models/`, según su responsabilidad.
- Lo exclusivo de una pantalla vive dentro de `pages/<pantalla>/`: componentes, helpers, servicios o queries específicos. Se pueden mantener archivos planos mientras sean pocos.
- El formulario de personas y su inicializador viven en `components/persona-form/` porque los comparten las páginas de creación y edición. El formulario administra campos, validaciones y foto; recibe datos iniciales, estado de guardado y errores, y emite guardar/cancelar. No consulta HTTP ni navega.
- Una misma API puede atender todas las páginas de su feature. No duplicar APIs, consultas ni invalidaciones por pantalla.
- `services/` solo se agrega para una responsabilidad concreta que no corresponda a API, queries o mutations. No crear un servicio intermediario que repita métodos HTTP ni un store que duplique la caché.
- Crear, editar o ver detalle pueden ser páginas hermanas dentro de `pages/`, con rutas definidas en `*.routes.ts`. Personas tiene listado, creación y edición independientes; las páginas coordinan TanStack Mutation, errores del servidor y navegación. No hay una pantalla de detalle ni un diálogo de personas.
- No crear carpetas vacías para componentes, servicios o funcionalidades futuras.

### Imports con alias

`tsconfig.json` define `"@/*": ["./src/app/*"]`, heredado por aplicación y pruebas. Usar imports como `@/core/auth/auth.service`, `@/shared/components/text-field/text-field` o `@/features/personas/queries/personas.queries` para referencias entre carpetas. Los archivos vecinos pueden usar `./archivo`. El alias no incluye `src/environments` y no cambia las URLs ni los permisos de dependencia entre features.

### Responsabilidades

| Ubicación            | Responsabilidad                                                         |
| -------------------- | ----------------------------------------------------------------------- |
| `core/`              | Sesión e infraestructura transversal; no servicios CRUD de negocio.     |
| `shared/components/` | UI genérica sin APIs, sesión ni conocimiento de las features.           |
| `layouts/`           | Estructura visual, navegación y composición de rutas.                   |
| `features/<nombre>/` | Implementación completa de una funcionalidad.                           |
| `*.api.ts`           | HttpClient, endpoints, parámetros y multipart; sin caché ni navegación. |
| `*.queries.ts`       | `queryOptions`, claves y política de consultas.                         |
| `*.mutations.ts`     | `mutationOptions`, escrituras y actualización/invalidación de caché.    |
| Página / diálogo     | Formularios, filtros, interacción, mensajes y navegación.               |

Las features pueden usar `core` y `shared`, pero no deben importar pantallas ni archivos internos de otras features. No mover tipos de negocio a `shared` solo para acortar imports.

### Datos del servidor y estado local

```text
Página / Diálogo → Queries / Mutations → Api → HttpClient → NestJS
```

- TanStack Query administra datos remotos, carga, errores y caché. No copiar listados a otro store o `signal<Persona[]>`.
- Los filtros, paginación y estado visual son locales. Los parámetros que cambian una respuesta deben formar parte de su `queryKey`.
- Un formulario sí puede tener un borrador independiente de los datos guardados. No sobrescribirlo con un refetch mientras el usuario edita.
- El formulario compartido de personas usa Signal Forms: modelo con `signal`, esquema de validación con `form` y campos conectados mediante `[formField]`. Inicializa el borrador al cambiar de ID, no en cada refetch. La foto conserva su validación local de formato y tamaño y se mantiene la foto anterior al editar sin seleccionar otra.
- Las queries de personas y empresa usan `staleTime: 60_000` y un reintento. La consulta individual de personas no reintenta errores 4xx. Las mutaciones no se reintentan automáticamente.
- Las APIs devuelven Observables. `httpQuery` los adapta a Promise conectando el `AbortSignal` de TanStack con la cancelación de HttpClient; las mutaciones usan `firstValueFrom`.
- La creación administrativa de usuarios es una excepción: usa RxJS sin TanStack Mutation para no guardar la contraseña en `MutationCache`. Se limpia el campo al enviar, se cancela la suscripción al destruir la pantalla y se invalida el listado solo si sigue vigente la sesión.
- Guardar una persona cancela una consulta individual pendiente, actualiza esa entrada con la respuesta de la API e invalida los listados; guardar empresa actualiza su entrada de caché. Las claves se centralizan en `queries/*.keys.ts`, compartidas por consultas y mutaciones.
- Los callbacks de caché viven en las mutaciones; los de UI se pasan a `mutate(...)` para no reemplazar los primeros.

### Autenticación: sin TanStack Query

```text
Login / AuthCallback → AuthService → AuthApi → HttpClient → NestJS
```

Login y callback utilizan RxJS, `takeUntilDestroyed` y Signals locales, sin `injectQuery` ni `injectMutation`. La sesión compartida reside en `core/auth`; sus pantallas, en `features/auth`.

`AuthService` no importa TanStack. Publica un evento al limpiar la sesión; la integración global `provideSessionQueryCache()` cancela las consultas en curso y limpia la caché al cerrar sesión, expirar, recibir un 401 protegido o aceptar una nueva sesión. Las mutaciones comparan una versión numérica del ciclo de sesión antes de modificar la caché para ignorar respuestas de una sesión anterior, sin guardar el JWT en su contexto. Esto no cancela ni revierte escrituras ya enviadas al servidor.

### Perfil y permisos

`GET /api/v1/auth/me` devuelve usuario, persona vinculada (o `null`), roles y permisos efectivos. La consulta de `core/access-control` se comparte mediante TanStack Query, con clave por ID de usuario y versión de sesión, `staleTime` de un minuto y cancelación HTTP; nunca incluye el JWT. Tras recargar, se vuelve a consultar. Los permisos no se guardan en `localStorage` ni se copian a otro store.

El menú y los botones se filtran por código, y los guards esperan el perfil antes de permitir la navegación. Los errores de carga tienen reintento y son distintos de acceso denegado. Un 403 en una operación invalida el perfil de la sesión actual, sin cerrar sesión. La API verifica permisos en cada petición: la caché solo controla la interfaz y puede quedar temporalmente desactualizada. Los códigos locales deben coincidir con `src/access-control/policies/permissions.ts` del backend.

## Rutas y funcionalidades

- `/login`: ingreso por contraseña o Google; redirige a `/admin` si ya hay sesión.
- `/auth/callback`: recibe `#code=...`, lo retira inmediatamente y lo canjea una sola vez con la cookie del navegador.
- `/admin`: shell protegido e inicio provisional.
- `/admin/empresa`: consultar y guardar información y logo de la empresa.
- `/admin/personas`: listado paginado y búsqueda, con enlaces para crear y editar.
- `/admin/personas/nueva`: registro de persona con fotografía opcional.
- `/admin/personas/:id/editar`: edición mediante consulta por UUID; funciona sin visitar previamente el listado y después de recargar. Muestra estados de carga, error y registro inexistente.
- `/admin/usuarios`: listado con búsqueda y paginación local; el diálogo muestra persona y roles. Consultar datos personales completos requiere `personas.leer`.
- `/admin/usuarios/nuevo` y `/admin/usuarios/:id/editar`: creación protegida y edición por UUID. La interfaz de creación exige seleccionar una persona y disponer de `personas.leer`; la edición permite desvincularla y no cambia contraseñas. El contrato de la API sigue permitiendo una persona nula.
- `/admin/roles-permisos`, `/admin/roles-permisos/nuevo` y `/admin/roles-permisos/:id`: lista, creación en dos pasos y administración del rol. La creación permite incluir permisos en la misma operación cuando se dispone del permiso de asignación y acceso al catálogo; también se puede crear sin permisos. El listado permite confirmar la eliminación con `roles.eliminar`; la API impide borrar roles protegidos o asignados a usuarios.
- `/admin/acceso`: mensaje de acceso denegado o error de perfil con opción de reintentar.
- Las demás entradas del menú siguen siendo pantallas provisionales; no son CRUD implementados.

`app.routes.ts` compone autenticación y layout privado. `admin.routes.ts` conecta las features mediante `loadChildren`; cada feature define sus rutas y carga sus páginas con `loadComponent`. El guard se aplica también al navegar entre rutas hijas privadas.

Crear o actualizar correctamente devuelve al listado con un mensaje de éxito. Cancelar vuelve sin escribir. Estas páginas requieren los endpoints autenticados `GET /api/v1/personas/:id`, `POST /api/v1/personas` y `PUT /api/v1/personas/:id`; el backend vecino implementa el GET por ID con validación UUID, filtro de empresa y 404 si no existe.

Personas y empresa requieren sus permisos `leer`; sus acciones de escritura requieren `crear` o `editar` según corresponda. La edición de una persona requiere además `personas.leer` para cargar sus datos. La creación no implica lectura y, si falta esta última, vuelve al inicio en lugar de al listado. Usuarios y roles tienen permisos independientes de lectura, creación y edición; la asignación requiere su permiso específico y acceso al catálogo correspondiente. La creación de usuarios se abre desde el listado y requiere seleccionar una persona en la interfaz. El backend impide administrar permisos o roles superiores a los propios y protege el último administrador.

## Configuración del backend y Google

En el `.env` del backend:

```dotenv
FRONTEND_CALLBACK_URL=http://localhost:4200/auth/callback
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/oidc/google/callback
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
```

Registrar `GOOGLE_CALLBACK_URL` como URI de redireccionamiento autorizada en Google Cloud. El secreto permanece exclusivamente en el backend. No mezclar `127.0.0.1` con callbacks configurados en `localhost`. El backend debe permitir CORS con credenciales al origen del frontend.

El callback valida el código, lo quita de la URL antes del canje y usa `withCredentials: true`. No cachear ni reintentar automáticamente ese canje; si falla, iniciar de nuevo el acceso con Google.

Para contraseña, crear primero una cuenta mediante `POST /api/v1/users` (Swagger del backend: `/docs`). Las cuentas nuevas no reciben roles automáticamente; consultar `docs/roles-permisos.md` del backend para asignarlos. Los guards controlan navegación; la API valida JWT y permisos.

## Seguridad de sesión

- El JWT se guarda en `sessionStorage` por pestaña y permite recargar sin volver a ingresar.
- No guardar contraseñas ni poner JWT en URLs, claves de TanStack o caché de consultas/mutaciones.
- El interceptor envía Bearer únicamente a esta API y excluye login y canje del código.
- Al vencer, cerrar sesión o recibir un 401 protegido, se eliminan sesión y caché. Un 401 por credenciales incorrectas no se trata como expiración.
- No hay refresh tokens. El JWT en almacenamiento web es accesible a JavaScript: evitar scripts no confiables y configurar CSP/HTTPS.
- La lectura local de claims no verifica la firma; esa validación corresponde al backend.
- Para revocación inmediata o persistencia más segura, implementar sesiones/refresh con cookies HttpOnly en el backend.

## Interfaz

Tailwind CSS, DaisyUI, iconos Lucide y Angular CDK para diálogos. Los componentes reutilizables están en `src/app/shared/components/`; los estilos globales y temas, en `src/styles.css`. Conservar el diseño y la accesibilidad al agregar funcionalidades.

## Verificación y despliegue

```bash
npm run build
npm test -- --watch=false
```

Las pruebas cubren sesión, login, callback de un solo uso, interceptor, rutas lazy, formularios, CRUD disponible y aislamiento de caché entre sesiones.

El build puede emitir advertencias por los presupuestos de bundle inicial y CSS; no aumentar esos límites para ocultarlas.

En producción, configurar el servidor para devolver `index.html` en rutas Angular como `/admin/personas` y `/auth/callback`, actualizar API/callbacks y mantener frontend/API en un mismo sitio para las cookies SameSite.

Las convenciones para agentes y contribuciones están en [`AGENTS.md`](AGENTS.md).

El catálogo de unidades de medida está disponible en `/admin/unidades-medida`, con búsqueda, paginación y permisos `unidades-medida.*`.

El punto de venta está en `/admin/ventas/nueva`. Requiere `ventas.crear`, `productos.leer` y `unidades-medida.leer`; para seleccionar un cliente y registrar ventas fiadas también requiere `personas.leer`. Usa el catálogo y stock del servidor, permite seleccionar presentación y registra ventas al contado o fiadas mediante `POST /ventas`. Tras un fallo se conserva el carrito y se reutiliza el identificador si se reintenta con los mismos datos.

El punto de venta muestra el filtro por categorías para usuarios con `categorias.leer`; combina categoría y búsqueda con paginación del servidor. Las tarjetas muestran la imagen del producto completa o un icono si no está disponible.

Al registrar una venta, el punto de venta muestra la nota guardada y permite abrir su PDF para imprimir. Si la consulta o generación falla, el ticket puede reintentarse sin volver a registrar la venta. El navegador puede solicitar permiso para abrir una ventana emergente.

El historial de ventas está en `/admin/ventas` y requiere `ventas.leer`. Muestra por defecto el día local, permite filtrar por fechas e imprimir los tickets de todos los vendedores. Los límites del rango se interpretan en la zona horaria de Lima.
