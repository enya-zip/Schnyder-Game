import { LEADERBOARD } from "./leaderboard-config.js";

const BOARD_SIZE = 10;

function configured() { return Boolean(LEADERBOARD.url && LEADERBOARD.key); }

async function rpc(name, body) {
  const response = await fetch(LEADERBOARD.url.replace(/\/+$/, "") + "/rest/v1/rpc/" + name, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: LEADERBOARD.key,
      // Alte "anon"-Schlüssel (JWT) brauchen zusätzlich Authorization. Neue "sb_publishable_"-Schlüssel nicht.
      ...(LEADERBOARD.key.startsWith("sb_") ? {} : { Authorization: "Bearer " + LEADERBOARD.key })
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text.includes("too_many_entries") ? "tooMany" : "failed");
  }
  return response.json();
}

// Rangliste nach dem Spiel: Formular (Name, E-Mail) -> Bestenliste mit eigenem Platz.
export function setupLeaderboard({ $, words, readStore, writeStore, getRun, onPlayAgain }) {
  const dialog = $("board-dialog");
  const form = $("board-form");
  const list = $("board-list");
  const message = $("board-message");
  const submit = $("board-submit");
  let submittedRun = null, lastResult = null, busy = false;

  function show(view) {
    $("board-entry").hidden = view !== "form";
    $("board-view").hidden = view !== "list";
  }
  function setMessage(key) {
    message.textContent = key ? words[key] : "";
    message.hidden = !key;
  }
  function row(rank, name, score, mine) {
    const li = document.createElement("li");
    if (mine) li.className = "mine";
    const r = document.createElement("span"); r.className = "board-rank"; r.textContent = rank;
    const n = document.createElement("span"); n.className = "board-name"; n.textContent = name;
    if (mine) { const you = document.createElement("small"); you.textContent = words.youLabel; n.append(" ", you); }
    const s = document.createElement("strong"); s.textContent = score;
    li.append(r, n, s);
    return li;
  }
  async function loadBoard() {
    show("list");
    list.replaceChildren();
    $("board-rank").hidden = true;
    if (!configured()) { setMessage("boardNotConfigured"); return; }
    setMessage("loadingBoard");
    try {
      const rows = await rpc("aection_board", { p_limit: BOARD_SIZE });
      const myName = lastResult ? lastResult.name : null;
      let marked = false;
      for (const entry of rows) {
        const mine = Boolean(lastResult) && !marked && Number(entry.rank) === lastResult.rank && entry.name === myName;
        if (mine) marked = true;
        list.append(row(entry.rank, entry.name, entry.score, mine));
      }
      if (lastResult && !marked) {
        const gap = document.createElement("li"); gap.className = "board-gap"; gap.textContent = "…";
        list.append(gap, row(lastResult.rank, lastResult.name, lastResult.best, true));
      }
      if (lastResult) {
        $("board-rank").textContent = words.yourRank.replace("{rank}", lastResult.rank).replace("{total}", lastResult.total);
        $("board-rank").hidden = false;
      }
      setMessage(rows.length ? "" : "boardEmpty");
    } catch {
      setMessage("boardError");
    }
  }

  function open() {
    const run = getRun();
    $("board-score").textContent = run.score;
    setMessage("");
    const saved = readStore("aection:player", {});
    if (saved && typeof saved === "object") {
      if (!$("board-name").value) $("board-name").value = saved.name || "";
      if (!$("board-email").value) $("board-email").value = saved.email || "";
    }
    if (submittedRun === run) loadBoard();
    else { lastResult = null; show("form"); }
    $("result-dialog").close();
    dialog.showModal();
    if (submittedRun !== run) (!$("board-name").value ? $("board-name") : submit).focus();
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (busy) return;
    const run = getRun();
    const name = $("board-name").value.trim().replace(/\s+/g, " ");
    const email = $("board-email").value.trim();
    if (!configured()) { setMessage("boardNotConfigured"); return; }
    busy = true; submit.disabled = true; submit.textContent = words.saving; setMessage("");
    try {
      const [result] = await rpc("aection_submit", { p_name: name, p_email: email, p_score: run.score, p_level: run.level });
      writeStore("aection:player", { name, email });
      submittedRun = run;
      lastResult = { name, rank: Number(result.rank), best: result.best_score, total: Number(result.total) };
      await loadBoard();
    } catch (error) {
      setMessage(error.message === "tooMany" ? "boardTooMany" : "boardError");
    } finally {
      busy = false; submit.disabled = false; submit.textContent = words.submitScore;
    }
  });

  $("to-board").addEventListener("click", open);
  $("board-view-only").addEventListener("click", () => { lastResult = null; loadBoard(); });
  $("board-again").addEventListener("click", onPlayAgain);
  $("board-back").addEventListener("click", () => { dialog.close(); $("result-dialog").showModal(); });
  dialog.addEventListener("cancel", event => { event.preventDefault(); dialog.close(); $("result-dialog").showModal(); });

  return {
    // Neues Spiel: Formular für den nächsten Eintrag zurücksetzen.
    reset() { lastResult = null; setMessage(""); }
  };
}
