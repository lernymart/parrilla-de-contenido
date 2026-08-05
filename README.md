# Parrilla de contenido — LernyMart

Herramienta interna para que el equipo de marketing genere una parrilla de contenido con ayuda de IA (incluye investigación de competencia) y la **descargue** en CSV o Excel.

Las parrillas **no se guardan** en ningún servidor. Si cierras o recargas la página sin descargar, se pierden.

---

## Qué necesitas antes de empezar

Pídele al equipo técnico estas claves y pégalas en un archivo `.env.local` (usa `.env.example` como guía):

| Variable | Dónde se obtiene |
|----------|------------------|
| `OPENROUTER_API_KEY` | [OpenRouter](https://openrouter.ai/) → Keys |
| `SERPAPI_API_KEY` | Misma credencial SerpAPI que usan otras automatizaciones internas |

Modelo de IA configurado: `openai/gpt-4o-mini` (en `config/brand-context.ts`).

No hace falta Supabase ni cuentas extra.

---

## Instalar y correr en local

1. Abre una terminal en la carpeta del proyecto.
2. Instala dependencias:

```bash
npm install
```

3. Crea `.env.local` a partir de `.env.example` y completa las dos claves.
4. Arranca la app:

```bash
npm run dev
```

5. Abre [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Cómo usarla (para marketing)

1. Elige el rango de fechas.
2. Si tienes un foco del mes, escríbelo en “Objetivo del mes”.
3. Ajusta los porcentajes de tipo de producción (deben sumar 100%).
4. Marca formatos y redes.
5. Revisa los competidores a analizar (siempre se investigan antes de generar).
6. Deja que la IA proponga pilares, o escribe los tuyos.
7. Pulsa **Generar parrilla de contenido** y espera 1–2 minutos.
8. Revisa y edita la tabla si hace falta.
9. **Descarga CSV o Excel** antes de salir. Verás un aviso recordándolo.
10. Si quieres otra parrilla, usa **Crear otra parrilla**.

---

## Editar el contexto de marca

Si cambia el manual de marca o la descripción del negocio, edita solo:

`config/brand-context.ts`

---

## Estructura rápida (para el equipo técnico)

- `src/app/api/generate` — pipeline: SerpAPI → resumen LLM → pilares → parrilla → resumen
- `src/app/api/regenerate-row` — regenera una fila (sin base de datos)
- `src/lib/pipeline.ts` — pasos encadenados de generación
- `src/lib/serpapi.ts` / `src/lib/openrouter.ts` — integraciones

---

## Deploy (sugerido)

Sube el repo a Vercel (u otro host Node) y configura `OPENROUTER_API_KEY` y `SERPAPI_API_KEY` en las variables de entorno.
