# game_dev — Plan 5F Open World / First Person Simulator

Projektet är upplagt för att först **tömma planritningen** till en verifierbar mellanmodell och därefter bygga en realistisk first-person simulator ovanpå den.

Kärnidén:

1. Identifiera väggar, dörrar, rum, nödutgångar, text och utrustning separat.
2. Lagra allt i en JSON-modell med confidence-nivåer.
3. Låta Codex/utvecklare förbättra modellen zon för zon.
4. Generera 2D-review och därefter 3D-first-person-värld från modellen.

> Viktigt: PDF/ritningsbild ska inte commitas om repot är publikt. Lägg den lokalt i `public/source/` vid behov.

## Snabbstart

```bash
npm install
npm run validate:plan
npm run dev
```

## Lokal ritningsbild

För att se planritningen under overlayn, lägg en lokal bild här:

```bash
mkdir -p public/source
cp /path/to/rendered-plan5f.png public/source/plan5f.png
```

`public/source/*.png`, `*.jpg` och `*.pdf` ignoreras av git.

## Z4 annotation workflow

1. Kör appen med `npm run dev`.
2. Slå på **annotation mode**.
3. Dra room polygon-punkter och door endpoint-punkter.
4. Tryck **copy patch**.
5. Spara patchen lokalt, exempelvis:

```bash
mkdir -p local-patches
pbpaste > local-patches/z4.patch.json
```

6. Merge:a patchen tillbaka till planmodellen:

```bash
npm run apply:annotation-patch -- local-patches/z4.patch.json
npm run validate:plan
```

7. Kontrollera diffen och committa om den ser bra ut:

```bash
git diff public/data/plan5f.manual-v0.json
git add public/data/plan5f.manual-v0.json
git commit -m "Apply Z4 annotation patch"
```

## Struktur

```text
public/data/plan5f.manual-v0.json        # Mellanmodell
schemas/plan-model.schema.json            # JSON-schema för planmodellen
src/                                      # Review + annotation UI
scripts/validate-plan.mjs                 # Grundvalidering
scripts/apply-annotation-patch.mjs        # Merge av exporterad annotation patch
docs/                                     # Nedbrytning och regler
codex/tasks/                              # Uppgifter att ge Codex stegvis
```

## Arbetsprincip

All geometri ska byggas från ett rent mellanlager:

- `walls` = endast fasta väggar
- `doors` = öppningar/passager, inte väggar
- `equipment` = labbänkar, frysar, LAF, GX osv.
- `labels` = läst text, separat från geometri
- `unresolved` = allt som kräver mänsklig kontroll

## Nästa steg

Börja i `docs/FLOORPLAN_BREAKDOWN.md`, `docs/ZONE_BY_ZONE_REVIEW.md` och `codex/tasks/006-z4-annotation-mode.md`.
