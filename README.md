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

## Struktur

```text
public/data/plan5f.manual-v0.json   # Första manuella mellanmodellen
schemas/plan-model.schema.json       # JSON-schema för planmodellen
src/                                 # Enkel review-vy
scripts/validate-plan.mjs            # Grundvalidering
docs/                                # Nedbrytning och regler
codex/tasks/                         # Uppgifter att ge Codex stegvis
```

## Arbetsprincip

All geometri ska byggas från ett rent mellanlager:

- `walls` = endast fasta väggar
- `doors` = öppningar/passager, inte väggar
- `equipment` = labbänkar, frysar, LAF, GX osv.
- `labels` = läst text, separat från geometri
- `unresolved` = allt som kräver mänsklig kontroll

## Nästa steg

Börja i `docs/FLOORPLAN_BREAKDOWN.md` och `codex/tasks/001-add-floorplan-background.md`.
