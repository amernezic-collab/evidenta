# Evidenta

Interni radni prostor SCE Assurance za projekte usklađenosti. Katalozi: ISO/IEC 27001:2022, ISO 9001:2026,
NIS2 (Direktiva EU 2022/2555) i TISAX (VDA ISA 6, modul informacijske sigurnosti, poglavlja 1–7).
Pregled svih projekata, klijenti, gap analiza (poglavlja 4–10 i Aneks A), Izjava o primjenjivosti,
registar rizika s mapom rizika (6.1.2, 6.1.3), interni auditi i nalazi s korektivnim mjerama,
plan mjera, dokazi (R2, EU), pretraga, log aktivnosti, Word izvještaji (.docx) i izvoz u Excel (CSV).
Svijetla, tamna ili sistemska tema.

Katalozi sadrže samo oznake i vlastite kratke opise; tekst ISO standarda i VDA ISA kataloga nije kopiran
(`src/catalog.js`, `src/cat-more.js`). Oznake ISO 9001:2026 i VDA ISA provjeriti uz kupljeni standard, odnosno
zvanični ISA workbook; moduli TISAX za zaštitu prototipova i zaštitu podataka još nisu dodani.

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

## Migracije
Workers Builds ne pokreće migracije. Nova migracija se primijeni na produkcijsku bazu prije pusha
(Cloudflare D1 konzola ili `npx wrangler d1 migrations apply evidenta --remote`).
Primijenjeno: 0001_init.sql, 0002_risks_audits.sql, 0003_access_registers_reviews.sql.

## Word izvještaji
`src/docx.js` generiše .docx bez vanjskih biblioteka (gap analiza, SoA, registar rizika, plan mjera, izvještaj o auditu).

## Pristup
Cloudflare Access određuje ko se može prijaviti; Evidenta određuje šta ko vidi (`src/access.js`).
Uloge: administrator (sve), konsultant (samo dodijeljeni projekti), klijent (samo dodijeljeni projekti vlastite firme),
čeka odobrenje (ne vidi ništa). Nova osoba nakon prve prijave čeka da je administrator odobri u "Korisnici i pristup".
Ako nijedan administrator ne postoji, prva prijavljena osoba postaje administrator.

## Registri i izvještaji
`src/registers.js` definiše registre (dokumenti, imovina, dobavljači, incidenti, zakonski zahtjevi, ciljevi, obuke,
poboljšanja i drugi) i uz koje standarde idu. Excel (`src/xlsx.js`) i Word (`src/docx.js`) se generišu bez vanjskih biblioteka.
