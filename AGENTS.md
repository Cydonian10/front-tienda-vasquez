# Guía del proyecto para agentes

## Stack y comandos

- Angular 22, componentes standalone, TypeScript estricto y Signals.
- TanStack Query Angular (`@tanstack/angular-query-experimental`) para datos del servidor, excepto autenticación.
- HttpClient y RxJS; Tailwind CSS, DaisyUI, Lucide y Angular CDK.
- Instalar: `npm ci`. Desarrollo: `npm start`.
- Validar cambios: `npm run build` y `npm test -- --watch=false`.
- No agregar dependencias ni cambiar versiones sin una necesidad justificada por la tarea.

## Arquitectura: Vertical Slice

- Cada funcionalidad vive completa en `src/app/features/<nombre>/`.
- `core/auth/`: API de autenticación, sesión compartida, modelos, guards e interceptor.
- `core/access-control/`: perfil autenticado, catálogo de códigos, guard y actualización de permisos tras 403; el perfil remoto pertenece a TanStack Query, no a `AuthService`.
- `core/errors/` y `core/query/`: infraestructura transversal y conexión sesión/caché.
- `shared/components/`: componentes visuales genéricos sin lógica de negocio, APIs o sesión.
- `layouts/`: shell visual y composición de navegación.
- No crear `core/services/<entidad>` ni volver a separar pantallas en un `pages/` global.
- No introducir Clean Architecture, repositorios, casos de uso por operación, NgRx o stores que dupliquen TanStack.
- Mantener features pequeñas con archivos planos. Crear subcarpetas cuando haya contenido suficiente, no por anticipación.
- Empresa y personas utilizan `pages/<pantalla>/`, `api/`, `queries/` y `models/`. Mantener esta estructura al trabajar en ellas; las mutaciones se agrupan con las consultas dentro de `queries/`.
- Organizar por alcance: componentes, servicios, helpers y queries exclusivos de una pantalla viven dentro de `pages/<pantalla>/`; si se utilizan desde varias páginas, moverlos al nivel compartido de la feature, sin copiarlos.
- Personas tiene `pages/personas-list/`, `pages/persona-create/` y `pages/persona-edit/`. El formulario compartido y su inicializador pertenecen a `components/persona-form/`. Conservar Signal Forms y no duplicar campos o validaciones entre las páginas.
- `PersonaForm` recibe persona inicial, estado de guardado, habilitación del envío y errores del servidor; emite datos válidos y cancelación. No importa APIs, queries, mutations ni Router. Las páginas coordinan peticiones y navegación.
- La edición obtiene los datos por ID desde la URL, sin depender del listado ni de router state. Al refrescar los datos de la misma persona, no sobrescribir el borrador; reinicializar solo al cambiar de ID.
- Crear `components/` o `services/` a nivel de feature solo cuando haya código compartido que lo justifique. Un servicio adicional debe tener una responsabilidad concreta, no repetir la API ni crear otro store de datos remotos.
- No crear features vacías para entradas de menú que aún son provisionales.
- Las features pueden importar `core` y `shared`; evitar dependencias entre archivos internos de distintas features. `core` y `shared` nunca importan features en código de producción.

## Convenciones por feature

- `*.api.ts`: clase inyectable con HttpClient, endpoints, parámetros, serialización y multipart. Devuelve Observables; no maneja UI, navegación ni caché.
- `*.queries.ts`: clase con métodos que retornan `queryOptions`; centraliza claves, política de caché y adaptación a Promise.
- En empresa y personas, las claves se definen en `queries/*.keys.ts` y son importadas directamente por queries y mutations. No duplicarlas ni cambiarlas por una reorganización de archivos.
- `*.mutations.ts`: clase con métodos que retornan `mutationOptions`; escrituras y coherencia de caché, sin cerrar diálogos ni mostrar mensajes.
- `*.model.ts`: interfaces, tipos y DTO propios de la feature.
- Página / componente: consume `injectQuery` e `injectMutation`, administra interacción y formulario.
- `*.routes.ts`: rutas de la feature y `loadComponent` de sus pantallas.
- Mantener `.spec.ts` junto al archivo probado; conservar HTML/CSS junto al componente.
- Seguir los nombres y el idioma de la feature existente. `@/*` apunta a `src/app/*` en `tsconfig.json`, heredado por app y tests. Usar `@/core/...`, `@/shared/...` o `@/features/...` entre carpetas y rutas relativas para archivos vecinos. El alias no elimina los límites entre features; no crear más aliases o barrels sin necesidad.

