# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A rural real estate platform for Uruguay targeting the agricultural producer market. The competitive edge is **data depth**: typed, structured field data (CONEAT breakdown, real polygon over satellite, water sources, infrastructure) rather than free-text listings. The full specification lives in `documents/project-thesis.md`.

**The codebase does not yet exist.** `documents/project-thesis.md` is the authoritative product and architecture spec. Start there before writing any code.

## Planned stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) with SSR/ISR |
| Language | TypeScript strict |
| Database | PostgreSQL + PostGIS |
| ORM | Prisma or Drizzle (versioned migrations) |
| Search | Meilisearch or Typesense |
| Maps | MapLibre GL JS |
| Media storage | Cloudflare R2 or S3 |
| Job queue | BullMQ + Redis |
| Email | Resend or Postmark |
| CDN/WAF | Cloudflare (+ Turnstile for forms) |

## Architecture decisions that condition everything else

1. **The data model is the product.** Every attribute must be a typed field with unit — never free text. Free text means no filters, no comparator, no programmatic SEO, no portal export.

2. **Mobile-first on degraded connectivity.** The target user consults from a cell phone in the field, often on 3G/4G. Performance budget is a functional requirement: LCP < 2.5s, JS initial bundle < 150 KB compressed, total first load of a listing page < 1 MB (map excluded, loaded only on user interaction).

3. **Location is sensitive data.** `precision_ubicacion` has three modes — `exacta`, `aproximada`, `oculta`. **The real geometry must never be serialized to the client when the mode is not `exacta`.** This filtering happens server-side, not by hiding UI. For `aproximada`, the displayed center is randomly offset from the true centroid (the true centroid must not be sent either).

## Core data model

The central entity is `Campo` (field/property). Key relationships:

```
Campo (1) ──< (N) Padron          # catastral parcels that compose the field
Campo (1) ──< (N) Mejora          # buildings and infrastructure
Campo (1) ──< (N) FuenteAgua      # water sources
Campo (1) ──< (N) Media           # photos, drone footage, video
Campo (1) ──< (N) DesgloseConeat  # CONEAT breakdown by soil group
Campo (N) >── (1) Agente
Campo (1) ──< (N) Consulta        # leads
Campo (1) ──< (N) HistorialPrecio # price history audit log
```

Two fields on `Campo` are **always derived, never accepted from a form**:
- `coneat_promedio` — weighted average by area from `DesgloseConeat`
- `precio_usd_ha` — computed from `precio_venta_usd / superficie_ha`

A `Campo` cannot transition to `publicado` without: `superficie_ha`, `departamento`, at least one photo, `tipo_operacion`, `acceso_todo_tiempo`, and `energia`.

The geometry column is `GEOMETRY(MultiPolygon, 4326)` in PostGIS; always use GIST indexes on geometry and the derived centroid.

## Security constraints (non-negotiable from spec)

- **IDOR prevention**: authorization must be verified at the object level on every request, not just by hiding UI. An agent must not be able to edit another agent's field by changing the ID in the URL or request body.
- **EXIF stripping**: drone photos contain GPS coordinates. All uploaded images must be reprocessed (reencoded), stripping EXIF before storage. This is not optional — it would expose the exact location that the listing is deliberately hiding.
- **File upload validation**: validate by magic bytes, not by extension or `Content-Type`.
- **Public forms**: rate limiting by IP and session, Cloudflare Turnstile, honeypot field — required from day one, not added later.
- **Backoffice**: 2FA mandatory, CSP without `unsafe-inline` (use nonces), session cookies `HttpOnly; Secure; SameSite=Lax`.
- **Owner data**: the `propietario_contacto` fields are encrypted at rest; access is logged and role-restricted.

## Roles

| Role | Scope |
|---|---|
| Administrador | Everything, including user management |
| Gerente comercial | All fields, all leads, reports |
| Agente | Only their own fields and leads |
| Editor de contenido | Blog and reports; no access to fields or leads |
| Solo lectura | Read-only (audit, accounting) |

## SEO rules

- All indexable pages must render their primary content server-side (SSR/ISR). No page can depend on client-side JS for its main content.
- URL structure: `/campos/{departamento}/{aptitud}/{slug}-{referencia}`
- Filter combinations beyond defined programmatic pages get `noindex, follow` to avoid combinatorial URL explosion.
- Sold fields: `301` redirect to category (never `404`), or keep the listing with a "Vendido" banner to preserve inbound links.

## Domain glossary

| Term | Meaning |
|---|---|
| CONEAT | Soil productivity index. National average = 100. Expressed per soil group, weighted by area. |
| Padrón | Cadastral identifier. One `Campo` can span multiple padrones. |
| Dotación (UG/ha) | Livestock units per hectare the field can sustain. |
| Tajamar | Artificial water reservoir. |
| Potrero | Field subdivision delimited by fencing. |
| Pastoreo | Temporary grazing contract, distinct from arrendamiento (lease). |
| Casco | Main building complex of the establishment. |
| Balastro | Crushed-stone road surface; determines all-weather accessibility. |
