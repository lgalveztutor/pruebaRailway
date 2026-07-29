# Resumen Ejecutivo

El cuello de botella dominante no está en hooks ni en render puro, sino en acceso a datos y composición del panel. La evidencia más fuerte está en el dashboard y los reportes: hacen muchas consultas en paralelo, repiten lecturas sobre las mismas tablas y luego agregan datos en memoria del servidor antes de renderizar.

No encontré evidencia sólida de N+1 clásico, `select *` o `useEffect` problemáticos en las superficies revisadas. El riesgo real hoy es otro: demasiadas lecturas y agregaciones por request, más una capa de autenticación duplicada y una distribución del bundle que todavía no aprovecha lazy loading.

# Hallazgos

1. El dashboard y los reportes concentran el mayor costo de tiempo, red y base de datos.
	- Severidad: Crítico.
	- Impacto esperado: Tiempo, Red, CPU, Base de datos, UX.
	- Evidencia: en `app/admin/(panel)/dashboard/page.jsx` se lanzan muchas consultas con `Promise.all`, incluyendo lecturas duplicadas sobre `reservations` y `sale_items`, además de colecciones grandes como `reservations`, `birthday_reservations`, `poolfootball_sessions` y `sale_items` con límites de 2000/3000 filas. En `app/admin/(panel)/reportes/page.jsx` ocurre algo similar: `expenses` y `sale_items` se consultan más de una vez con objetivos distintos y luego se agrupan en JavaScript. En ambos casos el servidor recibe filas crudas y las transforma antes de responder.
	- Solución: mover agregaciones a SQL, vistas, RPCs o vistas materializadas; devolver al servidor solo KPIs y conjuntos ya resumidos; reutilizar una sola lectura por tabla cuando sea posible; dejar la agregación pesada en la base de datos.
	- Por qué mejora: reduce round trips, baja el volumen transferido por red, evita escanear y serializar más filas de las necesarias y quita trabajo del proceso Node.
	- Riesgos: hay que preservar RLS y revisar índices para que la nueva consulta agregada no termine siendo más cara que la actual; si se usan vistas materializadas, aparece el riesgo de datos algo desfasados.
	- Complejidad: Media a alta.
	- Estimación: Muy Alta.

2. La verificación de sesión está duplicada en middleware y en el layout del panel.
	- Severidad: Alto.
	- Impacto esperado: Tiempo, Red, UX.
	- Evidencia: `middleware.js` llama `supabase.auth.getUser()` para cada ruta `/admin`, y `app/admin/(panel)/layout.jsx` vuelve a llamar `createClient()` + `getUser()` antes de renderizar el shell. Eso implica dos validaciones de sesión por navegación protegida, no una.
	- Solución: centralizar la validación en una sola capa o reutilizar el resultado de la validación de entrada cuando el flujo lo permita; mantener solo la defensa mínima necesaria para el redirect, evitando repetir el fetch de usuario en el servidor si ya fue resuelto.
	- Por qué mejora: elimina una ida y vuelta extra a Supabase por request protegido y reduce latencia perceptible en cada entrada al panel.
	- Riesgos: si se simplifica de más, se pierde defensa en profundidad; la refactorización debe conservar el comportamiento de redirect actual.
	- Complejidad: Media.
	- Estimación: Alta.

3. Hipótesis: el bundle inicial del panel es más grande de lo necesario.
	- Severidad: Medio.
	- Impacto esperado: Tiempo, UX, CPU.
	- Evidencia: no hay uso de `next/dynamic`, `React.lazy` ni `Suspense` en la base revisada; el dashboard importa los gráficos de forma estática (`FunnelConversion`, `DonutIngresos`, `HeatmapOcupacion`, `TopProductos`) y el resto del panel carga muchos componentes cliente de forma directa. Eso no prueba por sí solo un bundle excesivo, pero sí muestra que el proyecto no está aplicando división diferida donde más podría ayudar.
	- Verificación: correr un build con análisis de chunks y comparar el peso del bundle de `/admin` antes y después de cargar los módulos de gráficos y formularios en lazy loading.
	- Solución: partir los gráficos y formularios de uso no inmediato con imports dinámicos; dejar el shell del panel y los KPIs como núcleo inicial; usar `Suspense` o placeholders para el contenido diferido.
	- Por qué mejora: baja el JS inicial, acorta hidratación y reduce trabajo de parseo/evaluación en el navegador.
	- Riesgos: aparecen estados de carga y hay que cuidar la percepción visual al dividir el contenido.
	- Complejidad: Media.
	- Estimación: Media a Alta.

