const quizSelect = document.getElementById("quizFile");
const loadBtn = document.getElementById("loadQuiz");
const quizTitle = document.getElementById("quizTitle");
const quizForm = document.getElementById("quizForm");
const nextPartBtn = document.getElementById("nextPart");
const submitBtn = document.getElementById("submitQuiz");
const resultBox = document.getElementById("result");

let currentQuiz = null;
let currentPart = 0;
let parts = [];
let answers = {};


loadBtn.addEventListener("click", async () => {
  const file = quizSelect.value;
  if (!file) return alert("Please choose a quiz JSON file.");

  try {
    const res = await fetch(file);
    currentQuiz = await res.json();
    setupParts(currentQuiz);
    currentPart = 0;
    displayPart();
  } catch (err) {
    console.error(err);
    alert("Error loading JSON file.");
  }
});

function setupParts(data) {
  // Group questions by type
  const types = ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"];
  parts = types.map(type => ({
    title: type.replace("_", " "),
    questions: shuffleArray(data.questions.filter(q => q.type === type))
  })).filter(p => p.questions.length > 0);
}

function shuffleArray(arr) {
  let a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function displayPart() {
  const part = parts[currentPart];
  if (!part) return;

  quizForm.innerHTML = "";
  resultBox.style.display = "none";
  nextPartBtn.style.display = "none";
  submitBtn.style.display = "none";

  quizTitle.textContent = `Part ${currentPart + 1}: ${part.title}`;

  part.questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.classList.add("question");
    let html = `<p><strong>${i + 1}. ${q.question}</strong></p>`;

    if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") {
      const shuffledChoices = shuffleArray(q.choices);
      shuffledChoices.forEach(choice => {
        html += `
          <label class="choice">
            <input type="radio" name="q${currentPart}_${i}" value="${choice}">
            ${choice}
          </label>`;
      });
    } else {
      html += `<input type="text" name="q${currentPart}_${i}" placeholder="Type your answer...">`;
    }

    div.innerHTML = html;
    quizForm.appendChild(div);
  });

  // Show proper button
  if (currentPart < parts.length - 1) {
    nextPartBtn.style.display = "inline-block";
  } else {
    submitBtn.style.display = "inline-block";
  }
}

nextPartBtn.addEventListener("click", () => {
  saveAnswers();
  currentPart++;
  displayPart();
});

submitBtn.addEventListener("click", () => {
  saveAnswers();
  showResults();
});

function saveAnswers() {
  const inputs = quizForm.querySelectorAll("input");
  inputs.forEach(input => {
    if (input.type === "radio" && input.checked) {
      answers[input.name] = input.value;
    } else if (input.type === "text") {
      answers[input.name] = input.value;
    }
  });
}

function showResults() {
  resultBox.innerHTML = "";
  resultBox.style.display = "block";

  let score = 0;
  let total = 0;

  parts.forEach((part, pIndex) => {
    const section = document.createElement("div");
    section.innerHTML = `<h3>Part ${pIndex + 1}: ${part.title}</h3>`;

    part.questions.forEach((q, i) => {
      const ansKey = `q${pIndex}_${i}`;
      const userAns = answers[ansKey] || "(no answer)";
      const correct = q.correctAnswer.trim().toLowerCase();
      const isCorrect = userAns.trim().toLowerCase() === correct;
      if (isCorrect) score += q.points;
      total += q.points;

      const p = document.createElement("p");
      p.innerHTML = `<strong>${i + 1}. ${q.question}</strong><br>
      Your answer: <span class="${isCorrect ? 'correct' : 'incorrect'}">${userAns}</span><br>
      Correct: <span class="correct">${q.correctAnswer}</span>`;
      section.appendChild(p);
    });

    resultBox.appendChild(section);
  });

  const summary = document.createElement("h2");
  summary.textContent = `Final Score: ${score} / ${total}`;
  resultBox.prepend(summary);

  quizForm.innerHTML = "";
  nextPartBtn.style.display = "none";
  submitBtn.style.display = "none";
}
