# Corona de Ceniza

Juego original de estrategia narrativa en español (vos rioplatense). Gobernás Valdoria a través de generaciones: cada decisión deja una cicatriz; cada muerte, una herencia.

## Cómo jugar

1. Abrí `index.html` en un navegador moderno (o serví la carpeta con cualquier http estático).
2. Nombrá la dinastía, color, lema y modo. La semilla puede ir vacía o compartirse por URL: `index.html?seed=mi-semilla&mode=harsh`.
3. `?daily=1` arranca el desafío del día.
4. Arrastrá las cartas, usá los botones o las flechas ← →. `C` consulta al Consejo. `Z` deshace (solo Consejo Real). `?` abre la ayuda.
5. Mantené Pueblo, Tesoro, Ejército y Saber lejos de 0 y de 100. Tocá cada pilar para leer su muerte. Desde el segundo reinado, una conspiración puede matarte con los pilares en pie: te avisan antes.

No requiere instalación. Guarda en `localStorage` y se puede instalar como PWA.

## Qué hay en esta versión

- Coronación tutorial, pistas en la carta (también en el teléfono) y números que saltan al decidir.
- ~200 cartas escritas, peticiones procedurales con memoria de lugares, estaciones y consejeros que se vuelven aliados o enemigos.
- Arcos largos: Fiebre de Vidrio, Tres Banderas, Observatorio Negro, República de Tinta, Hambruna del Sur, Cisma del Estuario, Crisis dinástica, Viaje a Sahr, Motín, Boda real, Inundación, Herejía de la estrella, y tres conspiraciones (mesa, protocolo, correo) que pueden matarte sin tocar 0 ni 100.
- El reino se hereda: obras, edictos, facciones y vecinos no vuelven a 50/50.
- Edad, sucesor nombrado, muerte natural, finales que pueden sellar la crónica.
- Mapa en el Códice, anales exportables, legado con leyes de casa, música de corte.

## Modos

| Modo | Qué hace |
|---|---|
| Crónica | Experiencia equilibrada |
| Consejo Real | Efectos −18%, un deshacer por reinado, consejo más usable |
| Corona de Hierro | Efectos +18%, confirma si la carta te mata |
| Oráculo Roto | Pesos y magnitudes inestables |

## Archivos

- `index.html` + `style.css` — interfaz
- `content.js` — constantes, consejeros, logros, finales
- `cards-core.js` / `cards-arcs.js` — el mazo
- `game.js` — motor
- `manifest.webmanifest` + `sw.js` — PWA
