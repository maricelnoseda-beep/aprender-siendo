# Guía de interfaz para cambios y agregados

- **Vigente desde:** 2026-11-09, por decisión de la supervisora clínica (Lic. M. G. Noseda).
- **Referencias vinculantes:** la interfaz del «index (1)» aportada por la supervisora (hoy reproducida exactamente por `app/`) y el [Manual de marca](Manual_de_marca_Aprender_Siendo_2026-11.pdf). Si difieren, prevalece el portal (lo dice el propio manual, p. 2).
- **Regla:** ningún cambio técnico modifica la interfaz gráfica. Toda pantalla, herramienta o agregado nuevo se construye con estos componentes y esta estética. Los textos dirigidos a personas siguen siendo de PSP-SR y de la supervisora.

## Dónde está cada cosa

| Qué | Archivo |
| --- | --- |
| Colores, radios, sombras y componentes base (`.as-panel`, `.as-boton`, `.as-opcion`) | `app/nucleo/estilos/identidad.css` |
| Estilos del portal (encabezado, tarjetas, formularios, modo niño, Luci) | `app/nucleo/estilos/portal.css` |
| Tableros de las actividades | `app/nucleo/estilos/actividades.css` |
| Nunito (licencia OFL) | `app/nucleo/fuentes/` |
| Símbolo, Luci, escenas por perfil | `app/nucleo/imagenes/` |
| Animales (31, en 5 categorías, 10 expresiones cada uno) | `app/nucleo/animales/` |

## Reglas para una herramienta o pantalla nueva

1. **Usá las variables `--as-*` de `identidad.css`; no inventes colores.** Tinta `#102F54`, verde `#196B6A`, sol `#FFB82E`, coral `#F58060`, lila `#BD89C4`, papel `#FCFAF7`, superficie blanca, menta `#E0F2EB` para selecciones, arena `#FFF1D7` para ayudas. Sobre coral, el texto va en tinta (blanco no alcanza contraste).
2. **Componentes:** panel con radio 22 px, opciones con radio 14 px, botón principal en píldora de tinta con texto claro; acciones secundarias en superficie clara o menta con un nombre inequívoco.
3. **Tipografía:** Nunito. Titular 800, subtítulo 750–800, cuerpo 400–600 a 18 px, botones 750–800. Texto alineado a la izquierda, interlínea 1,4 a 1,6. Respetar la preferencia de letra, tamaño y contraste de «Cómo leer».
4. **Juegos:** cada uno con «Pantalla completa» (y «Ampliar tablero» si el navegador la bloquea), salida visible y conservación de la partida. Reutilizar el motor de `nucleo/motor-actividades.js`.
5. **Imágenes:** animales del catálogo (los elige la persona; en el recorrido adolescente puede prescindir), escenas existentes, iconos de línea con extremos redondeados. Imágenes nuevas como archivos en `nucleo/imagenes/` o en la carpeta de la herramienta, nunca incrustadas en el código.
6. **Luci** es la guía de ayuda: se agregan temas en `LUMA_TOPICS` apuntando a un control que exista en la pantalla. Explica cómo usar el portal; no interpreta dificultades.
7. **Accesibilidad:** objetivos de al menos 44 × 44 px, foco visible, nombre accesible en botones de icono, contraste WCAG 2.2 AA, modo calma y movimiento reducido (Luci y la portada quietas).
8. **Estructura:** una herramienta nueva va en `app/herramientas/<id>/` con `herramienta.js` y `modulo.json`, y se agrega a `app/modulos.json`. No importa nada de otra herramienta (ADR-009).

## Cómo comprobar que la interfaz no cambió

`tests/e2e.js` acepta `SEMILLA=1`, que fija el azar y reduce el movimiento: corré la prueba contra la versión anterior y la nueva y compará las capturas píxel a píxel.
