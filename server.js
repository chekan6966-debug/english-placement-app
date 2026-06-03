import { createServer } from "node:http";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import net from "node:net";
import tls from "node:tls";
import { TEST_CONFIG, QUESTIONS } from "./src/test-bank.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv(join(__dirname, ".env"));

const publicDir = join(__dirname, "public");
const resultsDir = process.env.DATA_DIR ? join(process.env.DATA_DIR, "results") : join(__dirname, "data", "results");
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && url.pathname === "/api/health") {
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "GET" && url.pathname === "/api/test") {
      return sendJson(res, 200, sanitizeTest());
    }

    if (req.method === "POST" && url.pathname === "/api/results") {
      const body = await readJson(req);
      return handleResult(body, req, res);
    }

    if (req.method === "GET" && url.pathname === "/api/admin/results") {
      if (!isAdminRequestAllowed(req, url)) {
        return sendJson(res, 403, { ok: false, error: "Admin password is required." });
      }
      return sendJson(res, 200, await listResults());
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/admin/results/")) {
      if (!isAdminRequestAllowed(req, url)) {
        return sendJson(res, 403, { ok: false, error: "Admin password is required." });
      }
      const id = decodeURIComponent(url.pathname.replace("/api/admin/results/", ""));
      return sendJson(res, 200, await getResult(id));
    }

    if (req.method === "GET") {
      return serveStatic(url.pathname, res);
    }

    sendJson(res, 405, { ok: false, error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { ok: false, error: "Unexpected server error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`English Placement App is running at http://${HOST}:${PORT}`);
});

function sanitizeTest() {
  return {
    config: TEST_CONFIG,
    questions: QUESTIONS.map(({ answer, points, level, ...question }) => question)
  };
}

async function handleResult(body, req, res) {
  const validation = validateSubmission(body);
  if (!validation.ok) {
    return sendJson(res, 400, { ok: false, error: validation.error });
  }

  const scored = scoreAttempt(body.answers);
  const submittedAt = new Date().toISOString();
  const student = {
    name: String(body.student.name).trim(),
    email: String(body.student.email).trim(),
    phone: String(body.student.phone || "").trim(),
    goal: String(body.student.goal || "").trim()
  };

  const record = {
    id: createResultId(student.name, submittedAt),
    submittedAt,
    ip: req.socket.remoteAddress,
    student,
    timing: {
      startedAt: body.startedAt || null,
      durationSeconds: Number(body.durationSeconds || 0),
      timeLimitMinutes: TEST_CONFIG.timeLimitMinutes
    },
    result: scored.summary,
    breakdown: scored.breakdown,
    answers: scored.answers
  };

  await mkdir(resultsDir, { recursive: true });
  const resultPath = join(resultsDir, `${record.id}.json`);
  await writeFile(resultPath, JSON.stringify(record, null, 2), "utf8");

  let email = { attempted: false, sent: false, message: "Email is not configured" };
  if (process.env.RESULT_RECIPIENT_EMAIL) {
    email = await sendResultEmail(record);
  }

  sendJson(res, email.sent ? 200 : 202, {
    ok: true,
    result: scored.summary,
    breakdown: scored.breakdown,
    saved: true,
    email,
    resultFile: resultPath
  });
}

function validateSubmission(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }
  if (!body.student || typeof body.student !== "object") {
    return { ok: false, error: "Student data is required" };
  }
  if (!String(body.student.name || "").trim()) {
    return { ok: false, error: "Student name is required" };
  }
  if (!isEmail(String(body.student.email || ""))) {
    return { ok: false, error: "Valid student email is required" };
  }
  if (!body.answers || typeof body.answers !== "object") {
    return { ok: false, error: "Answers are required" };
  }
  return { ok: true };
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
  const sectionBreakdown = Object.entries(totals).map(([section, item]) => ({
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
    breakdown: sectionBreakdown,
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

async function serveStatic(pathname, res) {
  const requested = pathname === "/" ? "/index.html" : pathname === "/admin" ? "/admin.html" : decodeURIComponent(pathname);
  const safePath = normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    return sendText(res, 403, "Forbidden");
  }

  if (!existsSync(filePath)) {
    const fallbackPath = join(publicDir, "index.html");
    const html = await readFile(fallbackPath);
    return sendBuffer(res, 200, html, mimeTypes[".html"]);
  }

  const content = await readFile(filePath);
  sendBuffer(res, 200, content, mimeTypes[extname(filePath)] || "application/octet-stream");
}

async function listResults() {
  await mkdir(resultsDir, { recursive: true });
  const files = await readdir(resultsDir, { withFileTypes: true });
  const records = [];

  for (const file of files) {
    if (!file.isFile() || !file.name.endsWith(".json")) {
      continue;
    }
    try {
      const record = JSON.parse(await readFile(join(resultsDir, file.name), "utf8"));
      records.push(toResultListItem(record));
    } catch (error) {
      console.error(`Could not read result file ${file.name}:`, error);
    }
  }

  records.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  return { ok: true, results: records };
}

async function getResult(id) {
  if (!/^[a-zA-Z0-9._:-]+$/.test(id)) {
    return { ok: false, error: "Invalid result id" };
  }

  const filePath = join(resultsDir, `${id}.json`);
  if (!filePath.startsWith(resultsDir) || !existsSync(filePath)) {
    return { ok: false, error: "Result not found" };
  }

  const record = JSON.parse(await readFile(filePath, "utf8"));
  return { ok: true, result: record };
}

function toResultListItem(record) {
  return {
    id: record.id,
    submittedAt: record.submittedAt,
    student: record.student,
    result: record.result,
    breakdown: record.breakdown,
    timing: record.timing
  };
}

function isAdminRequestAllowed(req, url) {
  if (isLocalRequest(req)) {
    return true;
  }

  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword) {
    return false;
  }

  const headerPassword = String(req.headers["x-admin-password"] || "");
  const queryPassword = url.searchParams.get("adminPassword") || "";
  return headerPassword === configuredPassword || queryPassword === configuredPassword;
}

function isLocalRequest(req) {
  const rawHost = String(req.headers.host || "").toLowerCase();
  const host = rawHost.startsWith("[") ? rawHost.slice(1, rawHost.indexOf("]")) : rawHost.split(":")[0];
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) {
      throw new Error("Request body is too large");
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, status, payload) {
  const json = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(json)
  });
  res.end(json);
}

