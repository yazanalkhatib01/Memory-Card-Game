const el = {
  usernameInput: document.getElementById("usernameInput"),
  usernameHint: document.getElementById("usernameHint"),
  retriesInput: document.getElementById("retriesInput"),
  timerToggle: document.getElementById("timerToggle"),
  timerDurationRow: document.getElementById("timerDurationRow"),
  timerDurationInput: document.getElementById("timerDurationInput"),
  timerBadge: document.getElementById("timerBadge"),
  timerDisplay: document.getElementById("timerDisplay"),
  gameBoard: document.getElementById("gameBoard"),
  movesVal: document.getElementById("movesVal"),
  mistakesVal: document.getElementById("mistakesVal"),
  missesVal: document.getElementById("missesVal"),
  movesCard: document.getElementById("movesCard"),
  mistakesCard: document.getElementById("mistakesCard"),
  missesCard: document.getElementById("missesCard"),
  hintBtn: document.getElementById("hintBtn"),
  hintCooldownText: document.getElementById("hintCooldownText"),
  restartBtn: document.getElementById("restartBtn"),
  retryPips: document.getElementById("retryPips"),
  boardLabel: document.getElementById("boardLabel"),
  overlay: document.getElementById("overlay"),
  overlayEmoji: document.getElementById("overlayEmoji"),
  overlayTitle: document.getElementById("overlayTitle"),
  overlayMsg: document.getElementById("overlayMsg"),
  ovMoves: document.getElementById("ovMoves"),
  ovMistakes: document.getElementById("ovMistakes"),
  ovTime: document.getElementById("ovTime"),
  playAgainBtn: document.getElementById("playAgainBtn"),
  settingsPanel: document.getElementById("settingsPanel"),
};

let state = {
  cards: [],
  flipped: [],
  matched: 0,
  moves: 0,
  mistakes: 0,
  misses: 0,
  locked: false,
  gameActive: false,
  timerInterval: null,
  timeLeft: 0,
  timeElapsed: 0,
  hintCooldown: null,
  hintActive: false,
  retriesLeft: 5,
  maxRetries: 5,
};

const Utils = {
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  formatTime(s) {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  },

  bump(card) {
    card.classList.remove("bump");
    void card.offsetWidth;
    card.classList.add("bump");
    setTimeout(() => card.classList.remove("bump"), 300);
  },
};

//Username gate
el.usernameInput.addEventListener("input", () => {
  const hasName = el.usernameInput.value.trim().length > 0;
  el.usernameHint.classList.toggle("hidden", hasName);
  if (hasName && !state.gameActive) {
    initGame();
  }
  if (!hasName) {
    state.gameActive = false;
    el.hintBtn.disabled = true;
    el.gameBoard
      .querySelectorAll(".card")
      .forEach((c) => c.classList.add("locked"));
    el.usernameHint.classList.remove("hidden");
  }
});

// Timer toggle
el.timerToggle.addEventListener("change", () => {
  const on = el.timerToggle.checked;
  el.timerDurationRow.classList.toggle("visible", on);

  if (!on) {
    el.timerBadge.classList.add("timer-hidden");
    clearInterval(state.timerInterval);
  }
});

// Build board
function buildPips() {
  el.retryPips.innerHTML = "";
  for (let i = 0; i < state.maxRetries; i++) {
    const pip = document.createElement("div");
    pip.className = "retry-pip" + (i >= state.retriesLeft ? " used" : "");
    el.retryPips.appendChild(pip);
  }
}

function initGame() {
  const username = el.usernameInput.value.trim();
  if (!username) return;

  clearInterval(state.timerInterval);
  clearTimeout(state.hintCooldown);

  state.maxRetries = Math.max(1, parseInt(el.retriesInput.value) || 5);
  state.retriesLeft = state.maxRetries;
  state.moves = 0;
  state.mistakes = 0;
  state.misses = 0;
  state.matched = 0;
  state.flipped = [];
  state.locked = false;
  state.gameActive = true;
  state.hintActive = false;
  state.timeElapsed = 0;

  el.movesVal.textContent = "0";
  el.mistakesVal.textContent = "0";
  el.missesVal.textContent = "0";

  el.hintBtn.disabled = false;
  el.hintBtn.querySelector("span").textContent = "";
  el.boardLabel.textContent = username + "'s Board";

  // Card values: 8 pairs → 16 cards
  const values = Utils.shuffle([
    1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8,
  ]);
  state.cards = values.map((v, i) => ({
    id: i,
    value: v,
    flipped: false,
    matched: false,
  }));

  buildPips();
  renderBoard();
  Timer.start();
}

