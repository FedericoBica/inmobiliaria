# Plan de Plataforma Web — Inmobiliaria Rural (Uruguay)

**Alcance:** plataforma completa desde el inicio
**Público primario:** productor agropecuario uruguayo
**Público secundario:** inversor extranjero (fase posterior, previsto en la arquitectura)
**Versión del documento:** 1.0

---

## 1. Resumen ejecutivo

El objetivo es construir una plataforma de comercialización de campos que compita por **profundidad de datos**, no por volumen de avisos. Los portales generalistas (Gallito, InfoCasas, MercadoLibre) ganan en tráfico; se compite contra ellos ofreciendo lo que ellos estructuralmente no pueden dar: CONEAT desglosado, polígono real sobre satelital, capas de suelos, infraestructura hídrica detallada y ficha técnica descargable.

Tres decisiones de arquitectura condicionan todo el resto:

1. **El modelo de datos es el producto.** Todo atributo relevante debe ser un campo tipado con unidad, nunca texto libre. Un catálogo cargado como prosa es un catálogo sin filtros, sin comparador, sin SEO programático y sin exportación a portales.
2. **Mobile-first sobre conectividad degradada.** El productor uruguayo consulta desde el celular, muchas veces con 3G/4G inestable en el interior. El presupuesto de performance no es un detalle de pulido: es requisito funcional.
3. **La ubicación es dato sensible.** Buena parte de los propietarios no quiere publicidad de que su campo está en venta. La privacidad de ubicación debe ser configurable por ficha desde el día uno, no parcheada después.

---

## 2. Perfil de usuario y consecuencias de diseño

### 2.1 Productor uruguayo (primario)

| Característica | Consecuencia de diseño |
|---|---|
| Sabe leer CONEAT, aptitud y dotación sin explicación | Priorizar densidad de datos técnicos sobre contenido pedagógico |
| Consulta desde celular, en el campo, con señal pobre | Presupuesto estricto de peso de página; mapa con carga diferida; funcionamiento aceptable en 3G |
| Franja etaria media-alta | Tipografía base ≥17px, contraste alto, áreas táctiles ≥44px, sin gestos ocultos |
| WhatsApp es su canal por defecto | WhatsApp como CTA primario, por encima del formulario |
| Busca tanto arrendamiento y pastoreo como compra | Tipo de operación es filtro de primer nivel, no una casilla secundaria |
| Conoce campos por padrón y por paraje | Búsqueda por número de padrón y por nombre de paraje, no solo por departamento |
| Compara por USD/ha, no por precio total | USD/ha calculado y visible en listado, ficha y comparador; ordenamiento por defecto |

### 2.2 Inversor extranjero (secundario, fase 3)

Requiere capa explicativa (qué es CONEAT, marco legal de titularidad, régimen tributario), conversión de unidades, inglés y portugués. La arquitectura se prepara desde el inicio (i18n en el modelo de contenido, campos de unidad) pero el contenido traducido se produce en fase posterior.

---

## 3. Modelo de datos

### 3.1 Entidades principales

```
Campo (1) ──< (N) Padron
Campo (1) ──< (N) Mejora
Campo (1) ──< (N) FuenteAgua
Campo (1) ──< (N) Media
Campo (1) ──< (N) DesgloseConeat
Campo (N) >── (1) Agente
Campo (1) ──< (N) Consulta (lead)
Campo (1) ──< (N) HistorialPrecio
```

### 3.2 Entidad `Campo`

**Identificación**
- `id`, `referencia_interna` (código visible al público, ej. `CA-0142`)
- `titulo`, `slug`
- `departamento` (enum de los 19)
- `paraje` (texto)
- `seccion_judicial`, `seccion_policial`
- `geometria` — `GEOMETRY(MultiPolygon, 4326)` en PostGIS
- `centroide` — derivado, indexado con GIST
- `precision_ubicacion` — enum: `exacta` | `aproximada` | `oculta`
- `radio_aproximacion_m` — usado cuando `precision_ubicacion = aproximada`

