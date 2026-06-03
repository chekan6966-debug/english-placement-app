import { TEST_CONFIG, QUESTIONS } from "./test-bank.js";

const RESULT_EMAIL = "chekan6966@yandex.ru";
const RESULT_ENDPOINT = `https://formsubmit.co/ajax/${RESULT_EMAIL}`;
const DRY_RUN = new URLSearchParams(window.location.search).has("dryRun");

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
    state.config = TEST_CONFIG;
    state.questions = QUESTIONS;
    state.remainingSeconds = state.config.timeLimitMinutes * 60;
    renderIntro();
    bindEvents();
  } catch (error) {
    els.introMeta.textContent = "Не удалось загрузить тест.";
    console.error(error);
}

function bindEvents() {
  els.studentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(els.studentForm);
    state.student = {
      name: formData.get("name").trim(),
      email: formData.get("email").trim(),
      phone: formData.get("phone").trim(),
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
  const scored = scoreAttempt(state.answers);
  const record = {
    id: createResultId(state.student.name, new Date().toISOString()),
    submittedAt: new Date().toISOString(),
    student: state.student,
    timing: {
      startedAt: state.startedAt,
      durationSeconds,
      timeLimitMinutes: state.config.timeLimitMinutes
    },
    result: scored.summary,
    breakdown: scored.breakdown,
    answers: scored.answers
  };

  try {
    const email = await sendResultEmail(record);
    renderResult({
      ok: true,
      result: scored.summary,
      breakdown: scored.breakdown,
      saved: false,
      email
    });
  } catch (error) {
    renderResult({
      ok: true,
      result: scored.summary,
      breakdown: scored.breakdown,
      saved: false,
      email: { sent: false, message: error.message }
    });
  }
}

async function sendResultEmail(record) {
  if (DRY_RUN) {
    return {
      attempted: true,
      sent: true,
      transport: "dry-run",
      message: "Dry run accepted"
    };
  }

  const response = await fetch(RESULT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        _subject: `Placement test: ${record.student.name} - ${record.result.level}`,
        _template: "table",
        _captcha: "false",
        name: record.student.name,
        email: record.student.email,
        phone: record.student.phone || "-",
        goal: record.student.goal || "-",
        submitted_at: record.submittedAt,
        level: `${record.result.level} - ${record.result.levelTitle}`,
        score_percent: `${record.result.weightedPercent}%`,
        correct: `${record.result.correct}/${record.result.total}`,
        grammar: formatBreakdown(record, "grammar"),
        vocabulary: formatBreakdown(record, "vocabulary"),
        reading: formatBreakdown(record, "reading"),
        listening: formatBreakdown(record, "listening"),
        note: record.result.note,
        answers: formatAnswers(record)
      })
    });
    const payload = await response.json();
    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || "Email was not accepted");
    }
    return {
      attempted: true,
      sent: true,
      transport: "formsubmit",
      message: payload.message || "Email sent"
    };
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
  } else {
    els.emailStatus.textContent = "Ошибка";
    els.resultNote.textContent = `${result.note} Результат посчитан, но письмо не отправилось: ${payload.email?.message || "ошибка сервиса"}.`;
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

function scoreAttempt(answerMap) {
  const totals = createEmptyBreakdown();
  let weightedScore = 0;
  let weightedMax = 0;
  let correctCount = 0;

  const answers = QUESTIONS.map((question) => {
    const selected = Number.isInteger(answerMap[question.id]) ? answerMap[question.id] : null;
    const correct = selected === question.answer;

    weightedMax += question.points;
    totals[question.section].total += 1;
    totals[question.section].maxPoints += question.points;

    if (correct) {
      correctCount += 1;
      weightedScore += question.points;
      totals[question.section].correct += 1;
      totals[question.section].points += question.points;
    }

    return {
      id: question.id,
      section: question.section,
      level: question.level,
      prompt: question.prompt,
      selectedIndex: selected,
      selectedText: selected === null ? "" : question.options[selected] || "",
      correctIndex: question.answer,
      correctText: question.options[question.answer],
      correct,
      points: correct ? question.points : 0,
      maxPoints: question.points
    };
  });

  const weightedPercent = weightedMax ? Math.round((weightedScore / weightedMax) * 100) : 0;
  const level = getLevel(weightedPercent);
  const breakdown = Object.entries(totals).map(([section, item]) => ({
    section,
    correct: item.correct,
    total: item.total,
    points: item.points,
    maxPoints: item.maxPoints,
    percent: item.maxPoints ? Math.round((item.points / item.maxPoints) * 100) : 0
  }));

  return {
    summary: {
      level: level.level,
      levelTitle: level.title,
      note: level.note,
      correct: correctCount,
      total: QUESTIONS.length,
      weightedScore,
      weightedMax,
      weightedPercent
    },
    breakdown,
    answers
  };
}

function createEmptyBreakdown() {
  return TEST_CONFIG.sections.reduce((acc, section) => {
    acc[section.id] = {
      correct: 0,
      total: 0,
      points: 0,
      maxPoints: 0
    };
    return acc;
  }, {});
}

function getLevel(percent) {
  return TEST_CONFIG.levelBands.reduce((current, band) => {
    return percent >= band.min ? band : current;
  }, TEST_CONFIG.levelBands[0]);
}

function createResultId(name, isoDate) {
  const safeName = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36) || "student";
  return `${isoDate.replace(/[:.]/g, "-")}-${safeName}`;
}

function formatBreakdown(record, section) {
  const item = record.breakdown.find((entry) => entry.section === section);
  if (!item) {
    return "-";
  }
  return `${item.percent}% (${item.correct}/${item.total}, ${item.points}/${item.maxPoints} points)`;
}

function formatAnswers(record) {
  return record.answers.map((answer, index) => {
    const status = answer.correct ? "correct" : "wrong";
    return `${index + 1}. [${answer.section}/${answer.level}] ${answer.prompt}
Student: ${answer.selectedText || "No answer"}
Correct: ${answer.correctText}
Status: ${status}`;
  }).join("\n\n");
}
