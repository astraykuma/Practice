const problems = {
  0: "44 - 44",
  1: "44 / 44 or (4 + 4)/(4 + 4) or (4/4) / (4/4) or ((4! - 4) / 4) - 4",
  2: "4/4 + 4/4",
  3: "(4 + 4 + 4) / 4",
  4: "4 × (4 - 4) + 4",
  5: "(4 × 4 + 4) / 4",
  6: "4 × .4 + 4.4",
  7: "44 / 4 - 4",
  8: "4 + 4.4 - .4",
  9: "4/4 + 4 + 4",
  10: "44 / 4.4",
  11: "4/.4 + 4/4",
  12: "(44 + 4) / 4",
  13: "4! - 44/4",
  14: "4 × (4 - .4) - .4",
  15: "44 / 4 + 4",
  16: ".4 × (44 - 4)",
  17: "4/4 + 4 × 4",
  18: "44 × .4 + .4",
  19: "4! - 4 - 4/4",
  20: "4 × (4/4 + 4)",
  21: "(4.4 + 4)/.4",
  22: "44 × √4 / 4",
  23: "(4 × 4! - 4)/ 4",
  24: "4 × 4 + 4 + 4",
  25: "(4 × 4! + 4) / 4",
  26: "4/.4 + 4×4",
  27: "4 - 4/4 + 4!",
  28: "44 - 4 × 4",
  29: "4/.4/.4 + 4",
  30: "(4 + 4 + 4) / .4",
  31: "(4! + 4) / 4 + 4!",
  32: "4 × 4 + 4 × 4",
  33: "(4 - .4)/.4 + 4!",
  34: "44 - 4/.4",
  35: "44 / 4 + 4!",
  36: "44 - 4 - 4",
  37: "(√4 + 4!)/√4 + 4!",
  38: "44 - 4!/4",
  39: "(4 × 4 - .4)/.4",
  40: "44 - √(4 × 4)",
  41: "(√4 + 4!)/.4 - 4!",
  42: "√4 + 44 - 4",
  43: "44 - 4/4",
  44: "44.4 - .4",
  45: "4/4 + 44",
  46: "44 - √4 + 4",
  47: "4! + 4! - 4/4",
  48: "4 × (4 + 4 + 4)",
  49: "(4! - 4.4) / .4",
  50: "4! / 4 + 44"
};

const STORAGE_KEY = "fours-problem-classroom-v1";
const DEFAULT_TIMER_SECONDS = 20;

const drawBtn = document.getElementById("drawBtn");
const resetBtn = document.getElementById("resetBtn");
const answerBtn = document.getElementById("answerBtn");
const timerStatus = document.getElementById("timerStatus");
const timerInput = document.getElementById("timerSeconds");
const currentNumberEl = document.getElementById("currentNumber");
const answerText = document.getElementById("answerText");
const difficultyBadge = document.getElementById("difficultyBadge");

const studentNameInput = document.getElementById("studentName");
const addStudentBtn = document.getElementById("addStudentBtn");
const studentList = document.getElementById("studentList");
const podium = document.getElementById("podium");
const fullRanking = document.getElementById("fullRanking");

let currentNumber = null;
let currentScore = 0;
let timerHandle = null;
let countdownHandle = null;
let students = [];

function calculateDifficulty(expression) {
  let score = 1;
  if (/[√!]/.test(expression)) score += 1;
  if (/\.4|4\.4/.test(expression)) score += 1;
  if (expression.includes("/") && expression.includes("×")) score += 1;
  if (expression.length > 18) score += 1;

  if (score <= 2) return { stars: 1, points: 10, label: "★ (기본)" };
  if (score <= 4) return { stars: 2, points: 20, label: "★★ (도전)" };
  return { stars: 3, points: 30, label: "★★★ (어려움)" };
}

