// Verbindung zur Supabase-Rangliste.
// url: Projekt-Adresse (steht im Supabase-Dashboard unter "Connect")
// key: "Publishable key" (beginnt mit sb_publishable_) unter "Settings -> API Keys".
//      Dieser Schlüssel darf öffentlich sein. Den "Secret key" NIE hier eintragen.
// Solange beide leer sind, zeigt das Spiel "Rangliste noch nicht verbunden".
export const LEADERBOARD = Object.freeze({
  url: "https://ejglpgxphigohqmnplcz.supabase.co",
  key: "sb_publishable_TR136w9a-lzPnCut2Xsq7A_j1jMphvC"
});
