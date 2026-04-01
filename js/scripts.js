// ===== Helper: Filter Pokémon by selected gens =====
function getFilteredPokemonList() {
  const list = state.pokemonData;

  if (!state.selectedGens || state.selectedGens.length === 0) {
    return list;
  }

  // Map region names to generation numbers
  const genNameToNumber = {
    Kanto: 1,
    Johto: 2,
    Hoenn: 3,
    Sinnoh: 4,
    Unova: 5,
    Kalos: 6,
    Alola: 7,
    Galar: 8,
  };

  // National Dex ID ranges by generation number
  const genRanges = {
    1: [1, 151],
    2: [152, 251],
    3: [252, 386],
    4: [387, 493],
    5: [494, 649],
    6: [650, 721],
    7: [722, 809],
    8: [810, 898],
  };

  return list.filter((p) => {
    if (!p.id) return true;

    return state.selectedGens.some((genName) => {
      const genNumber = genNameToNumber[genName];
      const range = genRanges[genNumber];
      if (!range) return false;
      return p.id >= range[0] && p.id <= range[1];
    });
  });
}

function getAbilitiesFromFilteredPokemon() {
  const pokemonList = getFilteredPokemonList();

  const abilitySet = new Set();

  pokemonList.forEach((p) => {
    const normal = p.abilities?.normal || [];
    const hidden = p.abilities?.hidden || [];

    normal.forEach((a) => abilitySet.add(a));
    hidden.forEach((a) => abilitySet.add(a));
  });

  const genNameToNumber = {
    Kanto: 1,
    Johto: 2,
    Hoenn: 3,
    Sinnoh: 4,
    Unova: 5,
    Kalos: 6,
    Alola: 7,
    Galar: 8,
  };

  const selectedGenNumbers = state.selectedGens.map((g) => genNameToNumber[g]);

  return state.abilitiesData.filter((ability) => {
    // must belong to filtered Pokémon
    if (!abilitySet.has(ability.name)) return false;

    // must belong to selected generation
    if (!ability.gen || ability.gen.length === 0) return true;

    return ability.gen.some((g) => selectedGenNumbers.includes(Number(g)));
  });
}

// ===== App State =====
const state = {
  screen: "menu", // menu | options | quiz | result
  mode: "ability_mc",
  totalQuestions: 25,
  selectedGens: ["Hoenn"],
  questionIndex: 0,
  score: 0,
  currentQuestion: null,
  answered: false,
  pokemonData: [],
  abilitiesData: [],
  dataReady: false,
};

// ===== TEMP TEST QUESTION (MC) =====
const testQuestionMC = {
  type: "mc",
  question: "What does Levitate do?",
  answers: [
    "Immune to Ground",
    "Boost Speed",
    "Heal over time",
    "Increase Attack",
  ],
  correct: "Immune to Ground",
};

