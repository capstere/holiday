# Codex brief

## Projektmål

Bygg en first-person simulator av Plan 5F där spelaren kan gå runt i realistisk skala. Arbetet ska göras datadrivet från en extraherad planmodell.

## Icke-förhandlingsbara regler

- Text får aldrig automatiskt bli vägg.
- Dörrslag och svängbågar får aldrig automatiskt bli vägg.
- Utrustning får aldrig blandas ihop med byggnadsstruktur.
- Alla osäkra objekt ska ha confidence-markering.
- Varje PR ska vara liten och testbar.

## Datamodell

Källan är `public/data/plan5f.manual-v0.json`. Schema finns i `schemas/plan-model.schema.json`.

## Rekommenderade Codex-steg

1. Validera JSON-modellen och skapa bättre typning.
2. Lägg till bildbakgrund för planritningen i review-vyn.
3. Skapa annotation UI för rumspolygoner.
4. Skapa annotation UI för dörrportaler.
5. Exportera `walls`, `doors`, `walkable_areas` som metrisk geometri.
6. Bygg Three.js first-person prototyp från den exporterade geometrin.
7. Lägg till kollisionssystem.
8. Lägg till labbutrustning som props.
9. Lägg till etikett/debug-overlay.
10. Skapa verifieringsläge: top-down + first-person sida vid sida.

## Definition of done för första riktiga 3D-versionen

- Minst en zon kan traverseras i first person.
- Väggar och dörröppningar stämmer mot planritningen i top-down overlay.
- Spelaren kan inte gå igenom väggar.
- Dörrar är passager, inte hinder.
- Skala är låst mot meterskalan.
