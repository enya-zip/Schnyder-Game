# ÄCTION! auf schnyder-werbung.ch

Dieses Paket enthält den aktuellen Higgsfield-Spielstand als statische Website. Alle benötigten Bilder, Töne und Sprachdateien liegen im Spielordner.

1. Den Ordner `public/games/aection/` aus dem ZIP ins Next.js-Projekt der Schnyder-Website kopieren. Die Ordnerstruktur beibehalten und die Website veröffentlichen.
2. Auf der gewünschten Seite diesen HTML-Code einsetzen. In einer TSX-Datei `allowFullScreen` statt `allowfullscreen` schreiben und die CSS-Regeln über eine Klasse oder ein `style`-Objekt setzen.

```html
<iframe
  src="/games/aection/index.html?embed=1"
  title="ÄCTION! – Das Schnydär-Game"
  width="100%"
  height="720"
  style="display:block;width:100%;height:clamp(560px,90svh,820px);border:0;background:#0b0b0b;"
  allow="fullscreen"
  allowfullscreen
  loading="lazy"
></iframe>
```

Der relative `src` hält Website und Spiel auf derselben Domain. Dafür reicht die bestehende `frame-src 'self'`-Freigabe. Das Spiel lässt sich nach der Veröffentlichung auch direkt unter `https://schnyder-werbung.ch/games/aection/index.html` öffnen. Rekorde und Einstellungen speichert der Browser lokal.