**Superficie y suelo**
- `superficie_ha` (numeric, obligatorio)
- `coneat_promedio` (numeric) — ponderado por área, calculado, no ingresado a mano
- `desglose_coneat` → tabla hija: `grupo_suelo`, `indice`, `hectareas`
- `pct_prioridad_forestal`
- `ha_laborable`, `ha_campo_natural`, `ha_praderas`, `ha_monte_nativo`, `ha_forestado`
- `aptitud[]` — multi-select: `ganadera`, `agricola`, `agricola_ganadera`, `lechera`, `forestal`, `arrocera`, `hortifruticola`
- `dotacion_historica_ug_ha`
- `rendimientos_historicos` (JSONB: cultivo, zafra, rendimiento)

**Agua** (tabla hija `FuenteAgua`)
- `tipo` — `arroyo`, `cañada`, `frente_rio`, `tajamar`, `represa`, `pozo_semisurgente`, `pozo_surgente`, `molino`, `bomba`, `bebedero`
- `cantidad`, `estado`, `observaciones`
- En `Campo`: `tiene_derecho_riego` (bool), `padron_con_permiso_riego`, `ha_bajo_riego`

**Infraestructura** (tabla hija `Mejora`)
- `tipo` — `casco`, `casa_personal`, `galpon`, `silo`, `balanza`, `brete`, `corral`, `tubo`, `manga`, `bañadero`, `sala_ordeñe`, `otro`
- `superficie_m2`, `estado` (`nuevo`|`bueno`|`regular`|`a_reparar`), `descripcion`, `antiguedad_anios`

En `Campo`:
- `alambrado_perimetral_estado`, `alambrado_divisorio_estado`, `cantidad_potreros`, `km_alambrado`
- `energia` — `en_predio_trifasica` | `en_predio_monofasica` | `linea_a_menos_1km` | `sin_ute`
- `acceso` — `ruta_nacional` | `camino_departamental_balastro` | `camino_vecinal`
- `acceso_todo_tiempo` (bool) — **campo obligatorio, lo pregunta prácticamente todo interesado**
- `km_a_ruta`, `km_a_centro_poblado`, `centro_poblado_referencia`

**Comercial**
- `tipo_operacion[]` — `venta`, `arrendamiento`, `pastoreo`, `permuta`
- `precio_venta_usd`, `precio_usd_ha` (**derivado, nunca ingresado a mano**)
- `renta_arrendamiento_usd_ha_anio`, `precio_pastoreo`, `unidad_pastoreo`
- `precio_a_consultar` (bool)
- `estado_ocupacion` — `libre`, `arrendado`, `pastoreo`, `explotacion_propia`
- `fecha_vencimiento_contrato`
- `estado_publicacion` — `borrador`, `publicado`, `reservado`, `vendido`, `off_market`
- `es_exclusiva` (bool)

**Interno (no público, con control de acceso a nivel de campo)**
- `propietario_contacto` — datos personales, cifrados en reposo
- `estado_dominial`, `observaciones_juridicas`, `comision_pactada`
- `notas_internas`

**Metadatos**
- `agente_id`, `created_at`, `updated_at`, `published_at`, `destacado`, `orden_manual`

### 3.3 Reglas de integridad

- No se permite pasar a `publicado` sin: superficie, departamento, al menos una foto, tipo de operación, `acceso_todo_tiempo` y `energia` definidos.
- `coneat_promedio` y `precio_usd_ha` se calculan en base de datos (columnas generadas o triggers), nunca se aceptan del formulario.
- La suma de hectáreas del desglose de uso del suelo se valida contra `superficie_ha` con tolerancia configurable; discrepancia mayor genera advertencia bloqueante.
- Todo cambio de precio inserta fila en `HistorialPrecio` (auditoría y futuros informes de mercado).

---

## 4. Módulos del sitio público