4. Hipótesis: la pantalla de login carga assets más pesados de lo necesario para su función.
	- Severidad: Medio.
	- Impacto esperado: Red, Tiempo, UX.
	- Evidencia: `app/admin/login/page.jsx` monta seis imágenes a pantalla completa en el fondo y añade una hoja de estilos de Google Fonts dentro del render. Sin medir el peso de los archivos no puedo afirmar el costo exacto, pero sí que la página descarga y pinta varios assets inmediatos para una pantalla cuyo objetivo principal es autenticar.
	- Verificación: medir LCP y transferencia total de `/admin/login` y contrastarla con una versión que use imágenes optimizadas o menos capas visuales.
	- Solución: optimizar las imágenes del collage, servirlas con compresión adecuada, precargar solo lo necesario y evitar dependencias remotas si no aportan valor funcional.
	- Por qué mejora: reduce bytes iniciales y acelera el primer render útil de una ruta que debe abrir rápido.
	- Riesgos: cambiar la composición visual puede alterar el diseño; hay que preservar la identidad sin sobrecargar la ruta.
	- Complejidad: Baja a media.
	- Estimación: Media.

# Problemas Críticos

- El patrón más caro hoy es el mismo en más de una pantalla: leer muchos datos crudos desde Supabase y agregarlos en Node antes de renderizar. El caso de `dashboard/page.jsx` es especialmente costoso por volumen de consultas, duplicación de lecturas y agregación manual de matrices y rankings.

# Problemas Importantes

- La validación doble de sesión en `/admin` añade latencia en cada request protegido.
- El panel no muestra evidencia de lazy loading o división del bundle en las zonas que más pesan: dashboard, charts y formularios.
- El login usa una composición visual pesada para una pantalla de alto tránsito y baja complejidad funcional.

# Mejoras Recomendadas

- Consolidar primero las consultas del dashboard y reportes.
- Reducir luego la duplicación de auth entre middleware y layout.
- Separar por carga diferida los módulos que no son necesarios para el primer pintado del panel.
- Revisar el login para que su costo visual no supere su valor funcional.

# Quick Wins

- Reusar una sola lectura de sesión por request protegido, en vez de validar en middleware y otra vez en el layout.
- Quitar la hoja remota de Google Fonts del login si no es imprescindible, o al menos medir su aporte real al LCP.
- Cargar los gráficos del dashboard de forma diferida para que el shell y los KPIs aparezcan antes.

# Refactors Mayores

- Mover los agregados del dashboard y reportes a SQL, vistas o RPCs para que la base devuelva datos ya resumidos.
- Introducir vistas materializadas o tablas de resumen si los cálculos del dashboard se repiten muchas veces al día.
- Revisar la estrategia de composición del panel para que los módulos pesados no entren en el bundle inicial.

# Riesgos

- Cualquier optimización que mueva trabajo a SQL debe respetar RLS y revisar índices; de lo contrario, la ganancia de red puede perderse en la base.
- Las vistas materializadas pueden introducir frescura limitada de datos; eso es aceptable solo si el negocio tolera una leve demora.
- La división del bundle mejora TTI, pero añade estados de carga y complejidad de UI si se hace sin criterio.

# Prioridad de Implementación

1. Consolidar las consultas del dashboard y reportes en SQL/RPC/vistas con agregación previa. Es el mayor impacto y el costo de red/DB más alto.
2. Eliminar la validación duplicada de sesión entre middleware y layout. Es una ganancia rápida de latencia en toda la zona `/admin`.
3. Aplicar lazy loading al dashboard de analítica y a los formularios menos frecuentes. El beneficio es bueno y el esfuerzo sigue siendo moderado.
4. Ajustar el login para reducir el peso de imágenes y dependencias visuales inmediatas. Es un quick win con riesgo bajo.
5. Evaluar vistas materializadas o caches de resumen para métricas que se consultan muchas veces por hora. Esto da más valor cuando el volumen de datos crece.
