
class QuizApp {
  constructor() {
    (this.currentSection = "form"),
      (this.quizData = null),
      (this.questions = []),
      (this.currentQuestionIndex = 0),
      (this.userAnswers = []),
      (this.score = 0),
      (this.startTime = null),
      (this.timerInterval = null),
      (this.quizDuration = 0),
      (this.timeRemaining = 0),
      (this.quizReady = !1),
      (this.webhookURL =
        "https://hook.eu2.make.com/62ubza5bw3qs8q2li7ln8c2rkevo9u7q"),
      this.initializeEventListeners();
  }
  initializeEventListeners() {
    document.getElementById("quiz-form").addEventListener("submit", (e) => {
      e.preventDefault(), this.handleFormSubmission();
    });
    ["mcqCount", "trueFalseCount", "oneWordCount"].forEach((e) => {
      document.getElementById(e).addEventListener("input", () => {
        this.validateQuestionCounts();
      });
    }),
      document.getElementById("prev-btn").addEventListener("click", () => {
        this.previousQuestion();
      }),
      document.getElementById("next-btn").addEventListener("click", () => {
        this.nextQuestion();
      }),
      document
        .getElementById("submit-quiz-btn")
        .addEventListener("click", () => {
          this.submitQuiz();
        }),
      document.getElementById("restart-btn").addEventListener("click", () => {
        this.restartQuiz();
      }),
      document
        .getElementById("download-txt-btn")
        .addEventListener("click", () => {
          this.downloadTextFile();
        });
  }
  createQuizPrompt() {
    let e = document.getElementById("standard").value,
      t = document.getElementById("difficulty").value;
    return `You are a quiz generator. Generate a quiz on the topic: ${this.quizData.topic}, for a student of class ${e} and level ${t}.\nQuestion types:\n\nMCQs: ${this.quizData.mcqCount}\n\nTrue/False: ${this.quizData.trueFalseCount}\n\nOne-word: ${this.quizData.oneWordCount}\n\nStrictly respond in the following raw JSON format only (no text or explanation):\n\n{\n"mcq": [\n{\n"question": "string",\n"options": ["string", "string", "string", "string"],\n"answer": "string"\n}\n],\n"trueFalse": [\n{\n"question": "string",\n"answer": "True"\n}\n],\n"oneWord": [\n{\n"question": "string",\n"answer": "string"\n}\n]\n}`;
  }
  validateQuestionCounts() {
    const e =
      (parseInt(document.getElementById("mcqCount").value) || 0) +
      (parseInt(document.getElementById("trueFalseCount").value) || 0) +
      (parseInt(document.getElementById("oneWordCount").value) || 0),
      t = document.getElementById("questions-error");
    return e > 20
      ? ((t.textContent = "Total questions cannot exceed 20."),
        (t.style.display = "block"),
        !1)
      : 0 === e
        ? ((t.textContent = "At least one question is required."),
          (t.style.display = "block"),
          !1)
        : ((t.style.display = "none"), !0);
  }
  handleFormSubmission() {
    document.querySelectorAll(".error-message").forEach((e) => {
      e.style.display = "none";
    }),
      this.validateForm() &&
      ((this.quizData = {
        userName: document.getElementById("userName").value.trim(),
        topic: document.getElementById("topic").value.trim(),
        standard: document.getElementById("standard").value,
        difficulty: document.getElementById("difficulty").value,
        mcqCount: parseInt(document.getElementById("mcqCount").value) || 0,
        trueFalseCount:
          parseInt(document.getElementById("trueFalseCount").value) || 0,
        oneWordCount:
          parseInt(document.getElementById("oneWordCount").value) || 0,
      }),
        this.startCountdownAnimation());
  }
  validateForm() {
    let e = !0;
    return (
      ["userName", "topic", "standard", "difficulty"].forEach((t) => {
        const n = document.getElementById(t),
          s = document.getElementById(t + "-error");
        n.value.trim() ||
          ((s.textContent = "This field is required."),
            (s.style.display = "block"),
            (e = !1));
      }),
      this.validateQuestionCounts() || (e = !1),
      e
    );
  }
  startCountdownAnimation() {
    const e = document.getElementById("countdown-overlay"),
      t = document.getElementById("countdown-display");
    e.classList.remove("hidden"), this.generateQuizQuestions();

    // Add motivational text
    const motivationalText = document.createElement('div');
    motivationalText.style.cssText = `
      position: absolute;
      bottom: 20%;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-size: 1.2rem;
      text-align: center;
      font-weight: 500;
      opacity: 0.9;
      max-width: 90%;
    `;
    motivationalText.innerHTML = '🏆 Get over 84.4% and your name will show up as a quiz star! 🌟';
    e.appendChild(motivationalText);

    let n = 3;
    const s = setInterval(() => {
      n > 0
        ? ((t.textContent = n), (t.className = "countdown-number"), n--)
        : ((t.textContent = "Start!"),
          (t.className = "countdown-start"),
          setTimeout(() => {
            e.classList.add("hidden"), this.checkReadyToStart();
          }, 1e3),
          clearInterval(s));
    }, 1e3);
  }
  async generateQuizQuestions() {
    try {
      const e = this.createQuizPrompt(),
        t = await fetch(this.webhookURL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userMessage: e }),
        });
      if (!t.ok) throw new Error(`HTTP error! status: ${t.status}`);
      const n = await t.text();
      let s;
      try {
        s = JSON.parse(n).aiResponse || n;
      } catch {
        const e = n.match(/"aiResponse"\s*:\s*(.*)/s);
        if (!e) throw new Error("Could not extract AI response.");
        {
          let t = e[1].trim();
          t.endsWith("}") && (t = t.slice(0, -1)),
            t.startsWith('"') &&
            t.endsWith('"') &&
            (t = t.slice(1, -1).replace(/\\"/g, '"')),
            (s = t);
        }
      }
      const o = this.decodeGeminiResponse(s);
      (this.questions = this.convertToQuizFormat(o)),
        this.shuffleArray(this.questions),
        (this.userAnswers = new Array(this.questions.length).fill(null)),
        (this.quizDuration = 30 * this.questions.length),
        (this.timeRemaining = this.quizDuration),
        (this.quizReady = !0),
        this.checkReadyToStart();
    } catch (e) {
      this.handleQuizGenerationError(e);
    }
  }
  checkReadyToStart() {
    this.quizReady &&
      document
        .getElementById("countdown-overlay")
        .classList.contains("hidden") &&
      this.showQuizSection();
  }
  decodeGeminiResponse(e) {
    try {
      let t = e.trim();
      const n = t.indexOf("{"),
        s = t.lastIndexOf("}");
      if (-1 === n || -1 === s)
        throw new Error("No JSON object found in response");
      const o = t.substring(n, s + 1),
        i = JSON.parse(o);
      if (!i.mcq || !i.trueFalse || !i.oneWord)
        throw new Error("Invalid JSON structure");
      return i;
    } catch (e) {
      throw new Error("Invalid response from AI. Please try again.");
    }
  }
  convertToQuizFormat(e) {
    const t = [];
    return (
      e.mcq &&
      Array.isArray(e.mcq) &&
      e.mcq.forEach((e) => {
        const n = e.options ? e.options.indexOf(e.answer) : -1;
        t.push({
          type: "mcq",
          question: e.question,
          options: e.options,
          correct: n >= 0 ? n : 0,
        });
      }),
      e.trueFalse &&
      Array.isArray(e.trueFalse) &&
      e.trueFalse.forEach((e) => {
        t.push({
          type: "trueFalse",
          question: e.question,
          correct: "true" === e.answer.toLowerCase(),
        });
      }),
      e.oneWord &&
      Array.isArray(e.oneWord) &&
      e.oneWord.forEach((e) => {
        t.push({ type: "oneWord", question: e.question, correct: e.answer });
      }),
      t
    );
  }
  showLoadingState() {
    document.getElementById("form-section").style.display = "none";
    const e = document.createElement("div");
    (e.id = "loading-overlay"),
      (e.style.cssText =
        "\n                    position: fixed;\n                    top: 0;\n                    left: 0;\n                    width: 100%;\n                    height: 100%;\n                    background: linear-gradient(135deg, var(--dark-green), var(--accent-green));\n                    display: flex;\n                    flex-direction: column;\n                    align-items: center;\n                    justify-content: center;\n                    z-index: 1500;\n                    color: white;\n                "),
      (e.innerHTML =
        '\n                    <div style="font-family: \'Baloo Da 2\', cursive; font-size: 3rem; margin-bottom: 20px;">\n                        Generating Your Quiz...\n                    </div>\n                    <div style="font-size: 1.2rem; opacity: 0.8;">\n                        Please wait while we create personalized questions\n                    </div>\n                '),
      document.body.appendChild(e);
  }
  handleQuizGenerationError(e) {
    const t = document.getElementById("loading-overlay");
    t && t.remove();
    let n = "Unable to generate quiz questions. ";
    e.message.includes("Failed to fetch")
      ? (n =
        "Failed to connect to AI service. Please check your connection and try again.")
      : e.message.includes("Invalid response") ||
        e.message.includes("Could not extract")
        ? (n = "ReceiṼed invalid response from AI service. Please try again.")
        : (n += "Please try again or check your connection."),
      alert(n),
      (document.getElementById("form-section").style.display = "block");
  }
  shuffleArray(e) {
    for (let t = e.length - 1; t > 0; t--) {
      const n = Math.floor(Math.random() * (t + 1));
      [e[t], e[n]] = [e[n], e[t]];
    }
  }
  showQuizSection() {
    const e = document.getElementById("loading-overlay");
    e && e.remove(),
      (document.getElementById("form-section").style.display = "none"),
      (document.getElementById("quiz-section").style.display = "block"),
      document.getElementById("quiz-section").classList.add("fade-in"),
      (document.getElementById(
        "quiz-title"
      ).textContent = `${this.quizData.topic} Quiz - Class ${this.quizData.standard}`),
      (document.getElementById("total-questions").textContent =
        this.questions.length);
    const t = Math.floor(this.quizDuration / 60),
      n = this.quizDuration % 60;
    (document.getElementById("remaining-time").textContent = `${t
      .toString()
      .padStart(2, "0")}:${n.toString().padStart(2, "0")}`),
      (this.currentQuestionIndex = 0),
      this.displayCurrentQuestion(),
      this.updateNavigationButtons(),
      this.updateProgressBar(),
      this.startTimer();
  }
  displayCurrentQuestion() {
    const e = this.questions[this.currentQuestionIndex];
    (document.getElementById("current-question").textContent =
      this.currentQuestionIndex + 1),
      (document.getElementById("question-number").textContent = `Question ${this.currentQuestionIndex + 1
        }`),
      (document.getElementById("question-text").textContent = e.question);
    const t = document.getElementById("question-options");
    (t.innerHTML = ""),
      "mcq" === e.type
        ? this.renderMCQOptions(e, t)
        : "trueFalse" === e.type
          ? this.renderTrueFalseOptions(e, t)
          : "oneWord" === e.type && this.renderOneWordInput(e, t),
      this.updateProgressBar();
  }
  renderMCQOptions(e, t) {
    e.options.forEach((e, n) => {
      const s = document.createElement("div");
      s.className = "option";
      const o = document.createElement("input");
      (o.type = "radio"),
        (o.name = "mcq-answer"),
        (o.value = n),
        (o.id = `option-${n}`),
        this.userAnswers[this.currentQuestionIndex] === n &&
        ((o.checked = !0), s.classList.add("selected"));
      const i = document.createElement("label");
      (i.htmlFor = `option-${n}`),
        (i.textContent = e),
        (i.style.cursor = "pointer"),
        (i.style.flex = "1"),
        s.appendChild(o),
        s.appendChild(i),
        s.addEventListener("click", () => {
          t.querySelectorAll(".option").forEach((e) => {
            e.classList.remove("selected");
          }),
            s.classList.add("selected"),
            (o.checked = !0),
            (this.userAnswers[this.currentQuestionIndex] = n);
        }),
        t.appendChild(s);
    });
  }
  renderTrueFalseOptions(e, t) {
    ["True", "False"].forEach((e, n) => {
      const s = document.createElement("div");
      s.className = "option";
      const o = document.createElement("input");
      (o.type = "radio"),
        (o.name = "tf-answer"),
        (o.value = 0 === n),
        (o.id = `tf-option-${n}`),
        this.userAnswers[this.currentQuestionIndex] === (0 === n) &&
        ((o.checked = !0), s.classList.add("selected"));
      const i = document.createElement("label");
      (i.htmlFor = `tf-option-${n}`),
        (i.textContent = e),
        (i.style.cursor = "pointer"),
        (i.style.flex = "1"),
        s.appendChild(o),
        s.appendChild(i),
        s.addEventListener("click", () => {
          t.querySelectorAll(".option").forEach((e) => {
            e.classList.remove("selected");
          }),
            s.classList.add("selected"),
            (o.checked = !0),
            (this.userAnswers[this.currentQuestionIndex] = 0 === n);
        }),
        t.appendChild(s);
    });
  }
  renderOneWordInput(e, t) {
    const n = document.createElement("div");
    n.style.width = "100%";
    const s = document.createElement("input");
    (s.type = "text"),
      (s.className = "form-control"),
      (s.placeholder = "Enter your answer"),
      (s.style.fontSize = "1.1rem"),
      (s.style.textAlign = "center"),
      null !== this.userAnswers[this.currentQuestionIndex] &&
      (s.value = this.userAnswers[this.currentQuestionIndex]),
      s.addEventListener("input", () => {
        this.userAnswers[this.currentQuestionIndex] = s.value.trim();
      }),
      n.appendChild(s),
      t.appendChild(n),
      setTimeout(() => s.focus(), 100);
  }
  updateNavigationButtons() {
    const e = document.getElementById("prev-btn"),
      t = document.getElementById("next-btn"),
      n = document.getElementById("submit-quiz-btn");
    e.disabled = 0 === this.currentQuestionIndex;
    this.currentQuestionIndex === this.questions.length - 1
      ? ((t.style.display = "none"), (n.style.display = "block"))
      : ((t.style.display = "block"), (n.style.display = "none"));
  }
  updateProgressBar() {
    const e = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
    document.getElementById("progress-bar").style.width = `${e}%`;
  }
  previousQuestion() {
    this.currentQuestionIndex > 0 &&
      (this.currentQuestionIndex--,
        this.displayCurrentQuestion(),
        this.updateNavigationButtons());
  }
  nextQuestion() {
    this.currentQuestionIndex < this.questions.length - 1 &&
      (this.currentQuestionIndex++,
        this.displayCurrentQuestion(),
        this.updateNavigationButtons());
  }
  submitQuiz() {
    this.stopTimer(), this.calculateScore(), this.showResultsSection();
  }
  calculateScore() {
    let e = 0;
    this.questions.forEach((t, n) => {
      const s = this.userAnswers[n];
      "mcq" === t.type || "trueFalse" === t.type
        ? s === t.correct && e++
        : "oneWord" === t.type &&
        s &&
        s.toLowerCase() === t.correct.toLowerCase() &&
        e++;
    }),
      (this.score = {
        correct: e,
        wrong: this.questions.length - e,
        total: this.questions.length,
        percentage: Math.round((e / this.questions.length) * 100),
      });
  }
  showResultsSection() {

    (document.getElementById("quiz-section").style.display = "none"),
      (document.getElementById("results-section").style.display = "block"),
      document.getElementById("results-section").classList.add("fade-in");
    this.score.percentage;
    const {
      status: e,
      grade: t,
      message: n,
    } = this.calculateGradeAndStatus(this.score.percentage);
    (document.getElementById("results-status").textContent = e),
      (document.getElementById("results-name").textContent =
        this.quizData.userName),
      (document.getElementById(
        "results-subject"
      ).textContent = `${this.quizData.topic} Quiz - Class ${this.quizData.standard}`),
      (document.getElementById(
        "final-score"
      ).textContent = `${this.score.percentage}%`),
      (document.getElementById("results-grade").textContent = t),
      (document.getElementById("total-questions-result").textContent =
        this.score.total),
      (document.getElementById("correct-answers-result").textContent =
        this.score.correct),
      (document.getElementById("wrong-answers-result").textContent =
        this.score.wrong),
      (document.getElementById(
        "score-percentage-result"
      ).textContent = `${this.score.percentage}%`);
    const s = document.querySelector(".results-card");
    this.score.percentage >= 90
      ? (s.style.background = "linear-gradient(135deg, #27ae60, #2ecc71)")
      : this.score.percentage >= 75
        ? (s.style.background = "linear-gradient(135deg, #3498db, #2980b9)")
        : this.score.percentage >= 60
          ? (s.style.background = "linear-gradient(135deg, #f39c12, #e67e22)")
          : this.score.percentage >= 33
            ? (s.style.background = "linear-gradient(135deg, #f1c40f, #f39c12)")
            : (s.style.background = "linear-gradient(135deg, #e74c3c, #c0392b)");

    // Check if user scored above 84.4% to show shoutout option
    if (this.score.percentage > 84.4) {
      setTimeout(() => {
        this.showShoutoutModal();
      }, 1000);
    }
  }
  calculateGradeAndStatus(e) {
    return e >= 90
      ? {
        status: "Outstanding Performance!",
        grade: "Grade A+",
        message: "Exceptional work! You've mastered this topic.",
      }
      : e >= 75
        ? {
          status: "Excellent Work!",
          grade: "Grade A",
          message: "Great job! You have a strong understanding.",
        }
        : e >= 60
          ? {
            status: "Good Progress!",
            grade: "Grade B",
            message: "Well done! Keep practicing to improve further.",
          }
          : e >= 50
            ? {
              status: "Fair Attempt!",
              grade: "Grade C",
              message: "You're on the right track. Review and try again.",
            }
            : e >= 33
              ? {
                status: "Passed!",
                grade: "Grade D",
                message: "You passed! Consider reviewing the material.",
              }
              : {
                status: "Need More Practice!",
                grade: "Grade F",
                message: "Don't give up! Review the topics and try again.",
              };
  }
  startTimer() {
    (this.startTime = new Date()),
      (this.timeRemaining = this.quizDuration),
      (this.timerInterval = setInterval(() => {
        this.updateTimer();
      }, 1e3));
  }
  stopTimer() {
    this.timerInterval &&
      (clearInterval(this.timerInterval), (this.timerInterval = null));
  }
  updateTimer() {
    const e = new Date(),
      t = Math.floor((e - this.startTime) / 1e3);
    this.timeRemaining = Math.max(0, this.quizDuration - t);
    const n = Math.floor(t / 60),
      s = t % 60;
    document.getElementById("elapsed-time").textContent = `${n
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    const o = Math.floor(this.timeRemaining / 60),
      i = this.timeRemaining % 60,
      r = document.getElementById("remaining-time");
    (r.textContent = `${o.toString().padStart(2, "0")}:${i
      .toString()
      .padStart(2, "0")}`),
      this.timeRemaining <= 60
        ? r.classList.add("timer-warning")
        : r.classList.remove("timer-warning"),
      this.timeRemaining <= 0 &&
      (this.stopTimer(),
        alert("Time is up! Your quiz will be submitted automatically."),
        this.submitQuiz());
  }
  downloadTextFile() {
    const e = this.generateTextFileContent(),
      t = new Blob([e], { type: "text/plain" }),
      n = URL.createObjectURL(t),
      s = document.createElement("a");
    (s.href = n),
      (s.download = `${this.quizData.userName.replace(
        /\s+/g,
        "_"
      )}_Quiz_Result_${new Date().toISOString().split("T")[0]}.txt`),
      document.body.appendChild(s),
      s.click(),
      document.body.removeChild(s),
      URL.revokeObjectURL(n);
  }
  generateTextFileContent() {
    const e = new Date(),
      t = e.toLocaleDateString(),
      n = e.toLocaleTimeString();
    let s = "";
    s += "============================================================\n";
    s += "                   VED – QUIZ GENERATOR                    \n"; // Replaced Ṽ with V
    s += "                  * QUIZ RESULTS REPORT *                 \n"; // Replaced ✦ with *
    s += "============================================================\n\n";
    s += "STUDENT INFORMATION\n"; // Removed 👤
    s += "------------------------------------------------------------\n";
    s += `Name             : ${this.quizData.userName}\n`;
    s += `Topic            : ${this.quizData.topic}\n`;
    s += `Class/Standard   : ${this.quizData.standard}\n`;
    s += `Difficulty Level : ${this.quizData.difficulty.charAt(0).toUpperCase() +
      this.quizData.difficulty.slice(1)
      }\n`;
    s += `Date             : ${t}\n`;
    s += `Time             : ${n}\n\n`;
    s += "QUIZ SUMMARY\n";
    s += "------------------------------------------------------------\n";
    s += `Total Questions  : ${this.score.total}\n`;
    s += `Correct Answers  : ${this.score.correct}\n`;
    s += `Wrong Answers    : ${this.score.wrong}\n`;
    s += `Final Score      : ${this.score.percentage}%\n\n`;
    s += "PERFORMANCE FEEDBACK\n";
    s += "------------------------------------------------------------\n";
    this.score.percentage >= 90
      ? (s += "Excellent! Outstanding performance.\n")
      : this.score.percentage >= 75
        ? (s += "Very Good! Keep up the great work.\n")
        : this.score.percentage >= 60
          ? (s += "Good! Room for improvement.\n")
          : (s += "Needs Improvement. Consider reviewing the topic.\n");
    s += "\n";
    s += "DETAILED QUESTION REVIEW\n";
    s += "============================================================\n\n";
    this.questions.forEach((e, t) => {
      s += `Q${t + 1}. ${e.question}\n`;
      const n = this.userAnswers[t];
      let o = "",
        i = "",
        r = !1;
      "mcq" === e.type
        ? ((s += "Options:\n"),
          e.options.forEach((t, o) => {
            const i = o === e.correct ? " [Correct]" : "", // Replaced ✅
              r = n === o ? " [Your Answer]" : "";
            s += `  ${String.fromCharCode(65 + o)}. ${t}${i}${r}\n`;
          }),
          (o = null !== n ? e.options[n] : "No answer provided"),
          (i = e.options[e.correct]),
          (r = n === e.correct))
        : "trueFalse" === e.type
          ? ((s += "Options:\n"),
            (s += `  True${!0 === e.correct ? " [Correct]" : ""}${!0 === n ? " [Your Answer]" : ""
              }\n`),
            (s += `  False${!1 === e.correct ? " [Correct]" : ""}${!1 === n ? " [Your Answer]" : ""
              }\n\n`),
            (o = null !== n ? (n ? "True" : "False") : "No answer provided"),
            (i = e.correct ? "True" : "False"),
            (r = n === e.correct))
          : "oneWord" === e.type &&
          ((o = n || "No answer provided"),
            (i = e.correct),
            (r = n && n.toLowerCase() === e.correct.toLowerCase()));
      s += `Your Answer     : ${o}\n`;
      s += `Correct Answer  : ${i}\n`;
      s += `Result          : ${r ? "CORRECT" : "INCORRECT"}\n`; // Replaced ✓ and ✗
      s += "------------------------------------------------------------\n\n";
    });
    const o = this.questions.filter((e) => "mcq" === e.type).length,
      i = this.questions.filter((e) => "trueFalse" === e.type).length,
      r = this.questions.filter((e) => "oneWord" === e.type).length;
    s += "QUESTION TYPE BREAKDOWN\n";
    s += "------------------------------------------------------------\n";
    o > 0 && (s += `Multiple Choice Questions : ${o}\n`);
    i > 0 && (s += `True/False Questions      : ${i}\n`);
    r > 0 && (s += `One-word Questions        : ${r}\n`);
    s += "\n";
    s += "============================================================\n";
    s += "         Generated by VED – Quiz Generator\n"; // Ṽ replaced again
    s += `              ${t} at ${n}\n`;
    s += "        Developed with dedication by Anish Bairagi\n";
    s += "============================================================\n";
    return s;
  }

  preparePrintContent() {
    document.getElementById("print-content");
    (document.getElementById(
      "print-participant-info"
    ).textContent = `Participant: ${this.quizData.userName} | Topic: ${this.quizData.topic} | Class: ${this.quizData.standard} | Difficulty: ${this.quizData.difficulty}`),
      (document.getElementById(
        "print-date"
      ).textContent = `Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`),
      (document.getElementById("print-total-questions").textContent =
        this.score.total),
      (document.getElementById("print-correct-answers").textContent =
        this.score.correct),
      (document.getElementById("print-wrong-answers").textContent =
        this.score.wrong),
      (document.getElementById(
        "print-final-score"
      ).textContent = `${this.score.percentage}%`);
    const e = document.getElementById("print-questions-list");
    (e.innerHTML = ""),
      this.questions.forEach((t, n) => {
        const s = document.createElement("div");
        s.className = "print-question";
        const o = document.createElement("div");
        (o.className = "print-question-number"),
          (o.textContent = `Question ${n + 1}`);
        const i = document.createElement("div");
        (i.className = "print-question-text"), (i.textContent = t.question);
        const r = this.userAnswers[n];
        let a = "",
          c = "",
          d = !1;
        "mcq" === t.type
          ? ((a = null !== r ? t.options[r] : "No answer"),
            (c = t.options[t.correct]),
            (d = r === t.correct))
          : "trueFalse" === t.type
            ? ((a = null !== r ? (r ? "True" : "False") : "No answer"),
              (c = t.correct ? "True" : "False"),
              (d = r === t.correct))
            : "oneWord" === t.type &&
            ((a = r || "No answer"),
              (c = t.correct),
              (d = r && r.toLowerCase() === t.correct.toLowerCase()));
        const u = document.createElement("div");
        (u.className =
          "print-answer " + (d ? "print-correct" : "print-incorrect")),
          (u.innerHTML = `<strong>Your Answer:</strong> ${a}`);
        const l = document.createElement("div");
        (l.className = "print-answer"),
          (l.innerHTML = `<strong>Correct Answer:</strong> ${c}`),
          s.appendChild(o),
          s.appendChild(i),
          s.appendChild(u),
          s.appendChild(l),
          e.appendChild(s);
      });
  }
  restartQuiz() {
    this.stopTimer(),
      (this.currentSection = "form"),
      (this.quizData = null),
      (this.questions = []),
      (this.currentQuestionIndex = 0),
      (this.userAnswers = []),
      (this.score = 0),
      (this.startTime = null),
      (this.timeRemaining = this.quizDuration),
      (this.quizReady = !1),
      document.getElementById("quiz-form").reset(),
      (document.getElementById("mcqCount").value = 5),
      (document.getElementById("trueFalseCount").value = 3),
      (document.getElementById("oneWordCount").value = 2),
      (document.getElementById("results-section").style.display = "none"),
      (document.getElementById("quiz-section").style.display = "none"),
      (document.getElementById("form-section").style.display = "block"),
      document.getElementById("form-section").classList.add("fade-in"),
      document.querySelectorAll(".error-message").forEach((e) => {
        e.style.display = "none";
      });
  }
  sendResultsToWebhook() {
    this.quizData.userName,
      this.quizData.topic,
      this.quizData.standard,
      this.quizData.difficulty,
      this.score.total,
      this.score.correct,
      this.score.wrong,
      this.score.percentage,
      new Date().toISOString();
  }

  showShoutoutModal() {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'shoutout-modal-overlay';
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      animation: fadeIn 0.3s ease-in;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 20px;
      padding: 30px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease-out;
    `;

    modalContent.innerHTML = `
      <div style="margin-bottom: 25px;">
        <h2 style="color: #27ae60; font-size: 1.8rem; margin-bottom: 10px;">🎉 Outstanding Performance!</h2>
        <p style="color: #666; font-size: 1rem; margin-bottom: 15px;">
          You scored ${this.score.percentage}%! 
        </p>
        <p style="color: #333; font-size: 1.1rem; font-weight: 500;">
          Would you like to be featured in our shoutout banner as "${this.quizData.userName}"?
        </p>
      </div>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="shoutout-submit-btn" style="
          background: linear-gradient(135deg, #27ae60, #2ecc71);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
        ">Yes, Feature Me!</button>
        <button id="shoutout-cancel-btn" style="
          background: #95a5a6;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
        ">No Thanks</button>
      </div>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Add event listeners
    const submitBtn = document.getElementById('shoutout-submit-btn');
    const cancelBtn = document.getElementById('shoutout-cancel-btn');

    // Submit shoutout using the already provided name
    submitBtn.addEventListener('click', () => {
      this.submitShoutout(this.quizData.userName, modalOverlay);
    });

    // Cancel shoutout
    cancelBtn.addEventListener('click', () => {
      this.closeShoutoutModal(modalOverlay);
    });

    // Close on escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeShoutoutModal(modalOverlay);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        this.closeShoutoutModal(modalOverlay);
      }
    });
  }

  async submitShoutout(userName, modalOverlay) {
    const submitBtn = document.getElementById('shoutout-submit-btn');
    const originalText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
      const response = await fetch("https://hook.eu2.make.com/bn0xylyvsvqn0ljmvkon97lymaoyqka9", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName,
          percentage: this.score.percentage,
          topic: this.quizData.topic
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.showCongratulationsMessage(modalOverlay);

    } catch (error) {
      console.error("Error submitting shoutout:", error);
      alert(`Error submitting shoutout: ${error.message}`);
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  showCongratulationsMessage(modalOverlay) {
    // Update modal content to show congratulations
    const modalContent = modalOverlay.querySelector('div');
    modalContent.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 4rem; margin-bottom: 20px;">🎉</div>
        <h2 style="color: #27ae60; font-size: 2rem; margin-bottom: 15px;">Congratulations!</h2>
        <p style="color: #333; font-size: 1.2rem; margin-bottom: 10px; font-weight: 500;">
          Your achievement has been submitted!
        </p>
        <p style="color: #666; font-size: 1rem; margin-bottom: 25px;">
          You might see your name in our shoutout banner soon. Keep up the excellent work!
        </p>
        <button onclick="this.closest('#shoutout-modal-overlay').remove()" style="
          background: linear-gradient(135deg, #27ae60, #2ecc71);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
        ">Awesome!</button>
      </div>
    `;

    // Auto-close after 5 seconds
    setTimeout(() => {
      if (modalOverlay.parentNode) {
        this.closeShoutoutModal(modalOverlay);
      }
    }, 5000);
  }

  closeShoutoutModal(modalOverlay) {
    modalOverlay.style.opacity = '0';
    setTimeout(() => {
      if (modalOverlay.parentNode) {
        modalOverlay.parentNode.removeChild(modalOverlay);
      }
    }, 300);
  }
}
document.addEventListener("DOMContentLoaded", () => {
  new QuizApp();
}),
  fetch(
    "https://opensheet.vercel.app/1AkEjmMgbF0zAX6hfWgm6_TYk-5gBqdWVltc_6er9SBA/Sheet1"
  )
    .then((e) => e.json())
    .then((e) => {
      if (!e || !e.length) return;
      const t = e[0];
      if ("TRUE" !== t.shutdown) {
        if ("TRUE" === t.showBanner) {
          const e = document.createElement("div");
          (e.id = "simple-banner"),
            (e.style =
              "\n          position: fixed;\n          bottom: 20px;\n          right: 20px;\n          background-color: #fef08a;\n          color: #1a202c;\n          padding: 1rem 1.25rem;\n          border-radius: 10px;\n          box-shadow: 0 4px 12px rgba(0,0,0,0.15);\n          font-family: sans-serif;\n          max-width: 300px;\n          z-index: 9999;\n        "),
            (e.innerHTML = `\n          <div style="font-weight: bold;">${t.bannerHeading}</div>\n          <div>${t.bannerMessage}</div>\n          <div onclick="this.parentElement.remove()" style="\n            position: absolute;\n            top: 6px;\n            right: 10px;\n            cursor: pointer;\n            font-weight: bold;\n            font-size: 1.1rem;\n          ">×</div>\n        `),
            document.body.appendChild(e);
        }
      } else
        document.body.innerHTML =
          '\n          <div style="display:flex;justify-content:center;align-items:center;height:100vh;text-align:center;font-family:sans-serif;padding:2rem;background:#111827;color:#f3f4f6;">\n            <div>\n              <h1 style="font-size:2rem;margin-bottom:1rem;">🛠️ Under Maintenance</h1>\n              <p style="font-size:1.2rem;">Our tool is currently undergoing maintenance.<br>Please check back shortly.</p><br><strong>~Anish Bairagi</strong>\n            </div>\n          </div>';
    });
