# Plan 5F — zon-för-zon review v1

Detta dokument är en manuell läsning av planritningen, avsedd som underlag för Codex och framtida annotering. Syftet är inte att låtsas att allt är färdigt inmätt, utan att dela upp ritningen i hanterbara zoner med tydliga objektklasser.

## Gemensam regel för alla zoner

- Väggar = bara fast byggnadsstruktur.
- Dörrblad och svängbågar = dörrledtrådar, inte väggar.
- Text = label-data, inte geometri.
- Labbutrustning och möbler = props/colliders, inte byggnadsstruktur.
- `NÖD UT` = säkerhets-/utrymningslabel och ofta kopplad till dörr/utgång.

---

## Z1 — övre vänster: Calibration / Pipette / tidiga labbrum

### Säkert läsbara labels

- CALIBRATION LAB
- PIPETTE
- CLEAN STOR
- SLUSS
- 5.533
- 5.544
- 5.545
- 5.540
- 5.538
- 5.537
- 5.534
- 5.573
- 5.572
- 5.575
- 5.576
- INFINITY 48
- INFINITY 1 / 3 / 5 / 6
- SKOGRÄNS
- LAF
- -80°C

### Rum/ytor

| ID-kandidat | Namn/etikett | Typ | Confidence |
|---|---|---|---|
| R-CALIBRATION-LAB | CALIBRATION LAB | lab | high |
| R-PIPETTE | PIPETTE | lab/beredning | high |
| R-PIPETTE-CLEAN-STOR | CLEAN STOR | storage | high |
| R-SLUSS-5533 | SLUSS 5.533 | airlock/sluss | high |
| R-5544 | 5.544 | lab/instrumentrum | medium |
| R-5545 | 5.545 | större rum | medium |
| R-5540 | 5.540 | labb med bänkar/frysar | medium |
| R-5538 | 5.538 | labb med bänkar/frysar | medium |
| R-5575 | 5.575 | instrumentrum | medium |
| R-5573/R-5572 | 5.573 och 5.572 | små rum | medium |

### Dörrar/passager som syns

- Dörr mellan CALIBRATION LAB och PIPETTE/CLEAN STOR-zonen. Svängbåge syns tydligt.
- Dörr från CLEAN STOR mot SLUSS 5.533.
- Dörr/passager från SLUSS mot 5.544/5.545-området.
- Dörrar från 5.545 och 5.539 mot korridor/angränsande rum.
- Flera dörrar i nedre del mot 5.534, 5.537, 5.573, 5.572 och korridor.

### Utrustning/props

- Frysar/kyl: -80°C, 4°C-liknande små etiketter.
- LAF-bänkar.
- Infinity-instrument.
- Lab benches och skåp/arbetsytor.

### Att göra för Codex/manuell annotering

1. Börja med att rita rena rumsgränser för CALIBRATION LAB, PIPETTE, CLEAN STOR och SLUSS.
2. Markera alla dörrar runt SLUSS 5.533 som separata door objects.
3. Ignorera alla små etiketter vid frysar i väggmasken.
4. Verifiera om 5.544 är ett instrumentrum eller labbrum innan kategori låses.

---

## Z2 — övre mitten: huvudkorridor 5.400, X LAB och labbkluster

### Säkert läsbara labels

- 5.600
- NÖD UT
- 5.400
- 5.103
- 5.104
- X LAB
- 5.421
- AIR LOCK
- 5.425
- 5.420
- 5.409
- 5.410
- LAB BENCH
- LAB BENCH GX
- INFINITY 80
- SHELVING
- LAF
- -80°C
- 5.452, 5.453, 5.454, 5.455, 5.456, 5.457 ungefär i höger del av zonen

### Rum/ytor

