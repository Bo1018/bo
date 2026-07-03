# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Buyfare" — a trading company website. A minimal Next.js 16 (App Router) project bootstrapped with `create-next-app`, currently a single landing page. Content includes Korean text.

## Commands

- `npm run dev` — start the dev server at http://localhost:3000
- `npm run build` — production build (also type-checks)
- `npm run start` — serve the production build
- `npm run lint` — run ESLint (flat config, `eslint-config-next` core-web-vitals + TypeScript rules)

There is no test framework configured.

## Architecture

- **Next.js App Router** — all routes live in `app/`. `app/layout.tsx` is the root layout (loads Geist/Geist Mono via `next/font`, sets site metadata); `app/page.tsx` is the home page. Add new routes as `app/<route>/page.tsx`.
- **Styling** — Tailwind CSS v4 via the `@tailwindcss/postcss` plugin. There is no `tailwind.config.*` file; theme tokens are defined in CSS in `app/globals.css` using `@theme inline`, with light/dark colors driven by CSS variables and `prefers-color-scheme`.
- **TypeScript** — strict mode enabled. Path alias `@/*` maps to the repository root.
- **Next config** — `next.config.ts` disables dev indicators; otherwise defaults.