function sendText(res, status, text) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": Buffer.byteLength(text)
  });
  res.end(text);
}

function sendBuffer(res, status, buffer, contentType) {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Content-Length": buffer.length
  });
  res.end(buffer);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
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

async function sendResultEmail(record) {
  const recipient = process.env.RESULT_RECIPIENT_EMAIL;
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || "placement@localhost";
  const subject = `Placement test: ${record.student.name} - ${record.result.level}`;
  const html = renderEmailHtml(record);
  const text = renderEmailText(record);

  const message = { from, to: recipient, subject, html, text };
  const copyStudent = String(process.env.SEND_STUDENT_COPY || "").toLowerCase() === "true";
  if (copyStudent && record.student.email) {
    message.cc = record.student.email;
  }

  try {
    if (process.env.SMTP_HOST) {
      await sendViaSmtp(message);
      return { attempted: true, sent: true, transport: "smtp", message: "Email sent" };
    }

    if ((process.env.EMAIL_TRANSPORT || "").toLowerCase() === "sendmail") {
      await sendViaSendmail(message);
      return { attempted: true, sent: true, transport: "sendmail", message: "Email handed to sendmail" };
    }

    return { attempted: false, sent: false, message: "No email transport configured" };
  } catch (error) {
    console.error("Email delivery failed:", error);
    return { attempted: true, sent: false, message: error.message || "Email delivery failed" };
  }
}