| ID-kandidat | Namn/etikett | Typ | Confidence |
|---|---|---|---|
| R-5600 | 5.600 | trapp-/hiss-/entrézon eller större passage | medium |
| R-5400 | 5.400 | huvudkorridor | high |
| R-5103 | 5.103 | rum/cellgrupp | medium |
| R-5104 | 5.104 | rum/cellgrupp | medium |
| R-X-LAB-5421 | X LAB 5.421 | lab | high |
| R-AIR-LOCK-Z2A | AIR LOCK | airlock | high |
| R-5425 | 5.425 | lab/rum med utrustning | high |
| R-5409 | 5.409 | lab/instrumentrum | medium |
| R-5410 | 5.410 | lab/instrumentrum | medium |

### Dörrar/passager som syns

- Större dörr/passager mellan 5.600 och 5.400.
- Flera nödutgångspilar kopplade till 5.600/5.400-området.
- Dörr från 5.400 in till X LAB 5.421.
- Dörr mellan X LAB och AIR LOCK.
- Dörr/passager mellan AIR LOCK och 5.425.
- Flera små dörrar runt 5.452–5.457 i höger del.
- Dörrar till 5.409 och 5.410 från korridor 5.420/5.448-området.

### Utrustning/props

- Flera LAB BENCH-rader längs övre labbdel.
- LAB BENCH GX.
- INFINITY 80-instrument.
- Shelving.
- LAF.
- -80°C-frys.

### Att göra för Codex/manuell annotering

1. Definiera 5.400 som central navigationskorridor.
2. Märk X LAB och AIR LOCK som en prioriterad slusssekvens.
3. Segmentera utrustningsobjekt i 5.421/5.425 separat från väggar.
4. Verifiera rum 5.452–5.457 i separat crop eftersom många små dörrar och etiketter ligger tätt.

---

## Z3 — övre höger: Storage / Outbound Waste / BSL3 / FI

### Säkert läsbara labels

- OUTBOUND WASTE AREA
- STORAGE 39,3 m2
- NÖD UT
- SLUSS
- BSL3
- FI
- FUME CHAMB
- HVAC UNIT 5.884
- SHOWER DRAIN
- 5.750
- 5.751
- 5.753
- 5.754
- 5.755
- 5.461
- 5.463
- 5.464
- 5.465
- 5.466
- 5.467
- 5.468
- 5.469
- 5.471
- LAB BENCH
- LAB BENCH GX
- LAF
- INFINITY 80
- INFINITY 48
- SEAL TEST STATION
- CAL TROLLEY
- 4°C, -20, -80°C

### Rum/ytor

| ID-kandidat | Namn/etikett | Typ | Confidence |
|---|---|---|---|
| R-OUTBOUND-WASTE-5244 | OUTBOUND WASTE AREA 5.244 | avfall/technical | high |
| R-STORAGE-Z3 | STORAGE 39,3 m2 | storage | high |
| R-5750 | 5.750 | större passage/rum | medium |
| R-5751 | 5.751 | passage/slussnära | medium |
| R-5753 | 5.753 | större rum | medium |
| R-5755 | 5.755 | större rum | medium |
| R-SLUSS-BSL3 | SLUSS | airlock | high |
| R-BSL3 | BSL3 | lab/containment | high |
| R-FI | FI | lab | high |
| R-FUME-CHAMB-5461 | FUME CHAMB 5.461 | lab | high |
| R-HVAC-5884 | HVAC UNIT 5.884 | technical | high |

### Dörrar/passager som syns

- Nödutgångar runt 5.750/5.751 och Outbound Waste Area.
- Dörr mellan Outbound Waste Area och angränsande passage/Storage.
- Dörrar från STORAGE till korridor/slussnära område.
- SLUSS har flera dörrar: mot BSL3, mot korridor/passage och mot angränsande labbzon.
- BSL3 har flera dörrar/passager samt nödutgångar markerade.
- FI har minst en tydlig dörr i nedre/vänstra gränsen och en nödutgång i nedre högra delen.
- FUME CHAMB har dörr mot angränsande sluss/labbdel.