### 4.1 Home
- Buscador prominente con los tres filtros que importan: departamento, tipo de operación, rango de hectáreas
- Accesos directos a búsquedas frecuentes por departamento
- Campos destacados (máximo 6, con USD/ha visible)
- Últimos ingresos
- Bloque "Vendé o arrendá tu campo" — captación de oferta, tan importante como la demanda
- Últimos informes de mercado

### 4.2 Listado / resultados
- Vista dual **lista ↔ mapa**, alternable; en mobile, lista por defecto con botón a mapa
- Tarjeta: foto, referencia, departamento y paraje, superficie, CONEAT, USD/ha destacado, precio total, tipo de operación, aptitud
- Filtros persistidos en URL, con estructura amigable para SEO
- Ordenamiento: USD/ha, superficie, CONEAT, más reciente, precio total
- Paginación indexable (no scroll infinito sin fallback)
- Contador de resultados y chips de filtros activos removibles

### 4.3 Ficha de campo

Orden de bloques pensado para el productor:

1. **Encabezado** — referencia, departamento/paraje, superficie, CONEAT, USD/ha, precio, tipo de operación, estado
2. **Galería** — fotos, aéreas de dron, video; carga progresiva
3. **Datos productivos** — desglose CONEAT en tabla, uso del suelo, aptitud, dotación
4. **Agua** — listado de fuentes con cantidad y estado
5. **Mejoras** — tabla por tipo
6. **Accesos y servicios** — distancias, caminería, energía
7. **Mapa** — polígono sobre satelital, con capas activables
8. **Ficha técnica PDF** — descarga generada del mismo dato
9. **CTA fija** — WhatsApp + formulario, siempre visible en mobile
10. **Campos similares** — mismo departamento o rango de superficie

### 4.4 Comparador
Hasta 4 campos lado a lado, con resaltado de diferencias y exportación a PDF.

### 4.5 Búsquedas guardadas y alertas
Registro con email o teléfono. Notificación por email y opcionalmente WhatsApp cuando ingresa un campo que matchea. Cada alerta con enlace de baja de un clic (requisito legal y de reputación de envío).

### 4.6 Contenido editorial
- Informes de precios por departamento y por aptitud, con periodicidad definida
- Artículos técnicos y de mercado
- Guías: régimen tributario de la operación, arrendamiento vs. compra, cómo se lee CONEAT
- Este módulo es el motor de tráfico orgánico durante los meses sin intención de compra

### 4.7 Institucional
Quiénes somos, equipo con matrículas y trayectoria, operaciones concretadas, contacto, política de privacidad, términos y condiciones, política de cookies.

---

## 5. Buscador

- Motor dedicado (Meilisearch o Typesense) sincronizado desde Postgres vía cola de trabajos
- Búsqueda por texto con tolerancia a errores tipográficos en departamento y paraje
- **Búsqueda por número de padrón** — resuelve directo a la ficha
- Facetas: departamento, aptitud, tipo de operación, rangos de superficie, rangos de USD/ha, CONEAT mínimo, agua, energía, acceso todo tiempo, estado de ocupación
- Búsqueda geoespacial: radio desde un punto, o polígono dibujado por el usuario (query PostGIS `ST_Intersects`)
- Sinónimos configurados con vocabulario local (tajamar/represa, brete/manga, casco/casa principal)

---

## 6. Capa geoespacial

- **Motor:** PostGIS. Índices GIST sobre geometría y centroide.
- **Cliente:** MapLibre GL JS con estilos propios; fallback a imagen estática del polígono si el dispositivo o la conexión no soportan WebGL (relevante para el público objetivo).
- **Capas base:** satelital, relieve, callejero.
- **Capas temáticas:** CONEAT, suelos de prioridad forestal, hidrografía, red vial. Se consumen de servicios WMS/WFS públicos (IDE Uruguay, Catastro, MGAP). **Verificar términos de uso de cada servicio antes de producción** y cachear del lado del servidor con TTL para no depender de su disponibilidad.
- **Herramientas del usuario:** medición de distancia y área, dibujo de polígono para búsqueda, alternancia de capas, pantalla completa.
- **Privacidad de ubicación:**
  - `exacta` — polígono real visible
  - `aproximada` — solo círculo de radio configurable, centrado en un punto **desplazado aleatoriamente** respecto al centroide real (no el centroide exacto, que sería trivial de revertir)
  - `oculta` — solo departamento
  - La geometría real nunca se serializa al cliente cuando el modo no es `exacta`. El filtrado ocurre en el servidor, no en el front.

