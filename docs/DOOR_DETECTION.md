# Door detection notes

## Visuella tecken

Dörrar hittas genom kombinationen:

1. Avbrott i vägglinje.
2. Tunt dörrblad nära öppningen.
3. Svängbåge/arc.
4. Logiskt samband mellan rum/korridor.
5. Vid sluss: två eller flera dörrar i serie.

## Risker

- Svängbågar kan feltolkas som vägg.
- Tätt placerad labbutrustning kan feltolkas som vägg.
- Rumsnummer/text kan skapa falska linjer vid maskning.
- Nödutgångspilar kan skapa falska geometriobjekt.

## Outputformat

```json
{
  "id": "D-Z3-XLAB-AIRLOCK-01",
  "type": "hinged",
  "zone": "Z3",
  "between": ["R-X-LAB-5421", "R-AIR-LOCK-LEFT"],
  "swing_visible": true,
  "emergency_exit": false,
  "confidence": "high"
}
```
