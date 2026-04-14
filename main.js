const CONFIG = {
  GAME_TIME: 60,
  FLIP_DELAY: 1000,
};

const GameState = {
  timerStarted: false,
  useTimer: true,

  timeLeft: CONFIG.GAME_TIME,
  clickedCards: [],
  visited: new Set(),
  matchedCards: 0,
  misses: 0,
  isGameOver: false,
  isLocked: false,

  moves: 0,
  mistakes: 0,
  hintUsed: false,

  username: "",
  maxRetries: 10,

  firstCardTimer: null,
};

const GameLogic = {
  /**
   * Generate pairs of numbers for the cards (each number appears twice)
   * @returns {number[]} array of numbers
   */

  generateNumbers() {
    return [...Array(2)].flatMap(() => [1, 2, 3, 4, 5, 6, 7, 8]);
  },

  /**
   * Shuffle array randomly
   * NOTE: This is a simple shuffle, not perfectly random (can be improved)
   * @param {Array} array
   * @returns {Array}
   */

  shuffle(array) {
    return [...array].sort(() => 0.5 - Math.random());
  },

  /**
   * Check if two selected cards match
   * @param {HTMLElement} card1
   * @param {HTMLElement} card2
   * @returns {boolean}
   */

  isMatch(card1, card2) {
    return (
      card1.querySelector(".card-front").textContent ===
      card2.querySelector(".card-front").textContent
    );
  },
};