---

## 7. Leads y CRM

### 7.1 Canales de entrada
- WhatsApp con mensaje precargado incluyendo la referencia del campo (canal primario)
- Formulario de consulta por ficha
- Formulario "Vendé o arrendá tu campo" (captación de oferta)
- Suscripción a alertas
- Llamada telefónica con número clickeable

### 7.2 Tratamiento
- Todo lead persiste en base propia con: campo consultado, canal, UTM completa, referrer, timestamp, y consentimiento registrado
- Envío a CRM (Pipedrive o HubSpot) vía cola con reintentos — **la falla del CRM nunca debe perder el lead**
- Asignación automática al agente responsable del campo, con regla de escalamiento por tiempo sin respuesta
- Notificación inmediata al agente por email y WhatsApp
- Registro de descargas de ficha técnica asociado al lead

### 7.3 Datos de comportamiento (uso interno)
Campos más vistos, filtros más usados, búsquedas sin resultados (señal directa de qué captar), tasa de contacto por campo. Alimenta tanto la estrategia comercial como los informes de mercado.

---

## 8. Backoffice

### 8.1 Gestión de campos
- Formulario por secciones con guardado de borrador automático
- Validaciones bloqueantes antes de publicar (ver 3.3)
- Editor de polígono sobre mapa: dibujo manual, importación de KML/KMZ/Shapefile/GeoJSON
- Carga masiva de imágenes con reordenamiento, optimización automática, generación de variantes responsive, marca de agua y **eliminación de metadatos EXIF**
- Vista previa antes de publicar
- Duplicar campo (útil para fraccionamientos)

### 8.2 Roles y permisos
| Rol | Alcance |
|---|---|
| Administrador | Todo, incluida gestión de usuarios y configuración |
| Gerente comercial | Todos los campos, todos los leads, reportes |
| Agente | Solo sus campos y sus leads |
| Editor de contenido | Blog e informes; sin acceso a campos ni leads |
| Solo lectura | Consulta, sin edición (auditoría, contadores) |

Autorización verificada **a nivel de objeto en cada request**, no solo por ocultamiento de UI.

### 8.3 Otros módulos
- Gestión de leads con estados y notas
- Editor de contenido editorial
- Configuración de home y destacados
- Dashboard: ingresos del mes, leads por campo, campos sin actividad, tiempo promedio de respuesta
- **Log de auditoría inmutable**: quién cambió qué, cuándo, valor anterior y nuevo — especialmente precios y estado de publicación
- Módulo de debida diligencia de clientes (ver sección 11.2)

### 8.4 Distribución a portales
Feed XML/JSON generado automáticamente para InfoCasas, Gallito y MercadoLibre, con mapeo de campos y control de qué se publica en cada uno. Objetivo: carga única. Cada portal tiene su especificación propia; presupuestar el mapeo como tarea no trivial.

---

## 9. SEO y contenido