### Utrustning/props

- FI: många lab benches, LAF, LAB BENCH GX, INFINITY 80/48, CAL TROLLEY, SEAL TEST STATION, kyl/frysobjekt.
- BSL3: bänkar, instrument, frysar/incubator-liknande objekt, PCR/arbetsstationer.
- HVAC UNIT ska troligen vara ett stort tekniskt hinder/rum, inte vanlig prop.
- SHOWER DRAIN i slussen ska bli safety/utility-prop, inte vägg.

### Att göra för Codex/manuell annotering

1. Modellera SLUSS-BSL3-FI som säkerhetskedja med flera dörrportaler.
2. Markera alla `NÖD UT` som egna safety_exit-kandidater med riktning.
3. Separera BSL3-väggar från utrustning; det är mycket tätt.
4. FI är bra kandidat för första realistiska labb-prop-pass, men inte för första kollisionspass eftersom den har många objekt.

---

## Z4 — nedre vänster: Digital-PCR / QC WIP / CM / GX / CMAL

### Säkert läsbara labels

- DIGITAL-PCR 5.535
- QC WIP 5.570
- 5.581
- SLUSS
- NÖD UT
- CM
- GX
- CMAL
- PIPETTE STATIONS
- STORAGE/PRINTER ROOM 5.522
- POST PCR 5.579
- MICROPLATE LAB 5.577
- FREEZERS 5.578
- FRYS
- LAGER OC LOTER 5.729
- LAGER OC LOTER 5.730
- SERVER ROOM 5.727
- IT STORAGE 5.731
- 5.720, 5.726 och flera små service-/WC-rum
- 5.528, 5.527, 5.526, 5.530, 5.505

### Rum/ytor

| ID-kandidat | Namn/etikett | Typ | Confidence |
|---|---|---|---|
| R-DIGITAL-PCR-5535 | DIGITAL-PCR 5.535 | lab | high |
| R-QC-WIP-5570 | QC WIP 5.570 | lab/QC | high |
| R-CM | CM | lab | high |
| R-GX | GX | lab | high |
| R-CMAL | CMAL | lab | high |
| R-PIPETTE-STATIONS | PIPETTE STATIONS | lab/arbetsstationer | high |
| R-STORAGE-PRINTER-5522 | STORAGE/PRINTER ROOM 5.522 | storage/support | high |
| R-POST-PCR-5579 | POST PCR 5.579 | lab | high |
| R-MICROPLATE-5577 | MICROPLATE LAB 5.577 | lab | high |
| R-FREEZERS-5578 | FREEZERS 5.578 | storage/freezer | high |
| R-SERVER-5727 | SERVER ROOM 5.727 | technical | high |
| R-IT-STORAGE-5731 | IT STORAGE 5.731 | storage/technical | medium |

### Dörrar/passager som syns

- Digital-PCR har stor dörröppning mot CM/SLUSS-området.
- SLUSS mellan Digital-PCR/QC WIP/GX har flera dörrar och flera `NÖD UT`-markeringar.
- GX har dörr mot sluss och passage mot intilliggande serviceyta.
- QC WIP har dörr/passager mot 5.581/5.580 och sluss/korridor.
- Storage/Printer Room har dörr mot korridor/servicepassage.
- Post PCR, Microplate Lab, Freezers och Lager OC Loter har flera dörrar till korridor 5.400/5.448.
- Server Room och IT Storage har dörrar mot korridor/teknikyta.
- Nedre kontorsrum 5.526–5.528 har separata dörrar mot korridor.

### Utrustning/props

- Digital-PCR: labbänkar och frys/kylobjekt nära väggarna.
- QC WIP: större öppen yta med enstaka utrustningssymboler.
- CM/PIPETTE STATIONS/CMAL: arbetsstationer och möbler.
- Storage/Printer Room: PC/KA-liknande symboler.
- Freezers: två FRYS-objekt.
- Server Room/IT Storage ska hanteras som tekniska rum med begränsad detaljeringsnivå i v1.

