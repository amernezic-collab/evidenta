# Evidenta

Interni radni prostor SCE Assurance za ISO projekte (prva verzija: ISO/IEC 27001:2022).
Klijenti, projekti, gap analiza (poglavlja 4–10 i Aneks A), Izjava o primjenjivosti,
plan mjera, dokazi (R2, EU), log aktivnosti i izvoz u Excel (CSV).

Katalog sadrži samo oznake i vlastite kratke opise; tekst ISO standarda nije kopiran.

## Arhitektura
- Cloudflare Worker (`src/worker.js`) + statički UI (`public/`)
- D1 baza `evidenta` (WEUR), shema u `migrations/`
- R2 bucket `evidenta-files`, jurisdikcija EU
- Prijava: Cloudflare Access; Worker dodatno provjerava Access JWT (ACCESS_TEAM_DOMAIN, ACCESS_AUD)

## Lokalno
    npm install
    npx wrangler d1 migrations apply evidenta --local
    echo 'DEV_USER="ime@sceassurance.com"' > .dev.vars
    npx wrangler dev --local

## Produkcija
1. R2: bucket `evidenta-files`, lokacija "Specify jurisdiction → European Union".
2. Workers & Pages → Create → Import a repository → `evidenta` (build: prazno, deploy: `npx wrangler deploy`).
3. Custom domain: `app.evidenta.io`; workers.dev i Preview URLs isključiti.
4. Zero Trust → Access → aplikacija za `app.evidenta.io`, policy samo za tim.
5. U Workeru dodati varijablu `ACCESS_AUD` = Application Audience (AUD) tag Access aplikacije.