- **Renderizado en servidor** (SSR/ISR). Ninguna página indexable puede depender de JavaScript del cliente para su contenido principal.
- **URLs**: `/campos/{departamento}/{aptitud}/{slug}-{referencia}`
- **Páginas programáticas**: departamento × aptitud × rango de superficie, con contenido introductorio único por combinación (no plantilla vacía repetida, que Google penaliza como thin content)
- **Datos estructurados**: `RealEstateListing`, `Organization`, `BreadcrumbList`, `Article` para el blog
- **Canonical**: las combinaciones de filtros más allá de las páginas programáticas definidas llevan `noindex, follow` para evitar explosión combinatoria de URLs
- **Sitemaps** segmentados (campos, contenido, páginas de categoría) con `lastmod` real
- **Campos vendidos**: `301` a la categoría correspondiente, nunca `404`. Alternativa superior: mantener la ficha con banner "Vendido" — genera prueba social y conserva el enlace entrante.
- Estructura i18n preparada (`hreflang`, rutas con prefijo de idioma) aunque el contenido traducido llegue en fase 3

---

## 10. Performance y accesibilidad

**Presupuesto de performance (medido en 4G lento, dispositivo de gama media):**
- LCP < 2.5s
- INP < 200ms
- CLS < 0.1
- JavaScript inicial < 150KB comprimido
- Peso total de la ficha en primera carga < 1MB, mapa excluido (carga diferida bajo interacción)

**Medidas:**
- Imágenes en AVIF con fallback WebP, `srcset` completo, dimensiones explícitas
- Mapa cargado solo bajo interacción explícita del usuario
- CDN con caché agresiva de estáticos
- ISR para fichas y listados, con revalidación al publicar
- Monitoreo continuo de Core Web Vitals con datos de campo, no solo de laboratorio

**Accesibilidad (WCAG 2.1 AA):**
Contraste mínimo 4.5:1, navegación completa por teclado, etiquetas asociadas en todos los campos de formulario, textos alternativos en imágenes, foco visible, tipografía base ≥17px. Dado el perfil etario del público, esto tiene retorno comercial directo.

---

## 11. Seguridad

### 11.1 Controles técnicos

**Transporte y cabeceras**
- HTTPS obligatorio, HSTS con `preload`
- Content-Security-Policy estricta (sin `unsafe-inline`; usar nonces)
- `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`

**Autenticación y sesión**
- 2FA obligatorio para todo acceso al backoffice
- Política de contraseñas con verificación contra listas de credenciales filtradas
- Cookies de sesión `HttpOnly`, `Secure`, `SameSite=Lax`
- Expiración por inactividad y rotación de identificador de sesión al iniciar sesión
- Bloqueo progresivo tras intentos fallidos

**Autorización**
- Verificación a nivel de objeto en cada endpoint. **IDOR es la vulnerabilidad más frecuente en este tipo de sistema**: un agente no debe poder editar el campo de otro cambiando el identificador en la URL o en el cuerpo de la petición.
- Endpoints administrativos segregados por ruta y protegidos también a nivel de infraestructura

**Entrada y salida**
- Validación de esquema en el servidor para todo input (Zod o equivalente), nunca confiando en validación del cliente
- Consultas parametrizadas / ORM; prohibida la concatenación de SQL
- Escapado contextual en salida
- Protección CSRF en todas las operaciones que modifican estado

**Carga de archivos**
- Validación de tipo real por magic bytes, no por extensión ni por `Content-Type`
- Límite de tamaño y cantidad
- Reprocesamiento de la imagen (recodificación) que además elimina cualquier payload embebido
- **Eliminación de EXIF** — las fotos de dron incluyen coordenadas GPS que revelarían la ubicación exacta que la ficha oculta deliberadamente
- Almacenamiento fuera del árbol web, servido por CDN con URLs no adivinables
- Antivirus sobre documentos subidos

**Formularios públicos**
- Rate limiting por IP y por sesión
- Cloudflare Turnstile o hCaptcha
- Campo honeypot
- Los formularios de inmobiliaria son objetivo constante de spam automatizado; sin estas medidas el CRM se vuelve inutilizable en semanas

**Infraestructura**
- WAF (Cloudflare) delante de la aplicación
- Secretos en gestor dedicado, nunca en el repositorio ni en el bundle del cliente
- Principio de mínimo privilegio en credenciales de base de datos y almacenamiento
- Backups automáticos diarios con retención escalonada y **restauración probada periódicamente** — un backup no verificado no es un backup
- Cifrado en reposo de datos personales de propietarios
- Logs centralizados sin datos personales en claro

