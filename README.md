# AulaNFC v2.0

Aplicación móvil para registrar eventos escolares mediante tarjetas NFC.

## Rama de desarrollo

La versión 2.0 se desarrolla en `aulanfc-v2`. La rama `main` permanece como respaldo estable.

## Estructura

- `index.html`: interfaz principal.
- `css/style.css`: estilos visuales.
- `js/config.js`: configuración y nombres de módulos.
- `js/scanner.js`: lectura Web NFC y control de duplicados.
- `js/api.js`: comunicación con Google Apps Script.
- `js/ui.js`: manipulación de la interfaz.
- `js/app.js`: coordinación general de la aplicación.

## Requisitos del escáner

- Teléfono Android compatible con NFC.
- Google Chrome.
- Página servida mediante HTTPS.
- El lector debe activarse mediante una acción directa del usuario.

## Estado actual

Fase 1: estructura modular terminada. El comportamiento de comunicación con Apps Script se conserva temporalmente para realizar pruebas antes de la Fase 2.
