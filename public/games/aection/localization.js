export const LANGUAGES = Object.freeze(["de", "fr", "en"]);
export function chooseLanguage(query, stored) {
  return [query, stored, "de"].find(value => LANGUAGES.includes(value));
}
export async function loadDictionaries() {
  const entries = await Promise.all(LANGUAGES.map(async code => {
    const response = await fetch(new URL("./i18n/" + code + ".json", import.meta.url));
    if (!response.ok) throw new Error("language: " + code);
    return [code, await response.json()];
  }));
  return Object.fromEntries(entries);
}
export function livesLabel(words, count) {
  return words[count === 1 ? "lifeRemaining" : "livesRemaining"].replace("{count}", count);
}
