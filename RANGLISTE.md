# Rangliste einrichten (Supabase)

Die Rangliste speichert Name, E-Mail-Adresse und Punkte in einer kostenlosen Supabase-Datenbank.
Andere Spieler sehen nur **Platz, Name und Punkte**. E-Mail-Adressen sind nur im Supabase-Dashboard sichtbar.

## 1. Supabase-Projekt anlegen
1. Auf https://supabase.com ein Konto erstellen und **New project** wählen.
2. Als Region **Central EU (Zurich)** oder **Frankfurt** wählen (Daten bleiben in Europa).

## 2. Datenbank vorbereiten
1. Im Projekt links **SQL Editor** öffnen.
2. Den ganzen Inhalt von [`supabase/rangliste.sql`](supabase/rangliste.sql) einfügen und auf **Run** klicken.

## 3. Spiel verbinden
1. Supabase-Dashboard öffnen.
2. Die Projekt-Adresse (unter **Connect**) und den **Publishable key** (beginnt mit `sb_publishable_`, unter **Settings → API Keys**) kopieren.
3. Beide in [`public/games/aection/leaderboard-config.js`](public/games/aection/leaderboard-config.js) eintragen:

```js
export const LEADERBOARD = Object.freeze({
  url: "https://DEIN-PROJEKT.supabase.co",
  key: "eyJ..."
});
```

Der Publishable key darf öffentlich im Spiel stehen. Den **Secret key** (`sb_secret_…`) niemals eintragen.

## Einträge ansehen
Supabase → **Table Editor** → `aection_scores`. Dort sind alle Einträge mit E-Mail-Adressen sichtbar und lassen sich löschen
(z. B. bei Auskunfts- oder Löschanfragen nach Datenschutzgesetz).

## Gut zu wissen
- Pro E-Mail-Adresse zählt nur das beste Ergebnis.
- Pro E-Mail-Adresse sind höchstens 20 Einträge pro Stunde möglich (Spam-Schutz).
- Die Punkte werden im Browser berechnet. Wer sich mit Technik auskennt, könnte eine falsche Punktzahl einsenden.
  Verdächtige Einträge kannst du im Table Editor löschen.
- Auf schnyder-werbung.ch muss eine allfällige Content-Security-Policy `connect-src` die Supabase-Adresse erlauben.
