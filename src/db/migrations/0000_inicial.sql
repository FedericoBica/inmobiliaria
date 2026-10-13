CREATE TYPE "public"."rol" AS ENUM('administrador', 'gerente_comercial', 'agente', 'editor_contenido', 'solo_lectura');--> statement-breakpoint
CREATE TYPE "public"."acceso" AS ENUM('ruta_nacional', 'camino_departamental_balastro', 'camino_vecinal');--> statement-breakpoint
CREATE TYPE "public"."departamento" AS ENUM('artigas', 'canelones', 'cerro_largo', 'colonia', 'durazno', 'flores', 'florida', 'lavalleja', 'maldonado', 'montevideo', 'paysandu', 'rio_negro', 'rivera', 'rocha', 'salto', 'san_jose', 'soriano', 'tacuarembo', 'treinta_y_tres');--> statement-breakpoint
CREATE TYPE "public"."energia" AS ENUM('en_predio_trifasica', 'en_predio_monofasica', 'linea_a_menos_1km', 'sin_ute');--> statement-breakpoint
CREATE TYPE "public"."estado_ocupacion" AS ENUM('libre', 'arrendado', 'pastoreo', 'explotacion_propia');--> statement-breakpoint
CREATE TYPE "public"."estado_publicacion" AS ENUM('borrador', 'publicado', 'reservado', 'vendido', 'off_market');--> statement-breakpoint
CREATE TYPE "public"."precision_ubicacion" AS ENUM('exacta', 'aproximada', 'oculta');--> statement-breakpoint
CREATE TYPE "public"."estado_mejora" AS ENUM('nuevo', 'bueno', 'regular', 'a_reparar');--> statement-breakpoint
CREATE TYPE "public"."tipo_fuente_agua" AS ENUM('arroyo', 'canada', 'frente_rio', 'tajamar', 'represa', 'pozo_semisurgente', 'pozo_surgente', 'molino', 'bomba', 'bebedero');--> statement-breakpoint
CREATE TYPE "public"."tipo_media" AS ENUM('foto', 'foto_drone', 'video', 'video_drone', 'pdf');--> statement-breakpoint
CREATE TYPE "public"."tipo_mejora" AS ENUM('casco', 'casa_personal', 'galpon', 'silo', 'balanza', 'brete', 'corral', 'tubo', 'manga', 'banadera', 'sala_ordene', 'otro');--> statement-breakpoint
CREATE TYPE "public"."canal_consulta" AS ENUM('whatsapp', 'formulario', 'telefono', 'alerta', 'captacion_oferta');--> statement-breakpoint
CREATE TYPE "public"."estado_consulta" AS ENUM('nueva', 'contactado', 'en_negociacion', 'cerrado_ganado', 'cerrado_perdido', 'descartado');--> statement-breakpoint
CREATE TYPE "public"."tipo_contenido" AS ENUM('informe_mercado', 'articulo', 'guia');--> statement-breakpoint
CREATE TABLE "agentes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"apellido" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"rol" "rol" DEFAULT 'agente' NOT NULL,
	"telefono" varchar(30),
	"activo" boolean DEFAULT true NOT NULL,
	"totp_secret" text,
	"totp_enabled" boolean DEFAULT false NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agentes_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "campos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referencia_interna" varchar(20) NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"slug" varchar(300) NOT NULL,
	"departamento" "departamento" NOT NULL,
	"paraje" varchar(100),
	"seccion_judicial" varchar(50),
	"seccion_policial" varchar(50),
	"geometria" geometry(MultiPolygon, 4326),
	"centroide" geometry(Point, 4326),
	"precision_ubicacion" "precision_ubicacion" DEFAULT 'oculta' NOT NULL,
	"radio_aproximacion_m" integer,
	"centro_publico" geometry(Point, 4326),
	"superficie_ha" numeric(10, 2) NOT NULL,
	"coneat_promedio" numeric(6, 2),
	"pct_prioridad_forestal" numeric(5, 2),
	"ha_laborable" numeric(10, 2),
	"ha_campo_natural" numeric(10, 2),
	"ha_praderas" numeric(10, 2),
	"ha_monte_nativo" numeric(10, 2),
	"ha_forestado" numeric(10, 2),
	"aptitud" text[],
	"dotacion_historica_ug_ha" numeric(6, 2),
	"rendimientos_historicos" jsonb,
	"alambrado_perimetral_estado" varchar(20),
	"alambrado_divisorio_estado" varchar(20),
	"cantidad_potreros" integer,
	"km_alambrado" numeric(8, 2),
	"energia" "energia",
	"acceso" "acceso",
	"acceso_todo_tiempo" boolean,
	"km_a_ruta" numeric(6, 1),
	"km_a_centro_poblado" numeric(6, 1),
	"centro_poblado_referencia" varchar(100),
	"tiene_derecho_riego" boolean DEFAULT false,
	"padron_con_permiso_riego" varchar(50),
	"ha_bajo_riego" numeric(10, 2),
	"tipo_operacion" text[] NOT NULL,
	"precio_venta_usd" numeric(14, 2),
	"precio_usd_ha" numeric(12, 2),
	"renta_arrendamiento_usd_ha_anio" numeric(10, 2),
	"precio_pastoreo" numeric(10, 2),
	"unidad_pastoreo" varchar(50),
	"precio_a_consultar" boolean DEFAULT false,
	"estado_ocupacion" "estado_ocupacion",
	"fecha_vencimiento_contrato" timestamp,
	"estado_publicacion" "estado_publicacion" DEFAULT 'borrador' NOT NULL,
	"es_exclusiva" boolean DEFAULT false,
	"propietario_contacto" text,
	"estado_dominial" text,
	"observaciones_juridicas" text,
	"comision_pactada" numeric(5, 2),
	"notas_internas" text,
	"agente_id" uuid NOT NULL,
	"destacado" boolean DEFAULT false NOT NULL,
	"orden_manual" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	CONSTRAINT "campos_referencia_interna_unique" UNIQUE("referencia_interna"),
	CONSTRAINT "campos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "desglose_coneat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campo_id" uuid NOT NULL,
	"grupo_suelo" varchar(20) NOT NULL,
	"indice" numeric(6, 2) NOT NULL,
	"hectareas" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fuentes_agua" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campo_id" uuid NOT NULL,
	"tipo" "tipo_fuente_agua" NOT NULL,
	"cantidad" integer DEFAULT 1,
	"estado" "estado_mejora",
	"observaciones" text
);
--> statement-breakpoint
CREATE TABLE "historial_precios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campo_id" uuid NOT NULL,
	"precio_venta_usd" numeric(14, 2),
	"precio_usd_ha" numeric(12, 2),
	"renta_arrendamiento_usd_ha_anio" numeric(10, 2),
	"modificado_por" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campo_id" uuid NOT NULL,
	"tipo" "tipo_media" NOT NULL,
	"url" text NOT NULL,
	"url_thumb" text,
	"alt_text" varchar(255),
	"orden" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mejoras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campo_id" uuid NOT NULL,
	"tipo" "tipo_mejora" NOT NULL,
	"superficie_m2" numeric(8, 2),
	"estado" "estado_mejora",
	"descripcion" text,
	"antiguedad_anios" integer
);
--> statement-breakpoint
CREATE TABLE "padrones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campo_id" uuid NOT NULL,
	"numero_padron" varchar(30) NOT NULL,
	"departamento" varchar(50),
	"superficie_ha" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alertas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"telefono" varchar(30),
	"criterios" jsonb NOT NULL,
	"token_baja" varchar(64) NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_notified_at" timestamp,
	CONSTRAINT "alertas_token_baja_unique" UNIQUE("token_baja")
);
--> statement-breakpoint
CREATE TABLE "consultas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campo_id" uuid,
	"nombre" varchar(100) NOT NULL,
	"email" varchar(255),
	"telefono" varchar(30),
	"mensaje" text,
	"canal" "canal_consulta" NOT NULL,
	"estado" "estado_consulta" DEFAULT 'nueva' NOT NULL,
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(100),
	"referrer" text,
	"consentimiento_texto" text NOT NULL,
	"consentimiento_marketing" boolean DEFAULT false NOT NULL,
	"consentimiento_version" varchar(20) NOT NULL,
	"notas_internas" text,
	"crm_external_id" varchar(100),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contenidos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" "tipo_contenido" NOT NULL,
	"titulo" varchar(300) NOT NULL,
	"slug" varchar(350) NOT NULL,
	"extracto" text,
	"cuerpo" text NOT NULL,
	"imagen_destacada" text,
	"publicado" boolean DEFAULT false NOT NULL,
	"autor_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	CONSTRAINT "contenidos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "log_auditoria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_email" varchar(255),
	"tabla" varchar(100) NOT NULL,
	"registro_id" varchar(100) NOT NULL,
	"accion" varchar(20) NOT NULL,
	"valor_anterior" jsonb,
	"valor_nuevo" jsonb,
	"ip" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campos" ADD CONSTRAINT "campos_agente_id_agentes_id_fk" FOREIGN KEY ("agente_id") REFERENCES "public"."agentes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desglose_coneat" ADD CONSTRAINT "desglose_coneat_campo_id_campos_id_fk" FOREIGN KEY ("campo_id") REFERENCES "public"."campos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuentes_agua" ADD CONSTRAINT "fuentes_agua_campo_id_campos_id_fk" FOREIGN KEY ("campo_id") REFERENCES "public"."campos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historial_precios" ADD CONSTRAINT "historial_precios_campo_id_campos_id_fk" FOREIGN KEY ("campo_id") REFERENCES "public"."campos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_campo_id_campos_id_fk" FOREIGN KEY ("campo_id") REFERENCES "public"."campos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mejoras" ADD CONSTRAINT "mejoras_campo_id_campos_id_fk" FOREIGN KEY ("campo_id") REFERENCES "public"."campos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "padrones" ADD CONSTRAINT "padrones_campo_id_campos_id_fk" FOREIGN KEY ("campo_id") REFERENCES "public"."campos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_campo_id_campos_id_fk" FOREIGN KEY ("campo_id") REFERENCES "public"."campos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contenidos" ADD CONSTRAINT "contenidos_autor_id_agentes_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."agentes"("id") ON DELETE set null ON UPDATE no action;