const GameUI = {
  elements: {
    cards: document.querySelectorAll(".card"),
    timer: document.getElementById("timer"),
    restartBtn: document.getElementById("restart"),
    gameOverContainer: document.getElementById("gameOverContainer"),
    gameOverText: document.querySelector(".gameOver"),

    toggleTimer: document.getElementById("toggleTimer"),
    movesTxt: document.getElementById("moves"),
    mistakesTxt: document.getElementById("mistakes"),
    missesTxt: document.getElementById("misses"),

    hintBtn: document.getElementById("hintBtn"),

    usernameInput: document.getElementById("username"),
    maxRetriesInput: document.getElementById("maxRetries"),
    timerDurationInput: document.getElementById("timerDuration"),
  },

  /**
   * Initialize the game:
   * - Shuffle numbers
   * - Assign values to cards
   * - Setup initial settings (timer, retries)
   */
  init() {
    this.shuffledNumbers = GameLogic.shuffle(GameLogic.generateNumbers());

    this.elements.cards.forEach((card, index) => {
      card.querySelector(".card-front").textContent =
        this.shuffledNumbers[index];
    });

    GameState.username = this.elements.usernameInput.value || "Player";

    GameState.maxRetries = Number(this.elements.maxRetriesInput.value);

    GameState.timeLeft = Number(this.elements.timerDurationInput.value);

    this.elements.toggleTimer.addEventListener("change", (e) => {
      GameState.useTimer = e.target.checked;

      this.elements.timer.style.display = GameState.useTimer ? "block" : "none";
    });
  },

  /**
   * Starts countdown timer if enabled
   * Ends the game when time reaches zero
   */
  startTimer() {
    if (!GameState.useTimer) return;

    this.timer = setInterval(() => {
      GameState.timeLeft--;

      const min = Math.floor(GameState.timeLeft / 60);
      const sec = GameState.timeLeft % 60;

      this.elements.timer.textContent = `Time left: ${min}:${
        sec < 10 ? "0" : ""
      }${sec}`;

      if (GameState.timeLeft <= 0) {
        clearInterval(this.timer);
        this.endGame(false);
      }
    }, 1000);
  },

  /**
   * Handles user card selection
   * Controls:
   * - Validation (username, game state)
   * - First/second card logic
   * - Timer start
   * - Auto reset if second card not selected
   * @param {HTMLElement} card
   */
  flipCard(card) {
    const username = this.elements.usernameInput.value.trim();

    // Prevent playing without username
    if (!username) {
      alert("Please enter your name first!");
      return;
    }
    GameState.username = username;
    // Always sync max retries with user input
    GameState.maxRetries = Number(this.elements.maxRetriesInput.value);
    // Prevent invalid interactions
    if (GameState.isLocked) return;
    if (GameState.isGameOver) return;
    if (GameState.clickedCards.includes(card)) return;
    if (GameState.clickedCards.length === 2) return;

    // Start timer on first move only
    if (!GameState.timerStarted) {
      this.startTimer();
      GameState.timerStarted = true;
    }

    // If only one card is selected, start timeout (10s)
    card.classList.add("flipped");

    GameState.clickedCards.push(card);
    if (GameState.clickedCards.length === 1) {
      GameState.firstCardTimer = setTimeout(() => {
        if (GameState.clickedCards.length === 1) {
          card.classList.remove("flipped");
          GameState.clickedCards = [];
        }
      }, 10000);
    }

    // If user selects second card, cancel timeout and check match
    if (GameState.clickedCards.length === 2) {
      clearTimeout(GameState.firstCardTimer);
      this.checkMatch();
    }
  },

  /**
   * Compares two selected cards
   * Updates:
   * - moves
   * - misses (memory logic)
   * - mistakes (wrong attempts)
   * - matched cards
   * Handles win/lose conditions
   */
  checkMatch() {
    // Destructure the two selected cards for easier handling
    const [card1, card2] = GameState.clickedCards;

    // Extract card values (numbers) for comparison and tracking
    const value1 = card1.querySelector(".card-front").textContent;
    const value2 = card2.querySelector(".card-front").textContent;

    // MISS TRACKING (Memory Logic)
    // If player has already seen one of these values before,
    // and still failed to match them → count as "miss"
    if (GameState.visited.has(value1) || GameState.visited.has(value2)) {
      GameState.misses++;
      this.elements.missesTxt.textContent = `misses: ${GameState.misses}`;
    } else {
      // First time seeing these values → store them in memory
      GameState.visited.add(value1);
      GameState.visited.add(value2);
    }

    // MOVE TRACKING
    // A move is counted only after selecting 2 cards
    GameState.moves++;
    this.elements.movesTxt.textContent = `Moves: ${GameState.moves}`;

    // MATCH CHECK
    if (GameLogic.isMatch(card1, card2)) {
      // Mark both cards as matched (won state)
      card1.classList.add("matched");
      card2.classList.add("matched");

      // Update matched cards count
      GameState.matchedCards += 2;

      // Reset current selection
      GameState.clickedCards = [];
      GameState.isLocked = false;

      // WIN CONDITION
      // If all cards are matched → player wins
      if (GameState.matchedCards === this.elements.cards.length) {
        clearInterval(this.timer);
        this.endGame(true);
      }
    } else {
      // WRONG MATCH (Mistake)
      GameState.mistakes++;
      this.elements.mistakesTxt.textContent = `mistakes: ${GameState.mistakes}`;

      // LOSE CONDITION (Max Retries)
      // If mistakes exceed allowed retries → player loses
      if (GameState.mistakes >= GameState.maxRetries) {
        GameState.isGameOver = true;
        clearInterval(this.timer);

        this.endGame(false);
        return;
      }

      // Safety check: stop execution if game already ended
      if (GameState.isGameOver) return;

      // RESET CARDS (after delay)
      // Flip cards back after short delay to allow user to see them
      setTimeout(() => {
        card1.classList.remove("flipped");
        card2.classList.remove("flipped");

        GameState.clickedCards = [];
        GameState.isLocked = false;
      }, CONFIG.FLIP_DELAY);
    }
  },

  /**
   * Ends the game and displays result @param {boolean} isWin
   */
  endGame(isWin) {
    GameState.isGameOver = true;
    const name = GameState.username || "Player";

    this.elements.gameOverText.textContent = isWin
      ? `🏆 Congratulations ${name}`
      : `❌ You lost the game. Try again ${name}!`;

    this.elements.gameOverText.style.color = isWin ? "#FFD700" : "red";
    this.elements.gameOverContainer.classList.add("show");
  },

  /**
   * Reveals all cards for 3 seconds (one-time use)
   * Locks interaction during hint
   */
  useHint() {
    if (GameState.hintUsed || GameState.isGameOver) return;

    GameState.hintUsed = true;
    GameState.isLocked = true;
    document.querySelector(".hintBtn").textContent = "Hint Used";
    document.querySelector(".hintBtn").classList.add("disabled");
    this.elements.cards.forEach((card) => {
      card.classList.add("flipped");
    });

    setTimeout(() => {
      this.elements.cards.forEach((card) => {
        if (!card.classList.contains("matched")) {
          card.classList.remove("flipped");
        }
      });

      GameState.isLocked = false;
    }, 3000);

    this.elements.hintBtn.disabled = true;
  },

  // Reloads the game (full reset)
  restart() {
    location.reload();
  },
};

GameUI.elements.cards.forEach((card) => {
  card.addEventListener("click", () => GameUI.flipCard(card));
});

GameUI.elements.restartBtn.addEventListener("click", () => {
  GameUI.restart();
});

GameUI.init();
