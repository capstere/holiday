# Plan 5F — första nedbrytning

Målet är att skapa en ren, verifierbar mellanmodell innan 3D-simulatorn byggs.

## Observerade lager i ritningen

1. Byggnadsstruktur: ytterväggar, innerväggar, korridorer.
2. Dörrar: dörrblad, svängbågar, öppningar, slussdörrar.
3. Säkerhet: `NÖD UT`, utrymningspilar, slussar.
4. Rumsdata: rumsnummer och rumsnamn.
5. Utrustning: lab benches, LAF, freezers, incubators, Infinity-instrument, GX, skåp.
6. Kontorsmöbler: skrivbord, stolar, bord, mötesrum.
7. Brus som inte får bli geometri: text, skalstreck, meterlinjaler, ritningsannotationer.

## Zoner

| Zon | Namn | Innehåll |
|---|---|---|
| Z1 | Övre vänster | CALIBRATION LAB, PIPETTE CLEAN STOR, SLUSS |
| Z2 | Övre mitten | Korridor, labbrum, lab benches, freezers, incubators |
| Z3 | Övre höger | X LAB, AIR LOCK, FI, FUME CHAMB, BSL3 |
| Z4 | Nedre vänster | DIGITAL-PCR, QC WIP, CM, GX, CMAL, PIPETTE STATIONS |
| Z5 | Nedre mitten | Kontor, möte, storage, server room, korridor |
| Z6 | Nedre höger | Kontor/open office |

## Viktigt för dörrtolkning

Dörrar syns som öppning + dörrblad + svängbåge. I 3D ska dessa bli `door objects`, inte väggar. Slussar ska modelleras som små sekvenser av rum med dörrar på båda sidor.

## Text som går att läsa i v0

- CALIBRATION LAB
- PIPETTE CLEAN STOR
- SLUSS
- DIGITAL-PCR
- QC WIP
- CM
- GX
- CMAL
- PIPETTE STATIONS
- STORAGE/PRINTER ROOM
- POST PCR
- MICROPLATE LAB
- SERVER ROOM
- X LAB
- AIR LOCK
- FUME CHAMB
- BSL3
- FI
- LAB BENCH
- LAF
- INFINITY 80
- INFINITY 48
- 4°C
- -80°C
- -20
- INCUBATOR
- SEAL TEST STATION
- CAL TROLLEY
- SHELVING
- SHOWER
- CUPBOARD/SKÅP
- NÖD UT

## V0-begränsningar

- Rums- och dörrkoordinater är ännu inte slutligt inmätta.
- Många rum har läsbara nummer men behöver zon-crop för säker transkribering.
- Dörrobjekt måste verifieras visuellt i varje zon.
- CAD-export/DXF vore bäst för exakt geometri. Om bara PDF finns får vi använda manuell annotering + bildsegmentering.