function renderBoard() {
  el.gameBoard.innerHTML = "";

  state.cards.forEach((c) => {
    const cardEl = document.createElement("div");

    cardEl.className =
      "card" + (c.flipped ? " flipped" : "") + (c.matched ? " matched" : "");

    cardEl.dataset.id = c.id;

    cardEl.innerHTML = `
  <div class="card-inner">
    <div class="card-face card-back">
      <svg class="card-back-pattern" viewBox="0 0 40 40" fill="none">
        <rect x="4" y="4" width="32" height="32" rx="4" stroke="white" stroke-width="1.5"/>
        <rect x="10" y="10" width="20" height="20" rx="2" stroke="white" stroke-width="1"/>
        <circle cx="20" cy="20" r="5" stroke="white" stroke-width="1"/>
      </svg>
    </div>
    <div class="card-face card-front">
      <span class="card-number n${c.value}">${c.value}</span>
    </div>
  </div>
`;
    cardEl.addEventListener("click", () => onCardClick(c.id));

    el.gameBoard.appendChild(cardEl);
  });
}

function getCardEl(id) {
  return el.gameBoard.querySelector(`.card[data-id="${id}"]`);
}

function onCardClick(id) {
  if (!state.gameActive) return;
  if (state.locked) return;

  const c = state.cards[id];
  if (c.matched || c.flipped) return;
  if (state.flipped.length >= 2) return;

  // Flip it
  c.flipped = true;
  state.flipped.push(id);
  getCardEl(id).classList.add("flipped");

  if (state.flipped.length === 2) {
    state.moves++;
    el.movesVal.textContent = state.moves;
    Utils.bump(el.movesCard);
    checkMatch();
  }
}

function checkMatch() {
  state.locked = true;
  const [a, b] = state.flipped;
  const ca = state.cards[a];
  const cb = state.cards[b];

  if (ca.value === cb.value) {
    setTimeout(() => {
      ca.matched = cb.matched = true;
      getCardEl(a).classList.add("matched");
      getCardEl(b).classList.add("matched");
      state.matched += 2;
      state.flipped = [];
      state.locked = false;

      if (state.matched === state.cards.length) {
        endGame(true);
      }
    }, 350);
  } else {
    state.mistakes++;
    state.misses++;
    el.mistakesVal.textContent = state.mistakes;
    el.missesVal.textContent = state.misses;
    Utils.bump(el.mistakesCard);
    Utils.bump(el.missesCard);

    // Use a retry
    state.retriesLeft = Math.max(0, state.retriesLeft - 1);
    buildPips();

    const elA = getCardEl(a);
    const elB = getCardEl(b);
    elA.classList.add("wrong");
    elB.classList.add("wrong");

    const delay = state.retriesLeft === 0 ? 600 : 900;

    setTimeout(() => {
      ca.flipped = cb.flipped = false;
      elA.classList.remove("flipped", "wrong");
      elB.classList.remove("flipped", "wrong");
      state.flipped = [];
      state.locked = false;

      if (state.retriesLeft === 0) {
        endGame(false);
      }
    }, delay);
  }
}

//Timer
const Timer = {
  start() {
    clearInterval(state.timerInterval);

    if (!el.timerToggle.checked) {
      el.timerBadge.classList.add("timer-hidden");
      let elapsed = 0;

      state.timerInterval = setInterval(() => {
        elapsed++;
        state.timeElapsed = elapsed;
      }, 1000);
      return;
    }

    state.timeLeft = Math.max(10, parseInt(el.timerDurationInput.value) || 120);

    state.timeElapsed = 0;

    el.timerBadge.classList.remove("timer-hidden");
    el.timerDisplay.textContent = Utils.formatTime(state.timeLeft);

    state.timerInterval = setInterval(() => {
      state.timeLeft--;
      state.timeElapsed++;

      el.timerDisplay.textContent = Utils.formatTime(state.timeLeft);

      if (state.timeLeft <= 10) el.timerBadge.classList.add("urgent");

      if (state.timeLeft <= 0) {
        clearInterval(state.timerInterval);
        endGame(false, "time");
      }
    }, 1000);
  },
};

