const RECIPIENT_EMAIL = "your-email@example.com";
const WEBHOOK_SECRET = "change-this-secret";
const SHEET_NAME = "Results";

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    if (WEBHOOK_SECRET && payload.secret !== WEBHOOK_SECRET) {
      return jsonResponse({ ok: false, error: "Invalid secret" }, 403);
    }

    const record = payload.record;
    if (!record || !record.student || !record.result) {
      return jsonResponse({ ok: false, error: "Invalid result payload" }, 400);
    }

    appendToSheet(record);
    sendEmail(record);

    return jsonResponse({ ok: true, message: "Result emailed and saved to Google Sheet" });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message }, 500);
  }
}

function appendToSheet(record) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Submitted at",
      "Student",
      "Goal",
      "Level",
      "Score %",
      "Correct",
      "Total",
      "Grammar %",
      "Vocabulary %",
      "Reading %",
      "Listening %"
    ]);
  }

  const breakdown = {};
  (record.breakdown || []).forEach((item) => {
    breakdown[item.section] = item.percent;
  });

  sheet.appendRow([
    record.submittedAt,
    record.student.name || "",
    record.student.goal || "",
    record.result.level || "",
    record.result.weightedPercent || 0,
    record.result.correct || 0,
    record.result.total || 0,
    breakdown.grammar || 0,
    breakdown.vocabulary || 0,
    breakdown.reading || 0,
    breakdown.listening || 0
  ]);
}

function sendEmail(record) {
  const subject = `Placement test: ${record.student.name} - ${record.result.level}`;
  MailApp.sendEmail({
    to: RECIPIENT_EMAIL,
    subject,
    body: renderText(record),
    htmlBody: renderHtml(record)
  });
}

function renderHtml(record) {
  const breakdownRows = (record.breakdown || []).map((item) => `
    <tr>
      <td>${escapeHtml(item.section)}</td>
      <td>${item.correct}/${item.total}</td>
      <td>${item.points}/${item.maxPoints}</td>
      <td>${item.percent}%</td>
    </tr>
  `).join("");

  const answerRows = (record.answers || []).map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.section)}</td>
      <td>${escapeHtml(item.level)}</td>
      <td>${escapeHtml(item.prompt)}</td>
      <td>${escapeHtml(item.selectedText || "No answer")}</td>
      <td>${escapeHtml(item.correctText)}</td>
      <td>${item.correct ? "correct" : "wrong"}</td>
    </tr>
  `).join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#1d2733;line-height:1.45">
      <h1>English Placement Result</h1>
      <p><strong>Student:</strong> ${escapeHtml(record.student.name)}</p>
      <p><strong>Goal:</strong> ${escapeHtml(record.student.goal || "-")}</p>
      <p><strong>Submitted:</strong> ${escapeHtml(record.submittedAt)}</p>
      <h2>${escapeHtml(record.result.level)} - ${escapeHtml(record.result.levelTitle)}</h2>
      <p><strong>Score:</strong> ${record.result.weightedPercent}% (${record.result.correct}/${record.result.total} correct)</p>
      <p>${escapeHtml(record.result.note || "")}</p>

      <h2>Breakdown</h2>
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">
        <thead><tr><th>Section</th><th>Correct</th><th>Points</th><th>Percent</th></tr></thead>
        <tbody>${breakdownRows}</tbody>
      </table>

      <h2>Answers</h2>
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">
        <thead><tr><th>#</th><th>Section</th><th>Level</th><th>Question</th><th>Selected</th><th>Correct answer</th><th>Status</th></tr></thead>
        <tbody>${answerRows}</tbody>
      </table>
    </div>
  `;
}

function renderText(record) {
  const breakdown = (record.breakdown || [])
    .map((item) => `${item.section}: ${item.correct}/${item.total}, ${item.percent}%`)
    .join("\n");

  return [
    "English Placement Result",
    "",
    `Student: ${record.student.name}`,
    `Goal: ${record.student.goal || "-"}`,
    `Submitted: ${record.submittedAt}`,
    "",
    `Result: ${record.result.level} - ${record.result.levelTitle}`,
    `Score: ${record.result.weightedPercent}% (${record.result.correct}/${record.result.total} correct)`,
    record.result.note || "",
    "",
    "Breakdown:",
    breakdown
  ].join("\n");
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
