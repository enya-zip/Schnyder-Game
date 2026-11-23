// Verbindung zur Supabase-Rangliste.
// Werte im Supabase-Dashboard unter "Project Settings -> API" kopieren:
//   url: "Project URL", z. B. "https://abcdefgh.supabase.co"
//   key: "anon public"-Schlüssel (dieser Schlüssel darf öffentlich sein)
// Solange beide leer sind, zeigt das Spiel "Rangliste noch nicht verbunden".
export const LEADERBOARD = Object.freeze({
  url: "",
  key: ""
});