**Ciclo de desarrollo**
- Escaneo de dependencias en CI (Dependabot + auditoría)
- Análisis estático y detección de secretos en pre-commit
- Revisión de código obligatoria
- Checklist OWASP Top 10 como criterio de aceptación en QA
- Test de penetración externo antes del lanzamiento y anual

### 11.2 Consideración específica del rubro

La información de ubicación exacta y los datos de contacto de propietarios constituyen el activo más sensible del negocio. Un incidente que exponga qué campos están en venta antes de tiempo daña la relación con los propietarios de forma irreversible. Se recomienda tratar la tabla de propietarios con controles reforzados: cifrado a nivel de columna, acceso registrado y limitado por rol.

---

## 12. Cumplimiento normativo

> Las referencias siguientes son áreas a verificar con escribano y asesor legal antes del lanzamiento. No constituyen asesoramiento jurídico.

### 12.1 Protección de datos personales — Ley 18.331 (URCDP)
- Corresponde evaluar la inscripción de la base de datos ante la Unidad Reguladora y de Control de Datos Personales
- Política de privacidad accesible, en lenguaje claro, indicando finalidad, plazo de conservación y destinatarios
- Consentimiento explícito y granular en cada formulario (contacto ≠ marketing)
- Mecanismo operativo para ejercer derechos de acceso, rectificación y supresión
- Registro de consentimientos con timestamp y versión del texto aceptado
- Acuerdos de tratamiento de datos con proveedores (hosting, CRM, email)
- Si más adelante se capta público europeo, sumar cumplimiento GDPR (base legal, consentimiento previo de cookies, transferencias internacionales)

### 12.2 Prevención de lavado de activos — Ley 19.574
Las inmobiliarias son sujetos obligados ante SENACLAFT. Implicancias de producto:
- El backoffice debe contemplar el registro de debida diligencia del cliente como parte del flujo de operación, no como planilla externa
- Almacenamiento seguro de documentación de identificación
- Registro de operaciones con trazabilidad
- Verificar obligaciones de designación de oficial de cumplimiento y de reporte según el volumen de operación

### 12.3 Régimen aplicable a inmuebles rurales
- Ley 18.092 y normas complementarias sobre titularidad de inmuebles rurales según tipo societario — relevante para el contenido informativo del sitio y para el proceso comercial
- Régimen tributario de la transmisión (ITP, IRPF/IRAE según el caso)
- Ley 19.210 de inclusión financiera respecto de medios de pago en operaciones inmobiliarias
- Normativa de riego (DINAGUA) cuando se publiciten derechos de riego — verificar que lo publicado corresponda a permisos vigentes

### 12.4 Publicidad y responsabilidad sobre datos publicados
Incluir descargo de responsabilidad sobre la información técnica publicada (superficies, CONEAT, mejoras), indicando que proviene de fuentes de terceros y del propietario y que corresponde verificación por parte del interesado. Conservar la trazabilidad de la fuente de cada dato publicado.

---

## 13. Arquitectura técnica

### 13.1 Stack recomendado

| Capa | Elección | Justificación |
|---|---|---|
| Framework | Next.js (App Router) | SSR/ISR resuelve SEO y performance; ecosistema maduro |
| Lenguaje | TypeScript estricto | El modelo de datos es complejo; el tipado previene la clase de errores más costosa |
| Base de datos | PostgreSQL + PostGIS | Geoespacial nativo, no negociable |
| ORM | Prisma o Drizzle | Migraciones versionadas |
| CMS / admin | Payload CMS | Autohospedado, sobre Postgres, extensible, sin dependencia de servicio externo para el dato principal |
| Buscador | Meilisearch o Typesense | Facetas y tolerancia tipográfica |
| Mapas | MapLibre GL JS | Sin dependencia de licencia propietaria |
| Almacenamiento | Cloudflare R2 o S3 | Sin costo de egreso en R2 |
| Colas | BullMQ + Redis | Sincronización de buscador, envío a CRM, generación de PDF |
| Email | Resend o Postmark | Entregabilidad transaccional |
| CDN / WAF | Cloudflare | Caché, protección, Turnstile |
| Errores | Sentry | |
| Analítica | GA4 con consent mode, o Plausible | Plausible reduce fricción de cookies |
| Métricas internas | Metabase sobre réplica de lectura | |