### Att göra för Codex/manuell annotering

1. Prioritera slussen mellan DIGITAL-PCR, QC WIP och GX; den är viktig för navigering.
2. Markera Digital-PCR, CM och GX som första vänsterzon att göra walkable.
3. Alla `NÖD UT` kring slussen ska bli exit labels men inte automatiskt teleport-/utgångsfunktion förrän dörrens position är inmätt.
4. Server/IT-rummen kan vänta till senare eftersom de inte behövs för första labbflödet.

---

## Z5 — nedre mitten: servicekärna, 5.447 och kontors-/mötesdel

### Säkert läsbara labels

- 5.400
- 5.401
- 5.402
- 5.403
- 5.404
- 5.405
- 5.406
- 5.408
- 5.409
- 5.410
- 5.441
- 5.442
- 5.443
- 5.444
- 5.445
- 5.446
- 5.447
- 5.448
- 5.467
- 5.470
- 5.471
- 5.204 12 p
- 5.206
- 5.207
- 5.208
- 5.222
- 5.223
- 5.224
- 5.225
- 5.226
- 5.227
- NÖD UT
- SKOGRÄNS
- REVO
- INFINITY 80
- ARBETSBORD MED INKUBATORER PÅ

### Rum/ytor

| ID-kandidat | Namn/etikett | Typ | Confidence |
|---|---|---|---|
| R-5400-Z5 | 5.400 | korridor | high |
| R-5448 | 5.448 | korridor/servicekärna | high |
| R-5447 | 5.447 | stort labb-/teknikrum | medium |
| R-5410 | 5.410 | labb/instrumentrum | high |
| R-5409 | 5.409 | labb/instrumentrum | medium |
| R-5401/R-5402/R-5403 | 5.401–5.403 | labb/service | medium |
| R-5441-5446 | 5.441–5.446 | serie av små/medelstora rum | medium |
| R-5204 | 5.204 12 p | mötesrum | high |
| R-5206/R-5224/R-5223/R-5208/R-5222 | kontorsrum | office | high |
| R-5225 | 5.225 | korridor/open office passage | medium |

### Dörrar/passager som syns

- Många dörrar längs 5.448 in till 5.401–5.410 och 5.441–5.446.
- Tydlig dörr från 5.400 mot 5.448 vid NÖD UT-pil.
- 5.447 har stora passager/dörrar mot angränsande labbzon och nedre korridor.
- 5.204 mötesrum har dörr mot korridor.
- Kontorsrummen 5.206, 5.224, 5.223, 5.208, 5.222 har dörrar mot korridor/open office.
- Dörrar nära 5.470/5.471 kopplar till BSL3/FI-zon.

### Utrustning/props

- 5.410: labbänkar och INFINITY 80.
- 5.442: bänkar med text `ARBETSBORD MED INKUBATORER PÅ`.
- 5.447: stort rum där utrustning/möbler är begränsat synligt i crop; kräver extra granskning.
- Kontorszon: bord, stolar, mötesbord.

### Att göra för Codex/manuell annotering

1. Gör 5.448 till en central korridornod i grafen.
2. Modellera 5.441–5.446 som enkel rumssvit först; detaljer senare.
3. Mötesrum/kontor kan göras med enklare props än labb.
4. 5.447 bör få egen crop innan det definieras som labb, storage eller teknikyta.

---

## Z6 — nedre höger: FI/BSL3-fortsättning, open lab och kontor

### Säkert läsbara labels

