# Plan de Testing — Casos de Prueba Manuales

Este documento contiene casos de prueba manuales organizados por categorías. Cada caso incluye: ID, Objetivo, Precondiciones, Pasos, Resultado esperado y Prioridad.

---

## Resumen de tareas

- **Login**: autenticación, logout y manejo de errores.
- **Dashboard**: carga, filtros, widgets y exportaciones.
- **CRUD (Clientes, Reservas, Ventas, Productos)**: crear/editar/eliminar/buscar/paginación.
- **Validaciones**: campos obligatorios, longitudes, formatos, fechas, duplicados.
- **Seguridad**: control de accesos, errores 401/403, sesión expirada.
- **Performance**: tiempos de carga, tablas y reportes.
- **Responsive**: Desktop / Tablet / Mobile.
- **Accesibilidad**: navegación por teclado, foco, contraste.
- **Compatibilidad**: Chrome, Firefox, Edge.

---

## Smoke

S-01
Objetivo: Verificar que un usuario con credenciales válidas puede iniciar sesión y acceder al dashboard.
Precondiciones: Usuario válido registrado.
Pasos:
1. Abrir la aplicación en la URL de staging.
2. Ir a la pantalla de login.
3. Ingresar usuario y contraseña válidos.
4. Pulsar "Ingresar".
Resultado esperado: El usuario es redirigido al dashboard; código HTTP 200; elementos principales visibles.
Prioridad: Alta

S-02
Objetivo: Verificar carga básica del dashboard.
Precondiciones: Usuario autenticado.
Pasos:
1. Acceder al dashboard.
2. Verificar que los widgets principales se cargan.
Resultado esperado: Widgets muestran datos sin errores visibles.
Prioridad: Alta

---

## Happy Path

HP-01
Objetivo: Crear un cliente nuevo correctamente.
Precondiciones: Usuario con permisos de CRUD en clientes.
Pasos:
1. Ir a la sección "Clientes".
2. Pulsar "Nuevo Cliente".
3. Rellenar campos obligatorios (nombre, teléfono, email válido).
4. Guardar.
Resultado esperado: Cliente creado, aparece en la lista; mensaje de éxito; datos persistidos.
Prioridad: Media

HP-02
Objetivo: Registrar una reserva para una consola disponible.
Precondiciones: Consola libre, usuario autenticado.
Pasos:
1. Ir a "Reservas".
2. Pulsar "Nueva Reserva".
3. Seleccionar cliente y consola; elegir fecha y hora válidas.
4. Guardar.
Resultado esperado: Reserva creada y visible en la lista y calendario.
Prioridad: Media

HP-03
Objetivo: Realizar una venta (flujo de venta estándar).
Precondiciones: Productos disponibles, caja abierta (si aplica).
Pasos:
1. Ir a "Ventas".
2. Seleccionar cliente (opcional) y añadir productos.
3. Completar pago con método válido.
4. Confirmar venta.
Resultado esperado: Venta registrada, ticket generado, stock decrementado.
Prioridad: Alta

---

## Edge Cases

EC-01
Objetivo: Crear cliente con email ya existente (duplicado).
Precondiciones: Cliente con email existente en BD.
Pasos:
1. Ir a "Clientes" → "Nuevo Cliente".
2. Usar el mismo email que un cliente existente.
3. Intentar guardar.
Resultado esperado: Mensaje de error indicando duplicado; no se crea registro.
Prioridad: Media

EC-02
Objetivo: Reservar con fecha en el pasado.
Precondiciones: Cliente válido.
Pasos:
1. Ir a "Reservas" → "Nueva Reserva".
2. Seleccionar fecha/hora anterior a la actual.
3. Intentar guardar.
Resultado esperado: Validación que impide guardar; mensaje explicativo.
Prioridad: Media

EC-03
Objetivo: Editar un registro que fue eliminado por otro usuario (condición de carrera).
Precondiciones: Registro creado; otro usuario elimina el registro.
Pasos:
1. Abrir el formulario de edición para el registro.
2. Simular que otro usuario elimina el registro.
3. Intentar guardar cambios.
Resultado esperado: Mostrar mensaje que el registro ya no existe y refrescar lista.
Prioridad: Baja

---

## Error Handling

EH-01
Objetivo: Login con contraseña incorrecta.
Precondiciones: Usuario válido.
Pasos:
1. Ir a login.
2. Introducir usuario válido y contraseña incorrecta.
3. Enviar.
Resultado esperado: Mensaje de credenciales inválidas; no redirección; contador de intentos (si aplica).
Prioridad: Alta

