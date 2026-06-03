const state = {
  config: null,
  questions: [],
  student: null,
  answers: {},
  currentIndex: 0,
  startedAt: null,
  remainingSeconds: 0,
  timerId: null,
  audioPlays: {},
  submitting: false
};

const els = {
  introView: document.querySelector("#introView"),
  testView: document.querySelector("#testView"),
  resultView: document.querySelector("#resultView"),
  studentForm: document.querySelector("#studentForm"),
  sectionStrip: document.querySelector("#sectionStrip"),
  introMeta: document.querySelector("#introMeta"),
  timerPill: document.querySelector("#timerPill"),
  timer: document.querySelector("#timer"),
  progressCircle: document.querySelector("#progressCircle"),
  progressPercent: document.querySelector("#progressPercent"),
  sectionProgress: document.querySelector("#sectionProgress"),
  questionSection: document.querySelector("#questionSection"),
  questionCount: document.querySelector("#questionCount"),
  passageBox: document.querySelector("#passageBox"),
  passageTitle: document.querySelector("#passageTitle"),
  passageText: document.querySelector("#passageText"),
  audioBox: document.querySelector("#audioBox"),
  playAudioButton: document.querySelector("#playAudioButton"),
  audioStatus: document.querySelector("#audioStatus"),
  questionPrompt: document.querySelector("#questionPrompt"),
  optionsList: document.querySelector("#optionsList"),
  prevButton: document.querySelector("#prevButton"),
  nextButton: document.querySelector("#nextButton"),
  submitButton: document.querySelector("#submitButton"),
  resultLevel: document.querySelector("#resultLevel"),
  resultNote: document.querySelector("#resultNote"),
  resultScore: document.querySelector("#resultScore"),
  resultCorrect: document.querySelector("#resultCorrect"),
  emailStatus: document.querySelector("#emailStatus"),
  breakdownGrid: document.querySelector("#breakdownGrid"),
  restartButton: document.querySelector("#restartButton")
};

const sectionNames = {
  grammar: "Грамматика",
  vocabulary: "Лексика",
  reading: "Чтение",
  listening: "Аудирование"
};

init();

async function init() {
  try {
    const response = await fetch("/api/test");
    if (!response.ok) {
      throw new Error("Test could not be loaded");
    }
    const payload = await response.json();
    state.config = payload.config;
    state.questions = payload.questions;
    state.remainingSeconds = state.config.timeLimitMinutes * 60;
    renderIntro();
    bindEvents();
  } catch (error) {
    els.introMeta.textContent = "Не удалось загрузить тест. Проверьте, запущен ли сервер.";
    console.error(error);
  }
}

function bindEvents() {
  els.studentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(els.studentForm);
    state.student = {
      name: formData.get("name").trim(),
      email: formData.get("email").trim(),
      goal: formData.get("goal")
    };
    startTest();
  });

  els.prevButton.addEventListener("click", () => {
    if (state.currentIndex > 0) {
      state.currentIndex -= 1;
      renderQuestion();
    }
  });

  els.nextButton.addEventListener("click", () => {
    if (state.currentIndex < state.questions.length - 1) {
      state.currentIndex += 1;
      renderQuestion();
    }
  });

  els.submitButton.addEventListener("click", () => submitTest(false));
  els.playAudioButton.addEventListener("click", playCurrentAudio);
  els.restartButton.addEventListener("click", () => window.location.reload());
}

function renderIntro() {
  const counts = countBySection(state.questions);
  els.sectionStrip.innerHTML = state.config.sections.map((section) => {
    return `<div class="section-chip"><span>${section.shortLabel}</span><strong>${counts[section.id] || 0}</strong></div>`;
  }).join("");
  els.introMeta.textContent = `${state.questions.length} вопросов, ${state.config.timeLimitMinutes} минут.`;
}

function startTest() {
  state.startedAt = new Date().toISOString();
  state.remainingSeconds = state.config.timeLimitMinutes * 60;
  els.introView.hidden = true;
  els.resultView.hidden = true;
  els.testView.hidden = false;
  els.timerPill.hidden = false;
  renderQuestion();
  renderTimer();
  state.timerId = window.setInterval(tick, 1000);
}

function tick() {
  state.remainingSeconds -= 1;
  renderTimer();
  if (state.remainingSeconds <= 0) {
    window.clearInterval(state.timerId);
    submitTest(true);
  }
}

function renderTimer() {
  const minutes = Math.max(0, Math.floor(state.remainingSeconds / 60));
  const seconds = Math.max(0, state.remainingSeconds % 60);
  els.timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  els.timerPill.classList.toggle("is-low", state.remainingSeconds <= 180);
}

function renderQuestion() {
  stopSpeech();
  const question = state.questions[state.currentIndex];
  const selected = state.answers[question.id];

  els.questionSection.textContent = sectionNames[question.section] || question.section;
  els.questionCount.textContent = `${state.currentIndex + 1} / ${state.questions.length}`;
  els.questionPrompt.textContent = question.prompt;

  renderPassage(question);
  renderAudio(question);
  renderOptions(question, selected);
  renderProgress();

  els.prevButton.disabled = state.currentIndex === 0;
  els.nextButton.hidden = state.currentIndex === state.questions.length - 1;
  els.submitButton.hidden = state.currentIndex !== state.questions.length - 1;
}

function renderPassage(question) {
  const hasPassage = Boolean(question.passage);
  els.passageBox.hidden = !hasPassage;
  if (hasPassage) {
    els.passageTitle.textContent = question.passageTitle || "Text";
    els.passageText.textContent = question.passage;
  }
}

