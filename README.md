# Corona de Ceniza

Juego original de estrategia narrativa en español inspirado en el formato de decisiones binarias por cartas.

## Cómo jugar

1. Abrí `index.html` en un navegador moderno.
2. Escribí un nombre de dinastía, elegí un modo y opcionalmente una semilla.
3. Arrastrá las cartas a izquierda/derecha o usá los botones / teclas ← →.
4. Mantené Pueblo, Tesoro, Ejército y Saber lejos de 0 y 100.
5. Las decisiones alteran además variables ocultas, relaciones, eventos futuros y arcos narrativos.

No requiere servidor, instalación ni dependencias. Guarda automáticamente mediante `localStorage`.

## Sistemas incluidos

- 4 recursos visibles y múltiples estados ocultos.
- RNG determinista por semilla con selección ponderada, penalización de repetición y adaptación al estado del reino.
- Eventos escritos + peticiones procedurales combinatorias.
- Consecuencias diferidas y cadenas narrativas de varios pasos.
- Dinastía persistente entre muertes.
- Consejeros con relaciones.
- Rasgos heredables.
- Logros, secretos, finales especiales y Códice.
- Crónica de decisiones.
- Guardado automático, exportación e importación JSON.
- Cuatro modos de dificultad/RNG.
- Interfaz responsive, mouse, touch y teclado.
- Audio sintético opcional sin assets externos.

## Notas de diseño del RNG

El selector no elige uniformemente. Ajusta el peso según:
- novedad de la carta;
- cooldown y memoria de las últimas cartas;
- necesidades críticas de recursos;
- relaciones con consejeros;
- arcos narrativos activos;
- modo de juego;
- consecuencias ya programadas.

Las consecuencias programadas se guardan con su fecha futura, por lo que no desaparecen al cerrar el navegador.
