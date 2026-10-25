# Opciones · Js Interiorismo (app concept, idea 2)

Clickable web prototype (installable PWA), not an App Store app. Concept by Shaf3ool.

The client sees every option Jorge Santana / Js Interiorismo offers for a project, grouped by category
(Pisos, Muros, Mobiliario, Iluminación, Baño, Cocina, Exteriores). They can search, filter by category,
open a detail sheet, save favourites and "Enviar a Jorge" (Demo: nothing is sent, and the app says so).

- Photos: Jorge's real renders (© Jorge Santana / Js Interiorismo), cropped as stand-ins.
- Material samples: drawn by code (js/textures.js), not photos.
- Option names, notes and specs: Demo data. Contacts: placeholders.
- Favourites and the message stay on the device (localStorage key `js-app-opciones:v1`).

Structure: index.html · css/app.css · js/app.js (boot, phone frame) · js/data.js (catalogue) ·
js/i18n.js (ES-MX / EN) · js/store.js · js/ui.js · js/textures.js · js/screens/{catalog,detail,favorites}.js · sw.js