function saveState() {
  const payload = {
    students,
    timerSeconds: Number(timerInput.value) || DEFAULT_TIMER_SECONDS
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.students)) {
      students = parsed.students.filter(
        (student) =>
          student &&
          typeof student.name === "string" &&
          Number.isFinite(student.score)
      );
    }

    if (Number.isFinite(parsed.timerSeconds) && parsed.timerSeconds > 0) {
      timerInput.value = String(parsed.timerSeconds);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function renderStudents() {
  studentList.innerHTML = "";

  if (students.length === 0) {
    const li = document.createElement("li");
    li.textContent = "학생을 추가해 주세요.";
    li.className = "placeholder";
    studentList.appendChild(li);
    return;
  }

  students.forEach((student) => {
    const li = document.createElement("li");
    li.className = "student-item";

    const info = document.createElement("div");
    info.innerHTML = `<strong>${student.name}</strong><span>${student.score}점</span>`;

    const markBtn = document.createElement("button");
    markBtn.textContent = "정답 처리";
    markBtn.disabled = currentNumber === null;
    markBtn.addEventListener("click", () => {
      if (currentNumber === null) {
        alert("먼저 문제를 뽑아 주세요.");
        return;
      }
      student.score += currentScore;
      saveState();
      renderLeaderboard();
      renderStudents();
    });

    li.append(info, markBtn);
    studentList.appendChild(li);
  });
}

function renderLeaderboard() {
  const ranked = [...students].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  podium.innerHTML = "";
  const top3 = ranked.slice(0, 3);

  if (top3.length === 0) {
    podium.textContent = "아직 순위 데이터가 없습니다.";
  } else {
    top3.forEach((student, index) => {
      const block = document.createElement("article");
      block.className = "podium-block";
      block.innerHTML = `<h3>${index + 1}등</h3><p>${student.name}</p><strong>${student.score}점</strong>`;
      podium.appendChild(block);
    });
  }

  fullRanking.innerHTML = "";
  ranked.forEach((student, index) => {
    const item = document.createElement("li");
    item.textContent = `${index + 1}등 - ${student.name} (${student.score}점)`;
    fullRanking.appendChild(item);
  });
}


function resetAppState() {
  const confirmed = window.confirm("저장된 학생/점수와 현재 상태를 모두 초기화할까요?");
  if (!confirmed) return;

  if (timerHandle) clearTimeout(timerHandle);
  if (countdownHandle) clearInterval(countdownHandle);

  localStorage.removeItem(STORAGE_KEY);
  students = [];
  currentNumber = null;
  currentScore = 0;

  timerInput.value = String(DEFAULT_TIMER_SECONDS);
  timerStatus.textContent = "대기 중";
  currentNumberEl.textContent = "?";
  difficultyBadge.classList.add("hidden");
  answerBtn.classList.add("hidden");
  answerText.classList.add("hidden");
  answerText.textContent = "";

  renderStudents();
  renderLeaderboard();
}

function revealAnswer() {
  if (currentNumber === null) return;
  answerBtn.classList.remove("hidden");
  answerText.classList.remove("hidden");
  answerText.textContent = `${currentNumber} = ${problems[currentNumber]}`;
}

function startDraw() {
  const seconds = Number(timerInput.value);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    alert("타이머는 1초 이상으로 입력해 주세요.");
    return;
  }

  saveState();

  currentNumber = Math.floor(Math.random() * 51);
  currentNumberEl.textContent = String(currentNumber);

  const difficulty = calculateDifficulty(problems[currentNumber]);
  currentScore = difficulty.points;
  difficultyBadge.textContent = `난이도 ${difficulty.label} · 정답 점수 ${difficulty.points}점`;
  difficultyBadge.classList.remove("hidden");

  answerBtn.classList.add("hidden");
  answerText.classList.add("hidden");
  answerText.textContent = "";

  if (timerHandle) clearTimeout(timerHandle);
  if (countdownHandle) clearInterval(countdownHandle);

  let left = seconds;
  timerStatus.textContent = `${left}초 후 정답 공개 가능`;

  countdownHandle = setInterval(() => {
    left -= 1;
    if (left > 0) {
      timerStatus.textContent = `${left}초 후 정답 공개 가능`;
      return;
    }
    clearInterval(countdownHandle);
  }, 1000);

  timerHandle = setTimeout(() => {
    timerStatus.textContent = "타이머 종료! 정답 보기 버튼을 눌러주세요.";
    answerBtn.classList.remove("hidden");
  }, seconds * 1000);

  renderStudents();
}

addStudentBtn.addEventListener("click", () => {
  const name = studentNameInput.value.trim();
  if (!name) return;

  if (students.some((student) => student.name === name)) {
    alert("이미 등록된 학생입니다.");
    return;
  }

  students.push({ name, score: 0 });
  studentNameInput.value = "";
  saveState();
  renderStudents();
  renderLeaderboard();
});

timerInput.addEventListener("change", saveState);

drawBtn.addEventListener("click", startDraw);
resetBtn.addEventListener("click", resetAppState);
answerBtn.addEventListener("click", revealAnswer);

loadState();
renderStudents();
renderLeaderboard();
