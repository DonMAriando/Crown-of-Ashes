# Corona de Ceniza

Juego original de estrategia narrativa en español (vos rioplatense). Gobernás Valdoria a través de generaciones: cada decisión deja una cicatriz; cada muerte, una herencia.

Versión de contenido **2.6.0**. Repositorio: [DonMAriando/Crown-of-Ashes](https://github.com/DonMAriando/Crown-of-Ashes).

## Cómo jugar

1. Abrí `index.html` en un navegador moderno, o serví la carpeta con cualquier HTTP estático (hace falta servidor solo si querés instalarla como app).
2. Nombrá la dinastía, color, lema y modo. La semilla puede ir vacía o compartirse por URL: `index.html?seed=mi-semilla&mode=harsh`.
3. `?daily=1` arranca el desafío del día.
4. Arrastrá la carta, usá los botones o las flechas ← →.
5. Mantené **Pueblo**, **Tesoro**, **Ejército** y **Saber** lejos de **0** y de **100**. Tocá cada pilar para leer su muerte.

Desde el segundo reinado, una conspiración puede matarte con los pilares en pie: te avisan antes.

La partida se guarda en este navegador (`localStorage`). No requiere instalación.

### Controles

| Qué | Cómo |
|---|---|
| Decidir | Arrastre, botones, ← → |
| Consejo | Botón Consejo o `C` |
| Música de corte | Botón ♪ en la barra, checkbox del menú, o `M` |
| Ayuda | `?` |
| Deshacer | `Z` (solo modo Consejo Real, una vez por reinado) |

El botón ♪ corta solo las camas. Los toques al deslizar, sellar o consultar siguen, si el sonido está prendido.

## Qué hay ahora

- Coronación tutorial, pistas en la carta (también en el teléfono) y números que saltan al decidir. Las placas dicen el pilar en tinta; el punto (o el número) dice si sube o baja.
- ~200 cartas escritas, peticiones procedurales con memoria de lugares, estaciones y doce consejeros que se vuelven aliados o enemigos.
- Arcos largos: Fiebre de Vidrio, Tres Banderas, Observatorio Negro, República de Tinta, Hambruna del Sur, Cisma del Estuario, crisis dinástica, viaje a Sahr, motín, boda real, inundación, herejía de la estrella.
- Tres conspiraciones (copa, protocolo, correo): una por corona, avisada, pueden matar sin tocar 0 ni 100. Si te matan, el heredero hereda al asesino.
- El reino se hereda: obras, edictos, facciones y vecinos no vuelven a 50/50.
- Edad que se siente: el mazo cambia a los 40, 55 y 65; Odón anuncia la muerte natural en una carta. El heredero, si tiene nombre, deja de ser «el niño». Si es menor de dieciséis, hay regencia que discute el sello.
- Odón puede ceder el oficio: Iva Grís toma el pulso. Se puede abdicar de verdad. Quien no heredó puede volver ~a los 18.
- Códice con **Linaje**, **Crónicas** selladas (al fundar otra casa o cerrar el libro), mapa generado por la semilla, anales del reinado actual, legado con leyes de casa. En la mesa hay un mapita vivo; tocarlo abre el Códice en **Mapa**. El sello empieza chico, crece con los años y los arcos, y puede perder tierras. Si cae la última, el reinado termina: al heredero lo coronan señor de la tierra donde estaba.
- Intro obligatoria: Software Society presenta, después el título y el icono pintado. No se saltea.
- El salón cambia de ropa con la estación y los agüeros (velo sobre el mismo `hall.jpg`).
- Los oficios de la mesa se heredan: cada consejero envejece, puede dejar la silla, y el sucesor recuerda cómo trataste al anterior. Si se pierde el puerto, la almirante llega sin mar. El Códice, pestaña Consejeros, guarda esa fila.
- Retratos de corte, salón de piedra propio (el dorso queda en el mazo), carta de pergamino, muerte y coronación como escena, tres imágenes de clímax.
- Mesa leíble sobre la nave: pilares opacos y placas de elección, no texto al 20% sobre la piedra.
- El salón tiene vela (sigue el puntero en desktop; en el teléfono respira). Al decidir hay viruta o ceniza; al morir, el hall se apaga. Peste, guerra y vacío dejan motas. “Reducir movimiento” lo apaga.
- Ocho camas de Suno en `musica/` (Opus, con fallback a MP3): menú de coronación, corte, invierno, peste, guerra, vacío, conspiración y un stinger de muerte. El ♪ las apaga; pasar cartas no reinicia la pista.

## Modos

| Modo | Qué hace |
|---|---|
| Crónica | Experiencia equilibrada |
| Consejo Real | Efectos −18%, un deshacer por reinado, consejo más usable |
| Corona de Hierro | Efectos +18%, confirma si la carta te mata |
| Oráculo Roto | Pesos y magnitudes inestables |

## Archivos

| Archivo | Rol |
|---|---|
| `index.html` / `corona-de-ceniza-jugar.html` | Interfaz (mantenerlas iguales) |
| `style.css` | Mesa, pergamino, sala |
| `content.js` | Constantes, consejeros, logros, finales |
| `cards-core.js` / `cards-arcs.js` | El mazo |
| `audio.js` | Camas HTML (`musica/*.opus`) y toques Web Audio |
| `fx.js` | Vela del salón y ráfagas (sin librería) |
| `musica/` | Camas de Suno (ver `musica/CAMAS.md`) |
| `game.js` | Motor, sucesión, linaje, guardado, mute |
| `img/` | Salón, retratos, dorso, clímax, muerte, coronación, logo de Software Society |
| `icon.png` | Marca pintada (favicon, PWA, intro y mesa) |
| `manifest.webmanifest` + `sw.js` | PWA |

Guardado: `corona-de-ceniza-save-v2` y `corona-de-ceniza-meta-v2`. La preferencia de música también queda en `corona-de-ceniza-music`.

## Notas honestas

- Los retratos y las escenas son arte generado para esta corte, no pinturas licenciadas. El hueco de la carta es una franja ancha (cara y hombros), no el óleo entero.
- Las camas son pistas Opus en `musica/` (Suno). Si el navegador no reproduce Opus, busca el mismo nombre en MP3. Los toques de las cartas siguen en Web Audio. El botón ♪ corta solo las camas.
- Chrome (y otros) no sueltan el audio hasta el primer clic. Fundar, continuar o tocar ♪ basta.
- Si una recarga deja el JavaScript viejo, `Ctrl+F5`. El service worker usa un nombre de caché (`corona-de-ceniza-v2.35` al momento de escribir esto).

Al publicar un cambio de interfaz o de motor: bump de `style.css?v=` / `audio.js?v=` / `fx.js?v=` / `game.js?v=` en **los dos** HTML, bump de `CACHE` en `sw.js`, y una fila nueva arriba de la bitácora.

## Bitácora de funcionalidad

Qué se subió a `main`, cuándo y con qué commit. Lo más nuevo va arriba. Los merge de PR se anotan en la misma fila que el trabajo.

| Fecha | Commit | Cómo llegó | Qué se puede hacer desde entonces |
|---|---|---|---|
| 1 sep 2026 | [`1e9c59a`](https://github.com/DonMAriando/Crown-of-Ashes/commit/1e9c59a) | Push a `main` | Las sillas de la mesa se heredan. Cada oficio envejece, puede dejar la silla, y el sucesor recuerda cómo trataste al anterior. Si se pierde el puerto, la almirante llega sin mar. Códice, pestaña Consejeros. Contenido 2.6.0. |
| 1 sep 2026 | [`d512fce`](https://github.com/DonMAriando/Crown-of-Ashes/commit/d512fce) | Push a `main` | Las placas de elección ya no gritan: el nombre de la decisión manda; los pilares quedan en tinta chica, color solo en el punto, pegados a la carta. En el escritorio no se duplican sobre el swipe. |
| 1 sep 2026 | [`6c2e4c4`](https://github.com/DonMAriando/Crown-of-Ashes/commit/6c2e4c4) | Push a `main` | Cada semilla dibuja un mapa distinto. El imperio arranca chico, crece con los años y los arcos, y puede perder tierras. Si cae la última, el reinado termina; al heredero lo coronan señor del resto. Las placas de elección nombran el pilar (verde/rojo). Contenido 2.5.1. |
| 1 sep 2026 | [`9afd135`](https://github.com/DonMAriando/Crown-of-Ashes/commit/9afd135) | Push a `main` | El mapa de Valdoria queda a la vista en la mesa. Late cuando una decisión mancha el terreno; si la carta mira una región, esa zona se ilumina. Tocarlo abre el Códice en **Mapa**. |
| 30 ago 2026 | [`6167905`](https://github.com/DonMAriando/Crown-of-Ashes/commit/6167905) | Push a `main` | Intro obligatoria: Software Society presenta, después el título con el icono pintado. No hay Saltar. Favicon y PWA usan `icon.png`. |
| 30 ago 2026 | [`54a5720`](https://github.com/DonMAriando/Crown-of-Ashes/commit/54a5720) | Push a `main` | El heredero nombrado deja de ser «el niño». La regencia discute el sello. Odón puede ceder la silla a Iva Grís. Se puede abdicar. El hermano que no heredó puede volver. El Códice guarda **Crónicas** al fundar otra casa o sellar. El mapa mancha las obras. El salón cambia de ropa con la estación. Contenido 2.4.0. |
| 30 ago 2026 | [`0c2fab3`](https://github.com/DonMAriando/Crown-of-Ashes/commit/0c2fab3) | Push a `main` | El salón tiene vela (sigue el puntero en desktop; en el teléfono respira). Al decidir hay viruta de oro o ceniza; al morir, el hall se apaga. Peste, guerra y vacío dejan motas. Sin Three.js: `fx.js` y “Reducir movimiento” lo apaga. |
| 30 ago 2026 | [`b1ad7a1`](https://github.com/DonMAriando/Crown-of-Ashes/commit/b1ad7a1) | Push a `main` | La edad cambia el mazo (40, 55, 65). Odón anuncia la muerte natural en una carta. El heredero se ve en la mesa y envejece con vos; si es menor de 16, hay regencia. El Códice gana **Linaje**: fila de coronas, detonantes y horquillas (segunda cuna / crisis). Los Anales quedan como diario de este reinado. Contenido 2.3.0. |
| 29 ago 2026 | [`8b0b3db`](https://github.com/DonMAriando/Crown-of-Ashes/commit/8b0b3db) | Push a `main` | Salón de piedra propio (`img/hall.jpg`); el dorso queda en el mazo. Pilares y placas de elección opacos sobre la nave. Ocho camas Suno en `musica/` (coronación, corte, invierno, peste, guerra, vacío, conspiración, muerte). El ♪ corta solo las camas; pasar cartas no reinicia la pista. |
| 28 ago 2026 | [`0ab1a0a`](https://github.com/DonMAriando/Crown-of-Ashes/commit/0ab1a0a) | Push a `main` | Silenciar o devolver la melodía de corte desde el trono (♪ o `M`). Al reactivar, la frase vuelve; ya no queda el zumbido fijo. La carta no se congela al guardar a mitad de un swipe. La sala usa el dorso como tapiz; la carta tiene grano de pergamino. |
| 28 ago 2026 | [`d3fc29b`](https://github.com/DonMAriando/Crown-of-Ashes/commit/d3fc29b) | [PR #3](https://github.com/DonMAriando/Crown-of-Ashes/pull/3) `presencia-valoria` | Doce retratos de consejeros, dorso de carta, muerte y coronación como escena, tres clímax de traición, partitura Web Audio (camas y stingers). |
| 28 ago 2026 | [`89ce443`](https://github.com/DonMAriando/Crown-of-Ashes/commit/89ce443) | [PR #2](https://github.com/DonMAriando/Crown-of-Ashes/pull/2) `tres-capas-valoria` | Tres arcos de traición (copa, protocolo, correo) que pueden matar con los pilares en pie. Una daga avisada por corona; el heredero hereda al asesino. |
| 28 ago 2026 | [`3c8a175`](https://github.com/DonMAriando/Crown-of-Ashes/commit/3c8a175) | [PR #1](https://github.com/DonMAriando/Crown-of-Ashes/pull/1) `tres-capas-valoria` | Las tres capas: tutorial, ~200 cartas, arcos largos, sucesión con memoria, Códice y mapa, PWA, fundador que conserva nombre y género. |
| 28 ago 2026 | [`4714179`](https://github.com/DonMAriando/Crown-of-Ashes/commit/4714179) | Primer commit | Prototipo jugable: swipe binario, cuatro pilares, dinastía, HTML de mesa. |
