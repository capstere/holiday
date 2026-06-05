# Annotation guide

## Objektklasser

### wall
Bara fasta byggnadsväggar. Inga dörrbågar, inga textlinjer, inga möbler.

### door
Passage i vägg. Spara centrumlinje, bredd, riktning och angränsande rum. Dörrblad/svängbåge används bara som ledtråd.

### emergency_exit
Nödutgång kopplad till `NÖD UT`-text/pil. Ska ofta också vara en dörr/passageriktning.

### room
Polygon eller approximativ rektangel med namn, rumsnummer och kategori.

### equipment
Lab bench, LAF, freezer, incubator, instrument, cupboard, shower, shelving, skrivbord.

### label
All synlig text, inklusive rumsnummer och utrustningslabels.

## Koordinater

Använd först normaliserade bildkoordinater `[0..1]` för snabb annotering. När skala är verifierad konverteras allt till meter.

## Confidence

- `high`: tydligt läsbart/synligt
- `medium`: sannolikt men behöver kontroll
- `low`: gissning
- `unknown`: placeholder