function renderEmailHtml(record) {
  const sectionRows = record.breakdown.map((item) => {
    return `<tr><td>${escapeHtml(sectionLabel(item.section))}</td><td>${item.correct}/${item.total}</td><td>${item.points}/${item.maxPoints}</td><td>${item.percent}%</td></tr>`;
  }).join("");

  const answerRows = record.answers.map((item) => {
    const mark = item.correct ? "correct" : "wrong";
    return `<tr><td>${escapeHtml(sectionLabel(item.section))}</td><td>${escapeHtml(item.level)}</td><td>${escapeHtml(item.prompt)}</td><td>${escapeHtml(item.selectedText || "No answer")}</td><td>${escapeHtml(item.correctText)}</td><td>${mark}</td></tr>`;
  }).join("");

  return `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #1d2733; line-height: 1.45;">
    <h1>English Placement Result</h1>
    <p><strong>Student:</strong> ${escapeHtml(record.student.name)} (${escapeHtml(record.student.email)})</p>
    <p><strong>Phone:</strong> ${escapeHtml(record.student.phone || "-")}</p>
    <p><strong>Goal:</strong> ${escapeHtml(record.student.goal || "-")}</p>
    <p><strong>Submitted:</strong> ${escapeHtml(record.submittedAt)}</p>
    <h2>Result: ${escapeHtml(record.result.level)} - ${escapeHtml(record.result.levelTitle)}</h2>
    <p><strong>Score:</strong> ${record.result.weightedPercent}% (${record.result.weightedScore}/${record.result.weightedMax} weighted points), ${record.result.correct}/${record.result.total} correct.</p>
    <p>${escapeHtml(record.result.note)}</p>
    <h2>Breakdown</h2>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
      <thead><tr><th>Section</th><th>Correct</th><th>Points</th><th>Percent</th></tr></thead>
      <tbody>${sectionRows}</tbody>
    </table>
    <h2>Answers</h2>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
      <thead><tr><th>Section</th><th>Level</th><th>Question</th><th>Selected</th><th>Correct answer</th><th>Status</th></tr></thead>
      <tbody>${answerRows}</tbody>
    </table>
  </body>
</html>`;
}

function renderEmailText(record) {
  const breakdown = record.breakdown
    .map((item) => `${sectionLabel(item.section)}: ${item.correct}/${item.total}, ${item.percent}%`)
    .join("\n");

  return [
    "English Placement Result",
    "",
    `Student: ${record.student.name} (${record.student.email})`,
    `Phone: ${record.student.phone || "-"}`,
    `Goal: ${record.student.goal || "-"}`,
    `Submitted: ${record.submittedAt}`,
    "",
    `Result: ${record.result.level} - ${record.result.levelTitle}`,
    `Score: ${record.result.weightedPercent}% (${record.result.weightedScore}/${record.result.weightedMax} weighted points), ${record.result.correct}/${record.result.total} correct.`,
    record.result.note,
    "",
    "Breakdown:",
    breakdown
  ].join("\n");
}

function sectionLabel(section) {
  return TEST_CONFIG.sections.find((item) => item.id === section)?.label || section;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendViaSendmail(message) {
  const recipients = [message.to, message.cc].filter(Boolean).join(", ");
  const raw = buildMimeMessage({ ...message, to: recipients });

  await new Promise((resolve, reject) => {
    const child = spawn("/usr/sbin/sendmail", ["-t"], { stdio: ["pipe", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr || `sendmail exited with code ${code}`));
      }
    });
    child.stdin.end(raw);
  });
}

