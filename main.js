const CONFIG = {
  GAME_TIME: 60,
  FLIP_DELAY: 1000,
};

const GameState = {
  timerStarted: false,
  timeLeft: CONFIG.GAME_TIME,
  clickedCards: [],
  matchedCards: 0,
  isGameOver: false,
};

const GameLogic = {
  generateNumbers() {
    return [...Array(2)].flatMap(() => [1, 2, 3, 4, 5, 6, 7, 8]);
  },

  shuffle(array) {
    return [...array].sort(() => 0.5 - Math.random());
  },

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
  },

  init() {
    this.shuffledNumbers = GameLogic.shuffle(GameLogic.generateNumbers());

    this.elements.cards.forEach((card, index) => {
      card.querySelector(".card-front").textContent =
        this.shuffledNumbers[index];
    });
  },

  startTimer() {
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

  flipCard(card) {
    if (GameState.isGameOver) return;

    if (GameState.clickedCards.includes(card)) return;

    if (GameState.clickedCards.length === 2) return;

    if (!GameState.timerStarted) {
      this.startTimer();
      GameState.timerStarted = true;
    }

    card.classList.add("flipped");
    GameState.clickedCards.push(card);

    if (GameState.clickedCards.length === 2) {
      this.checkMatch();
    }
  },

  checkMatch() {
    const [card1, card2] = GameState.clickedCards;

    if (GameLogic.isMatch(card1, card2)) {
      GameState.matchedCards += 2;
      GameState.clickedCards = [];

      if (GameState.matchedCards === this.elements.cards.length) {
        clearInterval(this.timer);
        this.endGame(true);
      }
    } else {
      setTimeout(() => {
        card1.classList.remove("flipped");
        card2.classList.remove("flipped");
        GameState.clickedCards = [];
      }, CONFIG.FLIP_DELAY);
    }
  },

  endGame(isWin) {
    GameState.isGameOver = true;

    this.elements.gameOverText.textContent = isWin
      ? "🏆 You Win!"
      : "❌ Time Over!";

    this.elements.gameOverText.style.color = isWin ? "#FFD700" : "red";

    this.elements.gameOverContainer.classList.add("show");
  },

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