## TanStack Query y Signals

- TanStack es la fuente del estado remoto; no copiar datos de `query.data()` a un store o Signal solo para representarlos.
- Signals para filtros, página, apertura de UI, mensajes y sesión; Angular Forms/Signal Forms cuando corresponda al formulario.
- Un borrador editable de formulario sí es estado independiente. No sobrescribir cambios del usuario con refetches de fondo.
- Toda variable que cambie la respuesta (página, tamaño, búsqueda, identificadores) debe estar en `queryKey`.
- Guardar una persona actualiza su entrada individual e invalida listados, conservando la protección por versión de sesión. La consulta individual no reintenta errores 4xx.
- No poner tokens, contraseñas ni códigos de autenticación en claves o caché.
- La consulta de perfil usa el ID y la versión numérica de sesión en su clave. Un error de carga no equivale a ausencia de permisos; no mostrar acciones protegidas hasta obtener el perfil. Un 403 invalida el perfil sin cerrar sesión y sin afectar una sesión posterior.
- Para consultas HttpClient usar `httpQuery(observable, signal)` desde `core/query/http-query.ts`; propaga la cancelación al transporte HTTP.
- Para mutaciones usar `firstValueFrom`. No reintentar escrituras automáticamente.
- Excepción para crear usuarios con contraseña: `UsuariosMutations.crear` usa Observable sin TanStack Mutation para que el secreto no quede en `MutationCache`; la pantalla cancela la suscripción al destruirse y limpia el campo. La invalidación conserva la comprobación de versión de sesión.
- Invalidar solo claves afectadas, o usar `setQueryData` cuando la API devuelve el registro completo actualizado.
- La lógica de caché vive en `*.mutations.ts`. Pasar callbacks de UI a `mutate(variables, callbacks)`; no reemplazar por accidente el `onSuccess` de las opciones compartidas.
- Conservar la comprobación de `AuthService.sessionVersion` en callbacks de caché para que una mutación tardía no restaure datos privados después del logout. Guardar solo esa versión numérica en `onMutate`, nunca el objeto de sesión con su JWT.

## Autenticación: excepción explícita

- `features/auth/login` y `features/auth/auth-callback` no usan TanStack Query ni Mutation.
- Flujo: pantalla → `AuthService` → `AuthApi` → HttpClient.
- `AuthService` usa Signals para sesión, restaura `sessionStorage`, programa expiración y publica `sessionCleared`; no importa TanStack.
- `provideSessionQueryCache()` integra globalmente ese evento con cancelación de consultas y limpieza de caché. Mantenerlo registrado en `app.config.ts`.
- Mantener rutas `/login`, `/auth/callback` y `/admin` y el contrato HTTP del backend, salvo cambio explícito solicitado.
- En Google: leer el código del fragmento, retirarlo inmediatamente del historial/URL, validarlo y canjearlo una sola vez con `withCredentials: true`. Sin reintentos automáticos.
- No enviar Bearer a orígenes externos, login ni canje del código.
- Un 401 protegido cierra sesión; un 401 del login muestra error de credenciales, no expiración.
- No persistir contraseñas ni mover el JWT a URLs o localStorage. No agregar refresh tokens ni cambiar a cookies sin coordinar contrato de backend.
- Decodificar claims no verifica JWT: firma y autorización siempre son responsabilidad del backend.
- No asumir roles/permisos que no existen en la API. Los guards no sustituyen autorización del servidor.
- Mantener los códigos de `core/access-control/permissions.ts` sincronizados con el catálogo de la API. Crear personas no implica lectura; editar desde el formulario requiere también lectura para cargar el registro.