### 13.2 Diagrama lógico

```
                    ┌──────────────┐
   Usuario ───────► │  Cloudflare  │  (CDN + WAF + Turnstile)
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Next.js    │  SSR / ISR / API Routes
                    └──┬────┬───┬──┘
                       │    │   │
        ┌──────────────┘    │   └───────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼───────┐  ┌────────▼────────┐
│ PostgreSQL     │  │ Meilisearch   │  │ Cloudflare R2   │
│ + PostGIS      │  │ (índice)      │  │ (media)         │
└───────┬────────┘  └───────▲───────┘  └─────────────────┘
        │                   │
        │           ┌───────┴───────┐
        └──────────►│ Worker/BullMQ │──► CRM, Email, PDF, Feeds portales
                    └───────────────┘
                            ▲
                    ┌───────┴───────┐
                    │ WMS/WFS       │  (IDE, Catastro, MGAP) — con caché
                    └───────────────┘
```

### 13.3 Entornos y despliegue
- Tres entornos: desarrollo, staging (con datos anonimizados), producción
- CI/CD con tests automatizados, linting, escaneo de dependencias y build antes de cada despliegue
- Migraciones de base versionadas y reversibles
- Despliegue con rollback inmediato
- Monitoreo de disponibilidad con alertas

### 13.4 Testing
- Unitarios sobre lógica de cálculo (CONEAT ponderado, USD/ha, conversiones)
- Integración sobre endpoints de API, incluyendo casos de autorización negativa
- End-to-end sobre los flujos críticos: búsqueda → ficha → consulta; alta y publicación de campo
- Pruebas de regresión visual en la ficha
- Pruebas de carga sobre el buscador y el endpoint geoespacial

---

## 14. Plan de entrega

Plataforma completa, entregada en cuatro hitos para permitir salida a producción temprana sin recortar alcance final.

### Hito 1 — Núcleo (semanas 1-8)
Modelo de datos completo y migraciones · Backoffice de campos con validaciones · Editor de polígono e importación KML · Listado con filtros y facetas · Ficha completa · Mapa con satelital y polígono · Búsqueda por padrón · WhatsApp y formularios · Roles y permisos · Seguridad base completa · SEO técnico · Institucional y legales

**Salida a producción al cierre de este hito.**

### Hito 2 — Profundidad (semanas 9-14)
Capas CONEAT, prioridad forestal e hidrografía · Búsqueda por dibujo en mapa · Comparador · Generación de ficha técnica PDF · Búsquedas guardadas y alertas · Blog e informes de mercado · Módulo editorial · Dashboard de backoffice · Log de auditoría

### Hito 3 — Integración y escala (semanas 15-20)
Integración con CRM · Feeds automáticos a portales · Módulo de debida diligencia · Métricas internas con Metabase · Estimador de valor para captación de oferta · Optimización de performance sobre datos reales de campo

### Hito 4 — Expansión (semanas 21+)
Inglés y portugués · Conversión de unidades · Contenido explicativo para inversor extranjero · Recorridos 360 · Automatizaciones de marketing

### Trabajo transversal
Auditoría de seguridad externa antes del Hito 1 en producción · Carga y curación del catálogo inicial (subestimarla es el error más común: presupuestar tiempo real del equipo comercial) · Definición de la línea gráfica · Capacitación del equipo en el backoffice

---

## 15. Métricas de éxito