async function sendViaSmtp(message) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465;
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const fromAddress = extractEmail(message.from);
  const recipients = [message.to, message.cc].filter(Boolean).flatMap((value) => value.split(",").map((item) => item.trim()).filter(Boolean));

  let client = await connectSmtp(host, port, secure);
  let reader = createSmtpReader(client);
  await reader.expect(220);
  await smtpCommand(client, reader, `EHLO ${process.env.SMTP_EHLO || "localhost"}`, 250);

  if (!secure && String(process.env.SMTP_STARTTLS || "true").toLowerCase() !== "false") {
    await smtpCommand(client, reader, "STARTTLS", 220);
    client = tls.connect({ socket: client, servername: host });
    reader = createSmtpReader(client);
    await smtpCommand(client, reader, `EHLO ${process.env.SMTP_EHLO || "localhost"}`, 250);
  }

  if (user && pass) {
    const token = Buffer.from(`\u0000${user}\u0000${pass}`).toString("base64");
    await smtpCommand(client, reader, `AUTH PLAIN ${token}`, 235);
  }

  await smtpCommand(client, reader, `MAIL FROM:<${fromAddress}>`, 250);
  for (const recipient of recipients) {
    await smtpCommand(client, reader, `RCPT TO:<${extractEmail(recipient)}>`, [250, 251]);
  }
  await smtpCommand(client, reader, "DATA", 354);
  client.write(`${escapeSmtpData(buildMimeMessage(message))}\r\n.\r\n`);
  await reader.expect(250);
  await smtpCommand(client, reader, "QUIT", 221);
  client.end();
}

function connectSmtp(host, port, secure) {
  return new Promise((resolve, reject) => {
    const socket = secure
      ? tls.connect({ host, port, servername: host }, () => resolve(socket))
      : net.connect({ host, port }, () => resolve(socket));
    socket.setTimeout(20000);
    socket.on("timeout", () => reject(new Error("SMTP connection timed out")));
    socket.on("error", reject);
  });
}

function createSmtpReader(socket) {
  let buffer = "";
  const queue = [];
  const waiters = [];

  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    let index;
    while ((index = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, index + 1).replace(/\r?\n$/, "");
      buffer = buffer.slice(index + 1);
      queue.push(line);
    }
    flush();
  });

  function flush() {
    while (waiters.length && hasCompleteResponse()) {
      const waiter = waiters.shift();
      waiter(readResponse());
    }
  }

  function hasCompleteResponse() {
    return queue.some((line) => /^\d{3} /.test(line));
  }

  function readResponse() {
    const lines = [];
    while (queue.length) {
      const line = queue.shift();
      lines.push(line);
      if (/^\d{3} /.test(line)) {
        break;
      }
    }
    const code = Number(lines.at(-1).slice(0, 3));
    return { code, lines, text: lines.join("\n") };
  }

  function next() {
    if (hasCompleteResponse()) {
      return Promise.resolve(readResponse());
    }
    return new Promise((resolve) => waiters.push(resolve));
  }

  return {
    async expect(expected) {
      const allowed = Array.isArray(expected) ? expected : [expected];
      const response = await next();
      if (!allowed.includes(response.code)) {
        throw new Error(`SMTP expected ${allowed.join("/")} but got ${response.code}: ${response.text}`);
      }
      return response;
    }
  };
}

async function smtpCommand(socket, reader, command, expectedCode) {
  socket.write(`${command}\r\n`);
  return reader.expect(expectedCode);
}

function buildMimeMessage(message) {
  const boundary = `placement-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const headers = [
    `From: ${message.from}`,
    `To: ${message.to}`,
    message.cc ? `Cc: ${message.cc}` : "",
    `Subject: ${encodeMimeWord(message.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`
  ].filter(Boolean);

  return [
    ...headers,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    message.text,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    message.html,
    "",
    `--${boundary}--`,
    ""
  ].join("\r\n");
}

function encodeMimeWord(value) {
  if (/^[\x00-\x7F]*$/.test(value)) {
    return value;
  }
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function extractEmail(value) {
  const match = String(value).match(/<([^>]+)>/);
  return (match ? match[1] : String(value)).trim();
}

function escapeSmtpData(value) {
  return value.replace(/\r?\n\./g, "\r\n..");
}

function loadEnv(filePath) {
  if (!existsSync(filePath)) {
    return;
  }
  const raw = readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const index = trimmed.indexOf("=");
    if (index === -1) {
      continue;
    }
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
