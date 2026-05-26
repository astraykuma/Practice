const canvas = document.getElementById("geomCanvas");
const ctx = canvas.getContext("2d");

const questionType = document.getElementById("questionType");
const newProblemBtn = document.getElementById("newProblemBtn");
const hintBtn = document.getElementById("hintBtn");
const questionText = document.getElementById("questionText");
const answerSelect = document.getElementById("answerSelect");
const checkBtn = document.getElementById("checkBtn");
const showBtn = document.getElementById("showBtn");
const resultText = document.getElementById("resultText");

let state = null;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function makeLine(name, x1, y1, x2, y2, family = "extra") {
  return { name, x1, y1, x2, y2, family };
}

function intersection(l1, l2) {
  const x1 = l1.x1, y1 = l1.y1, x2 = l1.x2, y2 = l1.y2;
  const x3 = l2.x1, y3 = l2.y1, x4 = l2.x2, y4 = l2.y2;
  const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(den) < 1e-9) return null;
  const px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / den;
  const py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / den;
  return { x: px, y: py };
}

function directions(line) {
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;
  const len = Math.hypot(dx, dy);
  return [
    { x: dx / len, y: dy / len },
    { x: -dx / len, y: -dy / len }
  ];
}

function anglePos(v1, v2) {
  return { x: (v1.x + v2.x) * 20, y: (v1.y + v2.y) * 20 };
}

function buildProblem() {
  const p = { x: 80, y: rand(120, 160) };
  const q = { x: 760, y: rand(220, 300) };
  const tilt = rand(-0.2, 0.25);

  const base1 = makeLine("l1", p.x, p.y, 760, p.y + (760 - p.x) * tilt, "main");
  const base2 = makeLine("l2", 60, q.y, q.x, q.y + (q.x - 60) * (tilt + rand(-0.1, 0.1)), "main");

  const tx = rand(260, 560);
  const transversal = makeLine("t", tx - 140, 40, tx + 80, 400, "main");

  const extras = [
    makeLine("e1", rand(80, 220), 360, rand(720, 780), rand(40, 120)),
    makeLine("e2", rand(80, 740), rand(50, 390), rand(80, 740), rand(50, 390))
  ];

  const i1 = intersection(base1, transversal);
  const i2 = intersection(base2, transversal);
  if (!i1 || !i2) return buildProblem();

  const tDirs = directions(transversal);
  const b1Dirs = directions(base1);
  const b2Dirs = directions(base2);

  const angles = [];
  let id = 1;

  for (const a of b1Dirs) {
    for (const b of tDirs) {
      const pos = anglePos(a, b);
      angles.push({ id: id++, at: "top", x: i1.x + pos.x, y: i1.y + pos.y, key: `${Math.sign(a.x)}_${Math.sign(b.y)}` });
    }
  }
  for (const a of b2Dirs) {
    for (const b of tDirs) {
      const pos = anglePos(a, b);
      angles.push({ id: id++, at: "bottom", x: i2.x + pos.x, y: i2.y + pos.y, key: `${Math.sign(a.x)}_${Math.sign(b.y)}` });
    }
  }

  const topAngles = angles.filter((x) => x.at === "top");
  const bottomAngles = angles.filter((x) => x.at === "bottom");
  const source = topAngles[Math.floor(Math.random() * topAngles.length)];

  let target;
  if (questionType.value === "corresponding") {
    target = bottomAngles.find((x) => x.key === source.key);
  } else {
    target = bottomAngles.find((x) => x.key.split("_")[0] !== source.key.split("_")[0] && x.key.split("_")[1] === source.key.split("_")[1]);
  }

  return { lines: [base1, base2, transversal, ...extras], source, target, i1, i2 };
}

function draw(hint = false) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  state.lines.forEach((line) => {
    const isMain = line.family === "main";
    const isFocus = hint && isMain;
    ctx.strokeStyle = hint ? (isFocus ? "#0f172a" : "rgba(148,163,184,0.35)") : "#334155";
    ctx.setLineDash(hint && !isFocus ? [6, 6] : []);
    ctx.lineWidth = isFocus ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  const allAngles = [state.source, ...Array.from({ length: 7 }, (_, i) => i + 1)
    .map((n) => n <= state.source.id ? n : n + 1)
    .map((id) => {
      const sourcePool = [];
      for (let k = 1; k <= 8; k++) sourcePool.push(k);
      return sourcePool;
    })];

  const labels = [];
  for (let i = 1; i <= 8; i++) {
    const a = i <= 4 ? state.source.at === "top" ? i : i : i;
    labels.push(i);
  }

  const all = [];
  const top = []; const bottom = [];
  // 재계산보다 단순 저장형으로 표기
  for (let i = 1; i <= 8; i++) {
    // no-op, ids already 1..8 in build
  }

  const angleMarks = [];
  const byId = {};
  const sorted = [state.source, state.target];
  state.__allAngles.forEach((a) => {
    byId[a.id] = a;
    angleMarks.push(a);
  });

  angleMarks.forEach((a) => {
    ctx.fillStyle = a.id === state.source.id ? "#dc2626" : "#1d4ed8";
    ctx.beginPath();
    ctx.arc(a.x, a.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(a.id), a.x, a.y);
  });
}

function refreshAnswerOptions() {
  answerSelect.innerHTML = "";
  for (let i = 1; i <= 8; i++) {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = `${i}번 각`;
    answerSelect.appendChild(option);
  }
}

function newProblem() {
  state = buildProblem();
  state.__allAngles = [];

  const topBottom = [];
  // buildProblem 내부 규칙으로 id 1..8가 결정되므로 동일하게 재구성
  const main = state.lines.filter((l) => l.family === "main");
  const b1 = main[0], b2 = main[1], t = main[2];
  const tDirs = directions(t);
  const b1Dirs = directions(b1);
  const b2Dirs = directions(b2);
  let id = 1;
  for (const a of b1Dirs) for (const b of tDirs) {
    const pos = anglePos(a, b);
    state.__allAngles.push({ id: id++, at: "top", x: state.i1.x + pos.x, y: state.i1.y + pos.y, key: `${Math.sign(a.x)}_${Math.sign(b.y)}` });
  }
  for (const a of b2Dirs) for (const b of tDirs) {
    const pos = anglePos(a, b);
    state.__allAngles.push({ id: id++, at: "bottom", x: state.i2.x + pos.x, y: state.i2.y + pos.y, key: `${Math.sign(a.x)}_${Math.sign(b.y)}` });
  }

  state.source = state.__allAngles.find((x) => x.id === state.source.id);
  state.target = state.__allAngles.find((x) => x.id === state.target.id);

  questionText.textContent = `빨간 ${state.source.id}번 각과 ${questionType.value === "corresponding" ? "동위각" : "엇각"}인 각 번호를 고르세요.`;
  resultText.textContent = "";
  draw(false);
}

newProblemBtn.addEventListener("click", () => newProblem());
hintBtn.addEventListener("click", () => draw(true));
checkBtn.addEventListener("click", () => {
  const ans = Number(answerSelect.value);
  if (ans === state.target.id) {
    resultText.textContent = `정답! ${state.target.id}번이 맞습니다.`;
    resultText.className = "result ok";
  } else {
    resultText.textContent = `오답! 다시 생각해보세요. (힌트: 핵심 선분 강조 버튼)`;
    resultText.className = "result wrong";
  }
});
showBtn.addEventListener("click", () => {
  resultText.textContent = `정답은 ${state.target.id}번 각입니다.`;
  resultText.className = "result";
});

refreshAnswerOptions();
newProblem();