**Producto**
- Leads calificados por mes y por campo publicado
- Tasa de contacto (visitas a ficha → consulta)
- Descargas de ficha técnica
- Tiempo de respuesta promedio del agente
- Búsquedas sin resultados (señal de captación)

**Técnicas**
- Core Web Vitals en verde en datos de campo, no de laboratorio
- Disponibilidad ≥ 99.9%
- Tasa de error < 0.1%
- Cero incidentes de exposición de datos

**Negocio**
- Tráfico orgánico y posiciones en búsquedas de intención local
- Campos captados con origen atribuible al sitio
- Costo por lead comparado con los portales

---

## 16. Riesgos y mitigación

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Catálogo cargado con datos incompletos | Alto — inutiliza filtros y comparador | Validaciones bloqueantes; capacitación; responsable de calidad de datos |
| Servicios WMS externos caídos o con cambio de términos | Medio | Caché propia con TTL largo; degradación elegante a capa base |
| Spam masivo en formularios | Medio | Turnstile, rate limiting, honeypot desde el hito 1 |
| Filtración de ubicaciones sensibles | **Alto** | Filtrado en servidor, stripping de EXIF, revisión específica en auditoría |
| Explosión de URLs indexables por filtros | Medio | Estrategia de canonical y noindex definida antes de publicar |
| Especificaciones de portales cambiantes | Bajo-medio | Capa de mapeo desacoplada, con tests de contrato |
| Adopción baja del backoffice por el equipo | Alto | Involucrar a agentes en el diseño del formulario; capacitación; simplificar la carga |

---

## 17. Checklist previo al lanzamiento

**Seguridad**
- [ ] Auditoría externa realizada y hallazgos críticos resueltos
- [ ] 2FA activo en todas las cuentas administrativas
- [ ] CSP en modo enforcement, sin errores en consola
- [ ] Rate limiting verificado en todos los formularios
- [ ] Restauración de backup ejecutada con éxito en staging
- [ ] Verificado que ninguna respuesta de API filtre geometría exacta de campos con ubicación restringida
- [ ] Verificado que las imágenes servidas no contienen EXIF
- [ ] Probado acceso cruzado entre agentes (verificación de IDOR)

**Legal**
- [ ] Política de privacidad, términos y política de cookies publicados y revisados
- [ ] Inscripción ante URCDP evaluada y gestionada si corresponde
- [ ] Consentimientos granulares implementados y registrados
- [ ] Descargo sobre información técnica publicado
- [ ] Flujo de debida diligencia definido con el equipo comercial

**Producto**
- [ ] Mínimo de campos cargados con ficha completa definido y alcanzado
- [ ] Ficha técnica PDF revisada por el equipo comercial
- [ ] Probado en dispositivos de gama media con conexión limitada
- [ ] Redirecciones desde el sitio anterior mapeadas
- [ ] Analítica y objetivos de conversión configurados y verificados
- [ ] Equipo capacitado en el backoffice

---

## 18. Glosario para el equipo técnico

| Término | Significado |
|---|---|
| **CONEAT** | Índice de productividad del suelo. Promedio nacional = 100. Determina buena parte del valor. Se expresa por grupo de suelo y se pondera por superficie. |
| **Padrón** | Identificador catastral del inmueble. Un campo puede componerse de varios. |
| **Aptitud** | Uso productivo predominante del suelo. |
| **Dotación (UG/ha)** | Unidades ganaderas por hectárea que el campo sostiene. |
| **Tajamar** | Reservorio de agua artificial. |
| **Potrero** | Subdivisión del campo delimitada por alambrado. |
| **Brete / manga / tubo** | Instalaciones de manejo de ganado. |
| **Casco** | Conjunto edilicio principal del establecimiento. |
| **Campo natural** | Pastura nativa sin implantar. |
| **Pastoreo** | Contrato de uso temporal para alimentación de ganado, distinto del arrendamiento. |
| **Balastro** | Material de la caminería rural; determina transitabilidad con lluvia. |