## Routing, interfaz y alcance

- `app.routes.ts` compone autenticación y layout privado; `admin.routes.ts` conecta features con lazy loading.
- Conservar guards al navegar entre rutas hijas privadas y mantener las URLs existentes.
- No agregar rutas provisionales para secciones que todavía no estén implementadas.
- Usuarios vive en `/admin/usuarios` y roles en `/admin/roles-permisos`. Los permisos nuevos se mantienen sincronizados con el catálogo del backend; asignar roles o permisos no implica permisos de lectura de catálogos.
- Marcas vive en `/admin/marcas`, con creación y edición en rutas hijas. El CRUD usa los permisos `marcas.*`; editar requiere también lectura y eliminar requiere confirmación.
- Categorías vive en `/admin/categorias` con creación y edición en rutas hijas. El CRUD usa los permisos `categorias.*`; editar requiere también lectura y eliminar requiere confirmación.
- Unidades de medida vive en `/admin/unidades-medida`, bajo Inventario; su CRUD usa permisos `unidades-medida.*`, requiere lectura para editar y confirmación para eliminar.
- La creación de roles permite seleccionar permisos antes de enviar `POST /roles` con `permisoIds`; una lista no vacía requiere `roles.asignar-permisos`, acceso al catálogo en la interfaz y posesión de los permisos seleccionados. El backend valida y guarda el rol y sus permisos en una transacción; crear sin permisos sigue siendo válido.
- El listado elimina roles mediante `DELETE /roles/:id` con confirmación y permiso `roles.eliminar`. El servidor rechaza roles protegidos, asignados a usuarios o con permisos que el actor no posee; no inferir que un rol está libre solo por el listado.
- Crear usuarios desde el listado exige seleccionar primero una persona y contar con `personas.leer` en la interfaz; el contrato HTTP sigue permitiendo `personaId: null` y la edición puede desvincular la persona. El menú lateral no ofrece una entrada independiente para crear usuarios.
- Conservar diseño, tema, accesibilidad, búsqueda, paginación y validaciones de archivos al refactorizar.
- No agregar un auth-layout u otras abstracciones sin reutilización real.

## Pruebas y documentación

- Probar APIs con HttpTestingController y QueryClient nuevo por prueba para evitar compartir caché.
- Cubrir cargas, errores, reintentos previstos, filtros/paginación, mutaciones e invalidación.
- Ante cambios de auth/caché, verificar logout, expiración, 401, canje único, cancelación HTTP y respuestas tardías de otra sesión.
- Actualizar README y esta guía si cambian arquitectura, comandos, rutas o contratos relevantes.
- No relajar presupuestos de tamaño, tipos ni pruebas para ocultar fallos; informar advertencias pendientes.
- No modificar archivos generados, dependencias, secretos ni cambios ajenos a la tarea.

## Punto de venta

- `/admin/ventas/nueva` requiere `ventas.crear`, `productos.leer` y `unidades-medida.leer`. Seleccionar clientes requiere `personas.leer`. El catálogo y las personas son consultas de TanStack; el carrito es un borrador local. Conservar el UUID de operación al reintentar la misma venta y no reintentar escrituras automáticamente.
- La feature de ventas sigue la estructura de marcas: `ventas.routes.ts`, `api/`, `models/`, `queries/` y `pages/punto-venta/`; `ventas.keys.ts` conserva las claves de caché de catálogos y detalle.

- `/admin/ventas` muestra el historial de todos los vendedores y requiere `ventas.leer`; permite filtrar por fecha y reabrir los tickets.