function renderAudio(question) {
  const hasAudio = Boolean(question.audioText);
  els.audioBox.hidden = !hasAudio;
  if (hasAudio) {
    const plays = state.audioPlays[question.id] || 0;
    els.audioStatus.textContent = plays ? `Прослушано: ${plays}` : "Не прослушано";
    els.playAudioButton.disabled = !("speechSynthesis" in window);
    els.playAudioButton.textContent = "Play audio";
    if (!("speechSynthesis" in window)) {
      els.audioStatus.textContent = "Браузер не поддерживает озвучивание";
    }
  }
}

function renderOptions(question, selected) {
  els.optionsList.innerHTML = "";
  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `option-button${selected === index ? " is-selected" : ""}`;
    button.innerHTML = `<span class="option-letter">${String.fromCharCode(65 + index)}</span><span></span>`;
    button.querySelector("span:last-child").textContent = option;
    button.addEventListener("click", () => {
      state.answers[question.id] = index;
      renderQuestion();
    });
    els.optionsList.appendChild(button);
  });
}

function renderProgress() {
  const answered = Object.keys(state.answers).length;
  const percent = Math.round((answered / state.questions.length) * 100);
  const circumference = 314;
  els.progressCircle.style.strokeDashoffset = String(circumference - (circumference * percent) / 100);
  els.progressPercent.textContent = `${percent}%`;

  const bySection = state.config.sections.map((section) => {
    const questions = state.questions.filter((question) => question.section === section.id);
    const done = questions.filter((question) => Number.isInteger(state.answers[question.id])).length;
    const sectionPercent = questions.length ? Math.round((done / questions.length) * 100) : 0;
    return { ...section, done, total: questions.length, percent: sectionPercent };
  });

  els.sectionProgress.innerHTML = bySection.map((section) => {
    return `
      <div class="section-progress-item">
        <strong><span>${section.shortLabel}</span><span>${section.done}/${section.total}</span></strong>
        <div class="mini-track"><span style="width:${section.percent}%"></span></div>
      </div>
    `;
  }).join("");
}

function playCurrentAudio() {
  const question = state.questions[state.currentIndex];
  if (!question?.audioText || !("speechSynthesis" in window)) {
    return;
  }

  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(question.audioText);
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find((voice) => voice.lang.startsWith("en-GB")) || voices.find((voice) => voice.lang.startsWith("en")) || null;
  utterance.lang = utterance.voice?.lang || "en-GB";
  utterance.rate = 0.92;
  utterance.pitch = 1;
  utterance.onstart = () => {
    els.playAudioButton.disabled = true;
    els.playAudioButton.textContent = "Playing...";
  };
  utterance.onend = () => {
    state.audioPlays[question.id] = (state.audioPlays[question.id] || 0) + 1;
    els.playAudioButton.disabled = false;
    els.playAudioButton.textContent = "Play audio";
    els.audioStatus.textContent = `Прослушано: ${state.audioPlays[question.id]}`;
  };
  utterance.onerror = () => {
    els.playAudioButton.disabled = false;
    els.playAudioButton.textContent = "Play audio";
    els.audioStatus.textContent = "Не удалось воспроизвести";
  };
  window.speechSynthesis.speak(utterance);
}

function stopSpeech() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

async function submitTest(isAutoSubmit) {
  if (state.submitting) {
    return;
  }

  const unanswered = state.questions.length - Object.keys(state.answers).length;
  if (!isAutoSubmit && unanswered > 0) {
    const ok = window.confirm(`Осталось вопросов без ответа: ${unanswered}. Завершить тест?`);
    if (!ok) {
      return;
    }
  }

  state.submitting = true;
  stopSpeech();
  window.clearInterval(state.timerId);
  els.submitButton.disabled = true;
  els.submitButton.textContent = "Отправка...";

  const durationSeconds = state.config.timeLimitMinutes * 60 - Math.max(0, state.remainingSeconds);
  try {
    const response = await fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student: state.student,
        answers: state.answers,
        startedAt: state.startedAt,
        durationSeconds
      })
    });
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "Result was not accepted");
    }
    renderResult(payload);
  } catch (error) {
    renderResult({
      result: {
        level: "N/A",
        levelTitle: "Ошибка отправки",
        weightedPercent: 0,
        correct: 0,
        total: state.questions.length,
        note: "Результат не был принят сервером. Попробуйте отправить еще раз."
      },
      breakdown: [],
      email: { sent: false, message: error.message }
    });
  }
}

function renderResult(payload) {
  els.testView.hidden = true;
  els.timerPill.hidden = true;
  els.resultView.hidden = false;

  const result = payload.result;
  els.resultLevel.textContent = `${result.level} - ${result.levelTitle}`;
  els.resultNote.textContent = result.note;
  els.resultScore.textContent = `${result.weightedPercent}%`;
  els.resultCorrect.textContent = `${result.correct}/${result.total}`;

  if (payload.email?.sent) {
    els.emailStatus.textContent = "Отправлено";
  } else if (payload.saved) {
    els.emailStatus.textContent = "Сохранено";
  } else {
    els.emailStatus.textContent = "Ошибка";
  }

  els.breakdownGrid.innerHTML = payload.breakdown.map((item) => {
    return `
      <div class="breakdown-card">
        <span>${sectionNames[item.section] || item.section}</span>
        <strong>${item.percent}%</strong>
        <div class="mini-track"><span style="width:${item.percent}%"></span></div>
      </div>
    `;
  }).join("");
}

function countBySection(questions) {
  return questions.reduce((acc, question) => {
    acc[question.section] = (acc[question.section] || 0) + 1;
    return acc;
  }, {});
}