- BSL3
- FI
- HVAC UNIT 5.884
- 5.808
- 5.809
- 5.810
- 5.817
- 5.818
- 5.819
- 5.820
- 5.821
- 5.822
- 5.823
- 5.824
- 5.830
- 5.839
- 5.840
- 5.841
- 5.842
- 5.843
- 5.844
- 5.845
- 5.240
- 5.226, 5.227, 5.231, 5.232
- 5 x 15 = 75 skåp totalt
- BEF BETONGFUNDAMENT ca 400 mm öfg
- NÖD UT
- LAB BENCH
- LAB BENCH GX
- SEAL TEST STATION
- INFINITY 80
- CAL TROLLEY

### Rum/ytor

| ID-kandidat | Namn/etikett | Typ | Confidence |
|---|---|---|---|
| R-FI-Z6 | FI | lab | high |
| R-BSL3-Z6 | BSL3 | lab/containment | high |
| R-HVAC-5884-Z6 | HVAC UNIT 5.884 | technical | high |
| R-5240 | 5.240 | stor labb/open lab-yta | high |
| R-5808 | 5.808 | korridor/serviceyta | medium |
| R-5809 | 5.809 | mötes-/rumsyta 6 p | high |
| R-5810 | 5.810 | service/WC-kärna | medium |
| R-5817 | 5.817 | mindre rum | medium |
| R-5818/R-5819 | 5.818/5.819 | mindre kontor/rum | medium |
| R-5843/R-5844/R-5845 | mötes-/kontorsrum | office | medium |
| R-5820/R-5821/R-5823 | små kontor/service | office/service | medium |
| R-5830 | 5.830 | korridor | high |
| R-5739/R-5824/R-5822 | nedre rum/korridor | unknown/office | medium |

### Dörrar/passager som syns

- FI har nödutgång längst ned mot korridor/yttre gräns.
- BSL3 har flera dörrar och nödutgångar mot intilliggande passager.
- HVAC Unit har dörr/passager mot angränsande ytor.
- 5.240 är en stor öppen labb-/arbetsyta med flera passager i nederkant.
- Kontors-/mötesrum 5.809, 5.817, 5.818, 5.819 och 5.845 har tydliga dörrar.
- Korridor 5.830 har nödutgångspil och kopplar flera nedre rum.
- 5.822/5.824 har dörrar i nedre/högra delen.

### Utrustning/props

- FI: lab benches, lab bench GX, LAF, Infinity, seal test station, cal trolley.
- 5.240: stora rader av bord/stolar/skåp/arbetsplatser.
- 5.845: mötesbord med stolar.
- Nedre zon: `BEF BETONGFUNDAMENT ca 400 mm öfg` ska bli annotation/byggnotering, inte spelobjekt i v1.
- `5 x 15 = 75 skåp totalt` ska bli equipment/count-note, inte vägg.

### Att göra för Codex/manuell annotering

1. Separera Z6 i två underzoner: labb/FI/BSL3 och kontor/service.
2. Modellera 5.240 som stor walkable yta med möbler som colliders.
3. `75 skåp totalt` måste tolkas som utrustningsnotering, inte rumsnamn.
4. Nedre byggnoteringar om betongfundament ska hållas i `labels`/`notes`.

---

## Rekommenderad ordning för nästa arbete

1. Z4, eftersom Digital-PCR/CM/GX/SLUSS är tydligt läsbart och har bra första navigationsflöde.
2. Z2, eftersom X LAB + AIR LOCK är tydligt och ger bra dörr-/slusslogik.
3. Z3/Z6 labbdel, eftersom BSL3/FI är viktig men komplex.
4. Z5, för korridorgraf och koppling mellan labb och kontor.
5. Z1, för kalibreringslabb och instrumentrum.
6. Z6 kontorsdel, som kan förenklas i första simulatorversionen.

## Nästa data som bör läggas till i JSON

- `zone_review_status`
- `door_candidates` med normaliserade koordinater
- `room_polygon_candidates`
- `label_candidates` med bounding boxes
- `equipment_candidates` med `collider=true/false`
- `navigation_graph` med rum/korridor-noder