//Hint
el.hintBtn.addEventListener("click", () => Hint.use());

const Hint = {
  timer: null,
  seconds: 0,

  use() {
    if (!state.gameActive || el.hintBtn.disabled || state.hintActive) return;

    state.hintActive = true;
    el.hintBtn.disabled = true;

    const unmatched = state.cards.filter((c) => !c.matched);

    unmatched.forEach((c) => {
      c.flipped = true;
      getCardEl(c.id).classList.add("flipped");
    });

    setTimeout(() => {
      unmatched.forEach((c) => {
        if (!c.matched) {
          c.flipped = false;
          getCardEl(c.id).classList.remove("flipped");
        }
      });

      state.flipped = [];
      state.locked = false;
      state.hintActive = false;

      this.cooldown(8);
    }, 1200);
  },

  cooldown(sec) {
    clearInterval(this.timer);

    this.seconds = sec;
    el.hintBtn.disabled = true;
    el.hintCooldownText.textContent = `(${this.seconds}s)`;

    this.timer = setInterval(() => {
      this.seconds--;

      if (this.seconds <= 0) {
        clearInterval(this.timer);
        el.hintBtn.disabled = false;
        el.hintCooldownText.textContent = "";
      } else {
        el.hintCooldownText.textContent = `(${this.seconds}s)`;
      }
    }, 1000);
  },
};

//Restart
el.restartBtn.addEventListener("click", () => {
  clearInterval(Hint.timer);
  el.hintCooldownText.textContent = "";
  if (el.usernameInput.value.trim()) {
    el.overlay.classList.remove("active");
    initGame();
  }
});

el.playAgainBtn.addEventListener("click", () => {
  el.overlay.classList.remove("active");
  setTimeout(initGame, 150);
});

// End game
function endGame(won, reason) {
  state.gameActive = false;
  state.locked = true;
  clearInterval(Hint.timer);
  clearInterval(state.timerInterval);

  el.hintBtn.disabled = true;

  const timeStr = Utils.formatTime(state.timeElapsed);

  el.overlayEmoji.textContent = won ? "🏆" : reason === "time" ? "⏱️" : "💔";
  el.overlayTitle.textContent = won
    ? "You Won!"
    : reason === "time"
      ? "Time's Up!"
      : "Game Over";
  el.overlayTitle.className = "overlay-title " + (won ? "win" : "lose");

  const name = el.usernameInput.value.trim() || "Player";
  if (won) {
    el.overlayMsg.textContent = `Brilliant, ${name}! All pairs found in ${state.moves} moves.`;
  } else if (reason === "time") {
    el.overlayMsg.textContent = `Time ran out, ${name}. ${state.matched / 2} of 8 pairs found.`;
  } else {
    el.overlayMsg.textContent = `Out of retries, ${name}. Better luck next time!`;
  }

  el.ovMoves.textContent = state.moves;
  el.ovMistakes.textContent = state.mistakes;
  el.ovTime.textContent = timeStr;

  el.playAgainBtn.className = "btn-play-again" + (won ? "" : " lose-btn");

  setTimeout(() => el.overlay.classList.add("active"), won ? 600 : 300);
}

//Init on load
usernameHint.classList.remove("hidden");
el.hintBtn.disabled = true;

// Build empty board for preview
const previewVals = Utils.shuffle([
  1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8,
]);

previewVals.forEach((v, i) => {
  const cardEl = document.createElement("div");

  cardEl.className = "card locked";
  cardEl.innerHTML = `
    <div class="card-inner">
      <div class="card-face card-back">
        <svg class="card-back-pattern" viewBox="0 0 40 40" fill="none">
          <rect x="4" y="4" width="32" height="32" rx="4" stroke="white" stroke-width="1.5"/>
          <rect x="10" y="10" width="20" height="20" rx="2" stroke="white" stroke-width="1"/>
          <circle cx="20" cy="20" r="5" stroke="white" stroke-width="1"/>
        </svg>
      </div>
      <div class="card-face card-front">
        <span class="card-number n${v}">${v}</span>
      </div>
    </div>`;

  el.gameBoard.appendChild(cardEl);
});

buildPips();