async function loadData() {
  try {
    const [pokemonRes, abilitiesRes] = await Promise.all([
      fetch("/data/pokemon.json"),
      fetch("/data/abilities.json"),
    ]);

    const [pokemon, abilities] = await Promise.all([
      pokemonRes.json(),
      abilitiesRes.json(),
    ]);

    state.pokemonData = pokemon;
    state.abilitiesData = abilities;
    state.dataReady = true;

    console.log("Data loaded:", {
      pokemon: state.pokemonData.length,
      // abilities: state.abilitiesData.length,
    });
  } catch (err) {
    console.error("Failed to load data", err);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadData();
  // ===== LOAD SAVED SETTINGS =====
  const savedSettings = JSON.parse(localStorage.getItem("quizSettings"));
  if (savedSettings) {
    state.mode = savedSettings.mode || state.mode;
    state.totalQuestions = savedSettings.totalQuestions || state.totalQuestions;
    state.selectedGens = savedSettings.selectedGens || state.selectedGens;
  }

  const ui = {
    screens: {
      menu: document.getElementById("menu-screen"),
      options: document.getElementById("options-screen"),
      quiz: document.getElementById("quiz-screen"),
      result: document.getElementById("result-screen"),
    },
    startBtn: document.getElementById("start-btn"),
    optionsBtn: document.getElementById("options-btn"),
    backBtn: document.getElementById("back-btn"),
    startGameBtn: document.getElementById("start-game-btn"),
    nextBtn: document.getElementById("next-btn"),
    modeOptions: document.querySelectorAll("#mode-options .icon-btn"),
    menuSubtitle: document.querySelectorAll(".menu-subtitle"),
    difficultyOptions: document.querySelectorAll(
      "#difficulty-options .icon-btn",
    ),
    genOptions: document.querySelectorAll("#gen-options .gen-btn"),
    modeDescription: document.getElementById("mode-description"),
    quizMeta: document.getElementById("quiz-meta"),
    quizQuestion: document.getElementById("quiz-question"),
    quizAnswers: document.getElementById("quiz-answers"),
    quizInput: document.getElementById("quiz-input"),
    quizResult: document.getElementById("quiz-result"),
  };

  const modeContent = {
    ability_mc: {
      title: "Ability Mastery - Multiple Choice",
      description:
        "Choose the correct effect from multiple options and test how well you understand Pokemon mechanics.\n\nPerfect for learning how abilities influence battles and strategy.",
    },
    description_mc: {
      title: "Ability Detective - Multiple Choice",
      description:
        "Read an ability description and figure out which ability it belongs to.\n\nA great mode for improving recognition and memory.",
    },
    pokemon_abilities_mc: {
      title: "Pokemon Knowledge - Multiple Choice",
      description:
        "A Pokemon appears and you must identify which abilities it can have.\n\nPerfect for learning sets, hidden abilities, and Pokemon identity.",
    },
    typing_mc: {
      title: "Type Expert - Multiple Choice",
      description:
        "Study the Pokemon in front of you and identify its typing correctly.\n\nA clean way to sharpen your type knowledge.",
    },
    description_input: {
      title: "Ability Recall - Input Type",
      description:
        "No multiple choice here: type the correct ability from memory.\n\nThis mode is all about recall and precision.",
    },
    pokemon_abilities_input: {
      title: "Ability Puzzle - Input Type",
      description:
        "One part of the answer is missing and you must fill in the blank.\n\nA fun mode for practicing partial recall.",
    },
    weakness_mc: {
      title: "Battle Master - Multiple Choice",
      description:
        "Choose the best attack type against the Pokemon shown.\n\nThis mode trains real battle instincts and matchup knowledge.",
    },
  };

  function saveSettings() {
    localStorage.setItem(
      "quizSettings",
      JSON.stringify({
        mode: state.mode,
        totalQuestions: state.totalQuestions,
        selectedGens: state.selectedGens,
      }),
    );
  }

  const typeToBackground = {
    Normal: "normal",
    Fire: "fire",
    Water: "water",
    Electric: "electric",
    Grass: "grass",
    Ice: "ice",
    Fighting: "fighting",
    Poison: "poison",
    Ground: "ground",
    Flying: "flying",
    Psychic: "psychic",
    Bug: "bug",
    Rock: "rock",
    Ghost: "ghost",
    Dragon: "dragon",
    Dark: "dark",
    Steel: "steel",
    Fairy: "fairy",
  };

  function getPokemonBackground(pokemon) {
    if (!pokemon || !pokemon.types || pokemon.types.length === 0) {
      return null;
    }

    // Use primary type (first type)
    const primaryType = pokemon.types[0];

    const bgName = typeToBackground[primaryType];

    if (!bgName) return null;

    return `/assets/backgrounds/${bgName}.jpeg`;
  }

  // ===== Helper functions for ability lookup =====

  function formatBattleAnswer(type, defenderTypes) {
    const value = getEffectiveness(type, defenderTypes);

    let label = "1x";

    if (value >= 2) label = `${value}x effective`;
    else if (value === 1) label = "1x";
    else if (value === 0) label = "0x";
    else label = "0.5x";

    return `${type} - ${label}`;
  }

  function getTypingEffectivenessLabel(typeCombo, defenderTypes) {
    const types = typeCombo.split(" / ");
    let best = 0;

    types.forEach((t) => {
      const value = getEffectiveness(t, defenderTypes);
      if (value > best) best = value;
    });

    if (best >= 2) return `${best}x`;
    if (best === 1) return "1x";
    if (best === 0) return "0x";
    return "0.5x";
  }

  function findAbilityByDescription(desc) {
    // return state.abilitiesData.find((a) => a.description === desc);
  }

  function findAbilityByName(name) {
    // return state.abilitiesData.find((a) => a.name === name);
  }

  function handleAnswerClick(selectedAnswer) {
    if (state.currentQuestion.type === "mc-multi") {
      handleMultiAnswerClick(selectedAnswer);
      return;
    }

    if (state.answered) return;
    state.answered = true;

    const correctAnswer = state.currentQuestion.correct;
    const buttons = document.querySelectorAll(".answer-btn");

    buttons.forEach((btn) => {
      const text = btn.dataset.value || btn.textContent;

      if (text === correctAnswer) {
        btn.classList.add("correct");
      }

      if (text === selectedAnswer && text !== correctAnswer) {
        btn.classList.add("wrong");
      }

      btn.disabled = true;
    });

    // RESULT BOX
    if (ui.quizResult) {
      const isCorrect = selectedAnswer === correctAnswer;
      if (isCorrect) state.score++;

      let yourAnswerText = selectedAnswer;
      let correctAnswerText = correctAnswer;

      if (state.mode === "weakness_mc") {
        const list = getFilteredPokemonList();
        const pokemon = list.find(
          (p) => p.name === state.currentQuestion.question,
        );

        if (pokemon) {
          yourAnswerText = formatBattleAnswer(selectedAnswer, pokemon.types);
          correctAnswerText = formatBattleAnswer(correctAnswer, pokemon.types);
        }
      }

      // Ability → Description mode
      if (state.mode === "ability_mc") {
        const selected = findAbilityByDescription(selectedAnswer);
        const correct = findAbilityByDescription(correctAnswer);

        if (selected) {
          yourAnswerText = `${selected.name} - ${selected.description}`;
        }

        if (correct) {
          correctAnswerText = `${correct.name} - ${correct.description}`;
        }
      }

      // Description → Ability mode
      if (state.mode === "description_mc") {
        const selected = findAbilityByName(selectedAnswer);
        const correct = findAbilityByName(correctAnswer);

        if (selected) {
          yourAnswerText = `${selected.name} - ${selected.description}`;
        }

        if (correct) {
          correctAnswerText = `${correct.name} - ${correct.description}`;
        }
      }

      ui.quizResult.innerHTML = `
        <div class="result-box ${isCorrect ? "correct" : "wrong"}">
          <h3 class="result-title">${isCorrect ? "Correct!" : "Wrong!"}</h3>
          <p><strong>Your answer:</strong> ${yourAnswerText}</p>
          <p><strong>Correct answer:</strong> ${correctAnswerText}</p>
        </div>
      `;
    }

    // SHOW NEXT BUTTON
    if (ui.nextBtn) {
      ui.nextBtn.style.display = "block";
    }
  }

  function handleMultiAnswerClick(selectedAnswer) {
    if (!state.selectedAnswers) {
      state.selectedAnswers = [];
    }

    if (state.selectedAnswers.includes(selectedAnswer)) {
      state.selectedAnswers = state.selectedAnswers.filter(
        (a) => a !== selectedAnswer,
      );
    } else {
      state.selectedAnswers.push(selectedAnswer);
    }

    // toggle UI
    const buttons = document.querySelectorAll(".answer-btn");

    buttons.forEach((btn) => {
      if (state.selectedAnswers.includes(btn.textContent)) {
        btn.classList.add("selected");
      } else {
        btn.classList.remove("selected");
      }
    });

    const correctAnswers = state.currentQuestion.correct;

    // auto-check when enough selected
    if (state.selectedAnswers.length === correctAnswers.length) {
      state.answered = true;

      const isCorrect =
        correctAnswers.every((a) => state.selectedAnswers.includes(a)) &&
        state.selectedAnswers.length === correctAnswers.length;

      if (isCorrect) state.score++;

      buttons.forEach((btn) => {
        const text = btn.textContent;

        if (correctAnswers.includes(text)) {
          btn.classList.add("correct");
        } else if (state.selectedAnswers.includes(text)) {
          btn.classList.add("wrong");
        }

        btn.disabled = true;
      });

      // result UI
      if (ui.quizResult) {
        // Format answers with descriptions
        const formatAbility = (name) => {
          const ability = findAbilityByName(name);
          return ability ? `${ability.name} - ${ability.description}` : name;
        };

        const formattedSelected = state.selectedAnswers
          .map(formatAbility)
          .join("<br>");
        const formattedCorrect = correctAnswers.map(formatAbility).join("<br>");

        ui.quizResult.innerHTML = `
          <div class="result-box ${isCorrect ? "correct" : "wrong"}">
            <h3>${isCorrect ? "Correct!" : "Wrong!"}</h3>
            <p><strong>Your answers:</strong><br>${formattedSelected}</p>
            <p><strong>Correct answers:</strong><br>${formattedCorrect}</p>
          </div>
        `;
      }

      if (ui.nextBtn) {
        ui.nextBtn.style.display = "block";
      }
    }
  }

  function showScreen(screenName) {
    Object.entries(ui.screens).forEach(([name, element]) => {
      if (!element) return;
      element.classList.toggle("active", name === screenName);
    });
  }

  function renderOptionsScreen() {
    ui.modeOptions.forEach((button) => {
      const isActive = button.dataset.mode === state.mode;
      button.classList.toggle("active", isActive);
    });

    ui.difficultyOptions.forEach((button) => {
      const value = Number(button.dataset.value);
      button.classList.toggle("active", value === state.totalQuestions);
    });

    const isAbilityMode =
      state.mode === "ability_mc" || state.mode === "description_mc";

    ui.genOptions.forEach((button) => {
      const genName = button.textContent.trim();

      const shouldDisable =
        isAbilityMode && (genName === "Kanto" || genName === "Johto");

      button.disabled = shouldDisable;
      button.classList.toggle("disabled", shouldDisable);

      // Remove from selected gens if disabled
      if (shouldDisable && state.selectedGens.includes(genName)) {
        state.selectedGens = state.selectedGens.filter((g) => g !== genName);
      }

      button.classList.toggle("active", state.selectedGens.includes(genName));
    });

    const currentMode = modeContent[state.mode];
    if (currentMode && ui.modeDescription) {
      ui.modeDescription.innerHTML =
        `<strong>${currentMode.title}</strong><br>` +
        currentMode.description.replace(/\n\n/g, "<br><br>");
    }
  }

  const typeChart = {
    Normal: {
      strong: [],
      weak: ["Rock", "Steel"],
      immune: ["Ghost"],
    },
    Fire: {
      strong: ["Grass", "Ice", "Bug", "Steel"],
      weak: ["Fire", "Water", "Rock", "Dragon"],
      immune: [],
    },
    Water: {
      strong: ["Fire", "Ground", "Rock"],
      weak: ["Water", "Grass", "Dragon"],
      immune: [],
    },
    Electric: {
      strong: ["Water", "Flying"],
      weak: ["Electric", "Grass", "Dragon"],
      immune: ["Ground"],
    },
    Grass: {
      strong: ["Water", "Ground", "Rock"],
      weak: ["Fire", "Grass", "Poison", "Flying", "Bug", "Dragon", "Steel"],
      immune: [],
    },
    Ice: {
      strong: ["Grass", "Ground", "Flying", "Dragon"],
      weak: ["Fire", "Water", "Ice", "Steel"],
      immune: [],
    },
    Fighting: {
      strong: ["Normal", "Ice", "Rock", "Dark", "Steel"],
      weak: ["Poison", "Flying", "Psychic", "Bug", "Fairy"],
      immune: ["Ghost"],
    },
    Poison: {
      strong: ["Grass", "Fairy"],
      weak: ["Poison", "Ground", "Rock", "Ghost"],
      immune: ["Steel"],
    },
    Ground: {
      strong: ["Fire", "Electric", "Poison", "Rock", "Steel"],
      weak: ["Grass", "Bug"],
      immune: ["Flying"],
    },
    Flying: {
      strong: ["Grass", "Fighting", "Bug"],
      weak: ["Electric", "Rock", "Steel"],
      immune: [],
    },
    Psychic: {
      strong: ["Fighting", "Poison"],
      weak: ["Psychic", "Steel"],
      immune: ["Dark"],
    },
    Bug: {
      strong: ["Grass", "Psychic", "Dark"],
      weak: ["Fire", "Fighting", "Poison", "Flying", "Ghost", "Steel", "Fairy"],
      immune: [],
    },
    Rock: {
      strong: ["Fire", "Ice", "Flying", "Bug"],
      weak: ["Fighting", "Ground", "Steel"],
      immune: [],
    },
    Ghost: {
      strong: ["Psychic", "Ghost"],
      weak: ["Dark"],
      immune: ["Normal"],
    },
    Dragon: {
      strong: ["Dragon"],
      weak: ["Steel"],
      immune: ["Fairy"],
    },
    Dark: {
      strong: ["Psychic", "Ghost"],
      weak: ["Fighting", "Dark", "Fairy"],
      immune: [],
    },
    Steel: {
      strong: ["Ice", "Rock", "Fairy"],
      weak: ["Fire", "Water", "Electric", "Steel"],
      immune: [],
    },
    Fairy: {
      strong: ["Fighting", "Dragon", "Dark"],
      weak: ["Fire", "Poison", "Steel"],
      immune: [],
    },
  };

  function getEffectiveness(attackType, defenderTypes) {
    let multiplier = 1;

    defenderTypes.forEach((defType) => {
      const entry = typeChart[attackType];
      if (!entry) return;

      if (entry.immune.includes(defType)) {
        multiplier *= 0;
      } else if (entry.strong.includes(defType)) {
        multiplier *= 2;
      } else if (entry.weak.includes(defType)) {
        multiplier *= 0.5;
      }
    });

    return multiplier;
  }

  function generateAbilityMCQuestion() {
    const abilities = getAbilitiesFromFilteredPokemon();

    // 1. Pick random correct ability
    const correctAbility =
      abilities[Math.floor(Math.random() * abilities.length)];

    const correctAnswer = correctAbility.description;

    // 2. Get 3 random wrong answers
    const wrongAnswers = [];

    while (wrongAnswers.length < 3) {
      const randomAbility =
        abilities[Math.floor(Math.random() * abilities.length)];

      if (
        randomAbility.description !== correctAnswer &&
        !wrongAnswers.includes(randomAbility.description)
      ) {
        wrongAnswers.push(randomAbility.description);
      }
    }

    // 3. Combine + shuffle
    const answers = [correctAnswer, ...wrongAnswers].sort(
      () => Math.random() - 0.5,
    );

    return {
      type: "mc",
      question: correctAbility.name,
      answers: answers,
      correct: correctAnswer,
    };
  }

  function generateDescriptionMCQuestion() {
    const abilities = getAbilitiesFromFilteredPokemon();

    // 1. Pick correct ability
    const correctAbility =
      abilities[Math.floor(Math.random() * abilities.length)];

    const correctAnswer = correctAbility.name;

    // 2. Get wrong answers
    const wrongAnswers = [];

    while (wrongAnswers.length < 3) {
      const randomAbility =
        abilities[Math.floor(Math.random() * abilities.length)];

      if (
        randomAbility.name !== correctAnswer &&
        !wrongAnswers.includes(randomAbility.name)
      ) {
        wrongAnswers.push(randomAbility.name);
      }
    }

    // 3. Combine + shuffle
    const answers = [correctAnswer, ...wrongAnswers].sort(
      () => Math.random() - 0.5,
    );

    return {
      type: "mc",
      question: correctAbility.description,
      answers: answers,
      correct: correctAnswer,
    };
  }

  function generateTypingMCQuestion() {
    // const pokemonList = state.pokemonData;
    const pokemonList = getFilteredPokemonList();

    // 1. Pick random Pokémon
    const pokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)];

    const correctTypes = pokemon.types.join(" / ");

    // 2. Generate wrong answers
    const wrongAnswers = [];

    while (wrongAnswers.length < 5) {
      const randomPokemon =
        pokemonList[Math.floor(Math.random() * pokemonList.length)];

      const typeCombo = randomPokemon.types.join(" / ");

      if (typeCombo !== correctTypes && !wrongAnswers.includes(typeCombo)) {
        wrongAnswers.push(typeCombo);
      }
    }

    // 3. Combine + shuffle (6 answers total)
    const answers = [correctTypes, ...wrongAnswers]
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);

    return {
      type: "mc",
      question: pokemon.name,
      answers: answers,
      correct: correctTypes,
    };
  }

  function generatePokemonAbilitiesMCQuestion() {
    const pokemonList = getFilteredPokemonList();
    // Do NOT filter abilities by generation; use all abilities
    const abilitiesList = getAbilitiesFromFilteredPokemon();

    const pokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)];

    // Safety guard: If something goes wrong, return test question
    if (!pokemon) {
      return testQuestionMC;
    }

    const normal = pokemon.abilities?.normal || [];
    const hidden = pokemon.abilities?.hidden || [];

    let correctAnswers = [...normal, ...hidden].filter(Boolean);

    // --- STRICT GEN FILTER FOR CORRECT ANSWERS ---
    const genNameToNumber = {
      Kanto: 1,
      Johto: 2,
      Hoenn: 3,
      Sinnoh: 4,
      Unova: 5,
      Kalos: 6,
      Alola: 7,
      Galar: 8,
    };

    const selectedGenNumbers = state.selectedGens.map(
      (g) => genNameToNumber[g],
    );

    // correctAnswers = correctAnswers.filter((name) => {
    //   const ability = state.abilitiesData.find((a) => a.name === name);
    //   if (!ability) return false;

    //   if (!ability.gen || ability.gen.length === 0) return true;

    //   return ability.gen.some((g) => selectedGenNumbers.includes(Number(g)));
    // });

    correctAnswers = correctAnswers.filter((name) => {
      const ability = state.abilitiesData.find((a) => a.name === name);
      if (!ability) return false;

      const isHidden = hidden.includes(name);

      // ALWAYS allow hidden abilities
      if (isHidden) return true;

      // Only filter normal abilities by gen
      if (!ability.gen || ability.gen.length === 0) return true;

      return ability.gen.some((g) => selectedGenNumbers.includes(Number(g)));
    });

    // fallback: if everything got filtered out, use original list
    if (correctAnswers.length === 0) {
      correctAnswers = [...normal, ...hidden].filter(Boolean);
    }

    // limit max answers (for UX)
    const limitedCorrect = correctAnswers.slice(0, 4);

    // generate wrong answers
    const wrongAnswers = [];

    while (wrongAnswers.length < 6) {
      const randomAbility =
        abilitiesList[Math.floor(Math.random() * abilitiesList.length)].name;

      if (
        !limitedCorrect.includes(randomAbility) &&
        !wrongAnswers.includes(randomAbility)
      ) {
        wrongAnswers.push(randomAbility);
      }
    }

    // Ensure all correct answers are included first
    let answers = [...limitedCorrect];

    // Fill remaining slots with wrong answers
    const shuffledWrong = wrongAnswers.sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffledWrong.length && answers.length < 6; i++) {
      answers.push(shuffledWrong[i]);
    }

    // Final shuffle
    answers = answers.sort(() => Math.random() - 0.5);

    return {
      type: "mc-multi", // 👈 important
      pokemon,
      question: pokemon.name,
      answers,
      correct: limitedCorrect,
    };
  }

  function generateWeaknessMCQuestion() {
    const pokemonList = getFilteredPokemonList();

    const pokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)];

    const defenderTypes = pokemon.types;
    const allTypes = Object.keys(typeChart);

    const superEffective = [];
    const neutral = [];
    const notEffective = [];

    allTypes.forEach((type) => {
      const value = getEffectiveness(type, defenderTypes);

      if (value >= 2) superEffective.push(type);
      else if (value === 1) neutral.push(type);
      else notEffective.push(type); // includes 0.5 and 0
    });

    // --- Pick correct ---
    let correctAnswer;

    if (superEffective.length > 0) {
      correctAnswer =
        superEffective[Math.floor(Math.random() * superEffective.length)];
    } else {
      // fallback if no 2x exists
      correctAnswer = neutral[Math.floor(Math.random() * neutral.length)];
    }

    // --- Build pool ---
    let answers = [correctAnswer];

    // 3 neutral
    const shuffledNeutral = neutral
      .filter((t) => t !== correctAnswer)
      .sort(() => Math.random() - 0.5);

    answers.push(...shuffledNeutral.slice(0, 3));

    // 2 not effective
    const shuffledNotEffective = notEffective
      .filter((t) => !answers.includes(t))
      .sort(() => Math.random() - 0.5);

    answers.push(...shuffledNotEffective.slice(0, 2));

    // Fill up to 6 if we are short (edge cases)
    const filler = allTypes
      .filter((t) => !answers.includes(t))
      .sort(() => Math.random() - 0.5);

    while (answers.length < 6 && filler.length > 0) {
      answers.push(filler.pop());
    }

    const finalAnswers = answers.slice(0, 6);

    return {
      type: "mc",
      question: pokemon.name,
      answers: finalAnswers.sort(() => Math.random() - 0.5),
      correct: correctAnswer,
    };
  }

  function renderQuizScreen() {
    state.selectedAnswers = [];
    state.answered = false;

    const isMC = state.mode.includes("_mc");
    const isInput = state.mode.includes("_input");

    // RESET RESULT EARLY
    if (ui.quizResult) {
      ui.quizResult.innerHTML = "";
    }

    // META
    if (ui.quizMeta) {
      const modeTitle = modeContent[state.mode]?.title || state.mode;
      ui.quizMeta.textContent =
        `Score: ${state.score} | ` +
        `Question: ${state.questionIndex + 1}/${state.totalQuestions} | ` +
        `Mode: ${modeTitle} | ` +
        `Gens: ${state.selectedGens.join(", ")}`;
    }

    // QUESTION
    if (state.mode === "ability_mc") {
      state.currentQuestion = generateAbilityMCQuestion();
    } else if (state.mode === "description_mc") {
      state.currentQuestion = generateDescriptionMCQuestion();
    } else if (state.mode === "typing_mc") {
      state.currentQuestion = generateTypingMCQuestion();
    } else if (state.mode === "pokemon_abilities_mc") {
      state.currentQuestion = generatePokemonAbilitiesMCQuestion();
    } else if (state.mode === "weakness_mc") {
      state.currentQuestion = generateWeaknessMCQuestion();
    } else {
      // Temporary fallback for modes not implemented yet
      state.currentQuestion = testQuestionMC;
    }

    if (ui.quizQuestion) {
      if (state.mode === "typing_mc") {
        const pokemonName = state.currentQuestion.question;

        ui.quizQuestion.textContent = `${pokemonName} — What is its typing?`;

        const pokemonDisplay = document.getElementById("pokemon-display");
        const pokemonImage = document.getElementById("quiz-pokemon-image");

        const list = getFilteredPokemonList();
        const pokemon = list.find((p) => p.name === pokemonName);

        if (pokemonDisplay) {
          pokemonDisplay.style.display = "flex";
        }

        if (pokemon && pokemonImage && pokemonDisplay) {
          pokemonImage.style.display = "block";
          pokemonImage.src = pokemon.sprite;

          const bg = getPokemonBackground(pokemon);
          if (bg) {
            pokemonDisplay.style.backgroundImage = `url(${bg})`;
          }
        }
      } else if (state.mode === "pokemon_abilities_mc") {
        const pokemon = state.currentQuestion.pokemon;

        const correct = state.currentQuestion.correct;

        const total = correct.length;

        // Count normal vs hidden AFTER filtering
        let normalCount = 0;
        let hiddenCount = 0;

        const originalNormal = pokemon.abilities?.normal || [];
        const originalHidden = pokemon.abilities?.hidden || [];

        correct.forEach((ability) => {
          if (originalNormal.includes(ability)) normalCount++;
          if (originalHidden.includes(ability)) hiddenCount++;
        });

        ui.quizQuestion.textContent = `${pokemon.name} - Select ${total} abilities (${normalCount} normal${hiddenCount ? ` + ${hiddenCount} hidden` : ""})`;
        const pokemonDisplay = document.getElementById("pokemon-display");
        const pokemonImage = document.getElementById("quiz-pokemon-image");

        if (pokemonImage && pokemonDisplay) {
          pokemonImage.style.display = "block";
          pokemonImage.src = pokemon.sprite;

          const bg = getPokemonBackground(pokemon);

          if (bg) {
            pokemonDisplay.style.backgroundImage = `url(${bg})`;
          }
        }
      } else if (state.mode === "weakness_mc") {
        const pokemonName = state.currentQuestion.question;

        ui.quizQuestion.textContent = `${pokemonName} — Which move is super effective?`;

        const pokemonDisplay = document.getElementById("pokemon-display");
        const pokemonImage = document.getElementById("quiz-pokemon-image");

        const list = getFilteredPokemonList();
        const pokemon = list.find((p) => p.name === pokemonName);

        if (pokemonDisplay) {
          pokemonDisplay.style.display = "flex";
        }

        if (pokemon && pokemonImage && pokemonDisplay) {
          pokemonImage.style.display = "block";
          pokemonImage.src = pokemon.sprite;

          const bg = getPokemonBackground(pokemon);
          if (bg) {
            pokemonDisplay.style.backgroundImage = `url(${bg})`;
          }
        }
      } else {
        ui.quizQuestion.textContent = state.currentQuestion.question;
      }
    }

    // Hide intro image always during quiz
    const quizImage = document.getElementById("quiz-image");
    if (quizImage) {
      quizImage.style.display = "none";
    }

    // Handle pokemon display container visibility
    const pokemonDisplay = document.getElementById("pokemon-display");
    const pokemonImage = document.getElementById("quiz-pokemon-image");

    if (pokemonDisplay) {
      if (
        state.mode === "pokemon_abilities_mc" ||
        state.mode === "typing_mc" ||
        state.mode === "weakness_mc"
      ) {
        pokemonDisplay.style.display = "flex";
      } else {
        pokemonDisplay.style.display = "none";
      }
    }

    // Also hide image if not in these modes
    if (
      pokemonImage &&
      state.mode !== "pokemon_abilities_mc" &&
      state.mode !== "typing_mc" &&
      state.mode !== "weakness_mc"
    ) {
      pokemonImage.style.display = "none";
    }

    // MULTIPLE CHOICE
    if (ui.quizAnswers) {
      ui.quizAnswers.innerHTML = "";
      ui.quizAnswers.style.display = isMC ? "grid" : "none";

      if (isMC) {
        state.currentQuestion.answers.forEach((answer) => {
          const button = document.createElement("button");
          button.className = "answer-btn";
          button.textContent = answer;

          button.addEventListener("click", () => {
            handleAnswerClick(answer);
          });

          ui.quizAnswers.appendChild(button);
        });
      }
    }

    // INPUT MODE
    const inputContainer = document.getElementById("quiz-input-container");
    if (inputContainer) {
      inputContainer.style.display = isInput ? "block" : "none";
    }

    if (ui.quizInput && isInput) {
      ui.quizInput.value = "";
    }

    // NEXT BUTTON
    if (ui.nextBtn) {
      ui.nextBtn.style.display = "none";
    }
  }

  function nextQuestion() {
    state.questionIndex++;

    if (state.questionIndex >= state.totalQuestions) {
      state.screen = "result";
      render();
      return;
    }

    // For now reuse the same test question (later replace with generator)
    renderQuizScreen();
  }

  function renderResultScreen() {
    if (ui.screens.result) {
      ui.screens.result.innerHTML = `
  <div class="menu-card result-card">
    <h1 class="menu-title">Quiz finished!</h1>

    <div class="result-panel">
    <h3 class="result-overview">Overview:</h3>
      <div class="result-inner">
        <p>Mode: ${modeContent[state.mode]?.title || state.mode}</p>
        <p>Questions: ${state.totalQuestions}</p>
        <p>Gens: ${state.selectedGens.join(" - ")}</p>
        <p>Score: ${state.score}</p>
      </div>
    </div>

    <div class="result-actions">
      <button id="result-menu-btn" class="btn secondary">Back</button>
      <button id="play-again-btn" class="btn primary">Restart Quiz</button>
    </div>
  </div>
`;
      const playAgainBtn = document.getElementById("play-again-btn");
      const resultMenuBtn = document.getElementById("result-menu-btn");

      if (playAgainBtn) {
        playAgainBtn.addEventListener("click", () => {
          state.questionIndex = 0;
          state.score = 0;
          state.screen = "quiz";
          render();
        });
      }

      if (resultMenuBtn) {
        resultMenuBtn.addEventListener("click", () => {
          state.screen = "options";
          render();
        });
      }
    }
  }

  function render() {
    showScreen(state.screen);

    // Toggle menu subtitle visibility
    if (ui.menuSubtitle) {
      ui.menuSubtitle.forEach((el) => {
        if (state.screen === "menu" || state.screen === "options") {
          el.style.display = "block";
        } else {
          el.style.display = "none";
        }
      });
    }

    if (state.screen === "options") {
      renderOptionsScreen();
    }

    if (state.screen === "quiz") {
      renderQuizScreen();
    }

    if (state.screen === "result") {
      renderResultScreen();
    }
  }

  // ===== Navigation =====
  if (ui.startBtn) {
    ui.startBtn.addEventListener("click", () => {
      state.screen = "options";
      render();
    });
  }

  if (ui.optionsBtn) {
    ui.optionsBtn.addEventListener("click", () => {
      state.screen = "options";
      render();
    });
  }

  if (ui.backBtn) {
    ui.backBtn.addEventListener("click", () => {
      state.screen = "menu";
      render();
    });
  }

  if (ui.startGameBtn) {
    ui.startGameBtn.addEventListener("click", () => {
      if (!state.dataReady) {
        alert("Data is still loading, please wait...");
        return;
      }

      state.questionIndex = 0;
      state.score = 0;
      state.currentQuestion = null;
      state.answered = false;

      state.screen = "quiz";
      render();
    });
  }

  if (ui.nextBtn) {
    ui.nextBtn.addEventListener("click", () => {
      nextQuestion();
    });
  }

  // ===== Options State =====
  ui.modeOptions.forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      renderOptionsScreen();
      saveSettings();
    });
  });

  ui.difficultyOptions.forEach((button) => {
    button.addEventListener("click", () => {
      state.totalQuestions = Number(button.dataset.value);
      renderOptionsScreen();
      saveSettings();
    });
  });

  ui.genOptions.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) return;

      const genName = button.textContent.trim();

      if (state.selectedGens.includes(genName)) {
        state.selectedGens = state.selectedGens.filter(
          (gen) => gen !== genName,
        );
      } else {
        state.selectedGens = [...state.selectedGens, genName];
      }

      renderOptionsScreen();
      saveSettings();
    });
  });

  render();
});