EH-02
Objetivo: Acceso a ruta protegida sin autenticación.
Precondiciones: Sesión no iniciada.
Pasos:
1. Navegar directamente a una URL protegida (/admin/*).
Resultado esperado: Redirección a login con código 401/302 según implementación.
Prioridad: Alta

EH-03
Objetivo: Manejo de errores 500 en operaciones críticas.
Precondiciones: Forzar error de servidor (staging con endpoint mock).
Pasos:
1. Ejecutar operación que llama al endpoint afectado (ej. exportar reporte).
Resultado esperado: Mensaje de error amigable; no crash de UI; opción de reintentar.
Prioridad: Media

---

## Seguridad

SEC-01
Objetivo: Verificar control de permisos (roles) para acciones CRUD.
Precondiciones: Usuarios con rol limitado y rol administrador.
Pasos:
1. Ingresar con usuario de rol limitado.
2. Intentar acceder a funciones de administración (p.ej. eliminar registros).
Resultado esperado: Acceso negado (403) y mensajes adecuados; acciones no visibles si UI está escondida.
Prioridad: Alta

SEC-02
Objetivo: Verificar expiración de sesión y re-autenticación.
Precondiciones: Usuario autenticado.
Pasos:
1. Dejar inactiva la sesión hasta su expiración (o forzar expiración).
2. Intentar realizar acción que requiere autenticación.
Resultado esperado: Redirección a login y preservación de estado cuando sea seguro.
Prioridad: Alta

SEC-03
Objetivo: Pruebas básicas de inyección (input fields).
Precondiciones: Acceso a formularios de entrada.
Pasos:
1. Introducir payloads simples (scripts, SQL-like strings) en campos de texto.
2. Guardar/Enviar.
Resultado esperado: Entradas sanitizadas/validadas; no ejecución ni exposición de datos.
Prioridad: Alta

---

## Performance

PERF-01
Objetivo: Medir tiempo de carga inicial del dashboard.
Precondiciones: Entorno staging con datos representativos.
Pasos:
1. Borrar cache del navegador.
2. Acceder a la URL del dashboard.
3. Medir tiempo hasta primer render usable.
Resultado esperado: Tiempo de carga dentro del SLA (definir objetivo, p.ej. < 3s).
Prioridad: Media

PERF-02
Objetivo: Carga de tablas con 1000+ registros.
Precondiciones: Dataset de prueba con >1000 registros.
Pasos:
1. Ir a la lista que soporta paginación.
2. Navegar por varias páginas y aplicar filtros.
Resultado esperado: Tiempo de respuesta aceptable; paginación funcional.
Prioridad: Media

---

## Responsive

RESP-01
Objetivo: Verificar visualización del dashboard en Desktop (1366x768).
Precondiciones: Ninguna.
Pasos:
1. Abrir la aplicación en Desktop.
2. Revisar layout, widgets y menús.
Resultado esperado: Diseño correcto, elementos accesibles.
Prioridad: Baja

RESP-02
Objetivo: Verificar que el menú y formularios funcionen en Mobile (375x812).
Precondiciones: Ninguna.
Pasos:
1. Cambiar vista a mobile.
2. Abrir menú, navegar a formularios y enviar uno corto.
Resultado esperado: Menú desplegable funcional; formularios usables y legibles.
Prioridad: Media

---

## Accesibilidad

ACC-01
Objetivo: Navegación completa por teclado en el flujo de login.
Precondiciones: Ninguna.
Pasos:
1. Acceder a la página de login.
2. Navegar con `Tab` y `Shift+Tab` hasta el botón de envío.
3. Activar con `Enter`.
Resultado esperado: Todos los campos y botones son alcanzables por teclado; foco visible.
Prioridad: Alta

ACC-02
Objetivo: Contraste de colores en componentes clave.
Precondiciones: Ninguna.
Pasos:
1. Revisar contraste de texto sobre fondos en header, botones y alertas.
Resultado esperado: Cumple con WCAG AA para texto normal.
Prioridad: Media

---

## Compatibilidad

COMP-01
Objetivo: Validar funcionalidad básica en Chrome, Firefox y Edge (últimas versiones).
Precondiciones: Ninguna.
Pasos:
1. Ejecutar casos smoke (S-01, S-02) en cada navegador.
Resultado esperado: Comportamiento consistente; reportar discrepancias.
Prioridad: Media

---

## Notas y próximos pasos

- Convertir estos casos a checklist en la herramienta de gestión (Jira/Trello) si se desea.
- Para pruebas de performance/seguridad avanzadas usar herramientas automatizadas (Lighthouse, JMeter, OWASP ZAP).
