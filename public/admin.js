const els = {
  refreshButton: document.querySelector("#refreshButton"),
  resultsList: document.querySelector("#resultsList"),
  detailPanel: document.querySelector("#detailPanel")
};

const sectionNames = {
  grammar: "Грамматика",
  vocabulary: "Лексика",
  reading: "Чтение",
  listening: "Аудирование"
};

let results = [];
let activeId = null;
let adminPassword = window.localStorage.getItem("placementAdminPassword") || "";

els.refreshButton.addEventListener("click", loadResults);

loadResults();

async function loadResults() {
  els.resultsList.innerHTML = `<p class="empty-state">Загрузка результатов...</p>`;
  try {
    const response = await adminFetch("/api/admin/results");
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      if (response.status === 403) {
        return requestPassword();
      }
      throw new Error(payload.error || "Не удалось загрузить результаты");
    }
    results = payload.results;
    renderList();
    if (results.length && !activeId) {
      await openResult(results[0].id);
    }
  } catch (error) {
    els.resultsList.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  }
}

function renderList() {
  if (!results.length) {
    els.resultsList.innerHTML = `<p class="empty-state">Пока нет завершенных тестов.</p>`;
    els.detailPanel.innerHTML = `<p class="empty-state">Когда ученик завершит тест, результат появится здесь.</p>`;
    return;
  }

  els.resultsList.innerHTML = "";
  for (const item of results) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `result-list-item${item.id === activeId ? " is-active" : ""}`;
    button.innerHTML = `
      <span>${escapeHtml(formatDate(item.submittedAt))}</span>
      <strong>${escapeHtml(item.student.name || "Student")}</strong>
      <small>${escapeHtml(item.result.level)} · ${item.result.weightedPercent}% · ${item.result.correct}/${item.result.total}</small>
    `;
    button.addEventListener("click", () => openResult(item.id));
    els.resultsList.appendChild(button);
  }
}

async function openResult(id) {
  activeId = id;
  renderList();
  els.detailPanel.innerHTML = `<p class="empty-state">Загрузка деталей...</p>`;

  try {
    const response = await adminFetch(`/api/admin/results/${encodeURIComponent(id)}`);
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      if (response.status === 403) {
        return requestPassword();
      }
      throw new Error(payload.error || "Не удалось открыть результат");
    }
    renderDetail(payload.result);
  } catch (error) {
    els.detailPanel.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  }
}

function adminFetch(url) {
  return fetch(url, {
    headers: adminPassword ? { "x-admin-password": adminPassword } : {}
  });
}

function requestPassword() {
  els.resultsList.innerHTML = `
    <form class="admin-login" id="adminLoginForm">
      <label>
        Пароль админки
        <input name="password" type="password" autocomplete="current-password" required placeholder="Введите пароль">
      </label>
      <button class="primary-button" type="submit">Открыть результаты</button>
      <p class="form-note">Пароль задается в переменной ADMIN_PASSWORD на хостинге.</p>
    </form>
  `;
  els.detailPanel.innerHTML = `<p class="empty-state">Введите пароль, чтобы увидеть результаты.</p>`;
  const form = document.querySelector("#adminLoginForm");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    adminPassword = new FormData(form).get("password").trim();
    window.localStorage.setItem("placementAdminPassword", adminPassword);
    activeId = null;
    await loadResults();
  });
}

function renderDetail(record) {
  const duration = formatDuration(record.timing?.durationSeconds || 0);
  const breakdown = record.breakdown.map((item) => `
    <div class="admin-breakdown-item">
      <span>${escapeHtml(sectionNames[item.section] || item.section)}</span>
      <strong>${item.percent}%</strong>
      <small>${item.correct}/${item.total} правильно</small>
      <div class="mini-track"><span style="width:${item.percent}%"></span></div>
    </div>
  `).join("");

  const answers = record.answers.map((answer, index) => `
    <tr class="${answer.correct ? "is-correct" : "is-wrong"}">
      <td>${index + 1}</td>
      <td>${escapeHtml(sectionNames[answer.section] || answer.section)}</td>
      <td>${escapeHtml(answer.level)}</td>
      <td>${escapeHtml(answer.prompt)}</td>
      <td>${escapeHtml(answer.selectedText || "Нет ответа")}</td>
      <td>${escapeHtml(answer.correctText)}</td>
    </tr>
  `).join("");

  els.detailPanel.innerHTML = `
    <div class="detail-summary">
      <p class="eyebrow">${escapeHtml(formatDate(record.submittedAt))}</p>
      <h2>${escapeHtml(record.student.name || "Student")}</h2>
      <div class="student-meta">
        <span>${escapeHtml(record.student.email || "-")}</span>
        <span>${escapeHtml(record.student.phone || "-")}</span>
        <span>${escapeHtml(record.student.goal || "Цель не указана")}</span>
      </div>
      <div class="admin-score-row">
        <div>
          <span>Уровень</span>
          <strong>${escapeHtml(record.result.level)}</strong>
        </div>
        <div>
          <span>Баллы</span>
          <strong>${record.result.weightedPercent}%</strong>
        </div>
        <div>
          <span>Правильно</span>
          <strong>${record.result.correct}/${record.result.total}</strong>
        </div>
        <div>
          <span>Время</span>
          <strong>${duration}</strong>
        </div>
      </div>
      <p class="result-note">${escapeHtml(record.result.note)}</p>
    </div>

    <div class="admin-breakdown-grid">${breakdown}</div>

    <div class="answers-panel">
      <h3>Ответы</h3>
      <div class="answers-table-wrap">
        <table class="answers-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Секция</th>
              <th>CEFR</th>
              <th>Вопрос</th>
              <th>Ответ ученика</th>
              <th>Верный ответ</th>
            </tr>
          </thead>
          <tbody>${answers}</tbody>
        </table>
      </div>
    </div>
  `;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
