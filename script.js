const $ = (id) => document.getElementById(id);

// Небольшое уведомление внизу страницы
let toastTimeout;
function notify(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2400);
}

// ---------- ТАЙМЕР ----------
let timerRemaining = 0;       // миллисекунды
let timerTotal = 0;
let timerDeadline = 0;
let timerInterval = null;
let timerFinished = false;

function readTimerInputs() {
  const fields = [$("hours"), $("minutes"), $("seconds")];
  const values = fields.map(field => field.value.trim());
  const nums = values.map(Number);

  if (values.some(v => v === "") || nums.some(n => !Number.isInteger(n) || n < 0) ||
      nums[0] > 99 || nums[1] > 59 || nums[2] > 59) {
    $("timerMessage").textContent = "Проверь часы, минуты и секунды.";
    return null;
  }
  return nums[0] * 3600 + nums[1] * 60 + nums[2];
}

function setTimerInputs(totalSeconds) {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  $("hours").value = Math.floor(seconds / 3600);
  $("minutes").value = Math.floor((seconds % 3600) / 60);
  $("seconds").value = seconds % 60;
}

function renderTimer() {
  const remainingSeconds = Math.max(0, Math.ceil(timerRemaining / 1000));
  setTimerInputs(remainingSeconds);
  const percent = timerTotal > 0 ? Math.max(0, timerRemaining / timerTotal * 100) : 100;
  $("timerProgress").style.width = `${percent}%`;
}

function stopTimerInterval() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function timerTick() {
  timerRemaining = Math.max(0, timerDeadline - Date.now());
  renderTimer();
  if (timerRemaining <= 0) {
    stopTimerInterval();
    timerFinished = true;
    $("timerMessage").textContent = "✓ Время вышло! Отличная работа.";
    $("timerProgress").style.width = "0%";
    notify("Время вышло!");
    // Звуковой сигнал при окончании таймера
try {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (AudioContextClass) {
    const ctx = new AudioContextClass();

    const playBeep = (frequency, startTime, duration) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.03);
      gain.gain.setValueAtTime(0.3, startTime + duration - 0.05);
      gain.gain.linearRampToValueAtTime(0.001, startTime + duration);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(() => {
        const now = ctx.currentTime;
        playBeep(880, now, 0.3);
        playBeep(880, now + 0.4, 0.3);
        setTimeout(() => ctx.close(), 1200);
      });
    } else {
      const now = ctx.currentTime;
      playBeep(880, now, 0.3);
      playBeep(880, now + 0.4, 0.3);
      setTimeout(() => ctx.close(), 1200);
    }
  }
} catch (error) {
  console.log("Не удалось воспроизвести сигнал:", error);
}
  }
}

$("startTimer").addEventListener("click", () => {
  if (timerInterval !== null) return;

  if (timerRemaining <= 0 || timerFinished) {
    const seconds = readTimerInputs();
    if (seconds === null) return;
    if (seconds <= 0) {
      $("timerMessage").textContent = "Сначала установи время больше нуля.";
      notify("Установи время больше нуля");
      return;
    }
    timerRemaining = seconds * 1000;
    timerTotal = timerRemaining;
    timerFinished = false;
  }

  timerDeadline = Date.now() + timerRemaining;
  $("timerMessage").textContent = "Таймер запущен — сосредоточься на главном.";
  timerInterval = setInterval(timerTick, 100);
  timerTick();
});

$("pauseTimer").addEventListener("click", () => {
  if (timerInterval === null) {
    $("timerMessage").textContent = "Таймер уже на паузе.";
    return;
  }
  timerRemaining = Math.max(0, timerDeadline - Date.now());
  stopTimerInterval();
  renderTimer();
  $("timerMessage").textContent = "Отсчёт приостановлен.";
});

$("resetTimer").addEventListener("click", () => {
  stopTimerInterval();
  timerRemaining = 0;
  timerTotal = 0;
  timerFinished = false;
  $("hours").value = 0;
  $("minutes").value = 5;
  $("seconds").value = 0;
  $("timerProgress").style.width = "100%";
  $("timerMessage").textContent = "Готов к запуску";
});

document.querySelectorAll("[data-minutes]").forEach(button => {
  button.addEventListener("click", () => {
    stopTimerInterval();
    const minutes = Number(button.dataset.minutes);
    $("hours").value = Math.floor(minutes / 60);
    $("minutes").value = minutes % 60;
    $("seconds").value = 0;
    timerRemaining = 0;
    timerTotal = 0;
    timerFinished = false;
    $("timerProgress").style.width = "100%";
    $("timerMessage").textContent = `Выбрано ${minutes} мин. Готов к запуску.`;
  });
});

[$("hours"), $("minutes"), $("seconds")].forEach(input => {
  input.addEventListener("input", () => {
    if (timerInterval !== null) {
      stopTimerInterval();
      timerRemaining = 0;
      timerTotal = 0;
      timerFinished = false;
      $("timerMessage").textContent = "Время изменено. Нажми «Старт».";
      $("timerProgress").style.width = "100%";
    }
  });
});

// ---------- СЕКУНДОМЕР ----------
let watchElapsed = 0;
let watchStartedAt = 0;
let watchInterval = null;
let lapStartElapsed = 0;
let lapNumber = 0;

function elapsedWatchMs() {
  return watchElapsed + (watchInterval !== null ? Date.now() - watchStartedAt : 0);
}

function formatStopwatch(milliseconds) {
  const totalCs = Math.floor(milliseconds / 10);
  const centiseconds = totalCs % 100;
  const totalSeconds = Math.floor(totalCs / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  return {
    main: [hours, minutes, seconds].map(n => String(n).padStart(2, "0")),
    cs: String(centiseconds).padStart(2, "0")
  };
}

function renderWatch() {
  const t = formatStopwatch(elapsedWatchMs());
  $("stopwatchDisplay").innerHTML =
    `${t.main[0]}<span>:</span>${t.main[1]}<span>:</span>${t.main[2]}<small>.${t.cs}</small>`;
}

function renderWatchStatus() {
  $("watchIndicator").classList.toggle("running", watchInterval !== null);
}

$("startWatch").addEventListener("click", () => {
  if (watchInterval !== null) return;
  watchStartedAt = Date.now();
  watchInterval = setInterval(renderWatch, 30);
  $("watchMessage").textContent = "Секундомер работает";
  renderWatchStatus();
});

$("pauseWatch").addEventListener("click", () => {
  if (watchInterval === null) {
    $("watchMessage").textContent = "Секундомер уже на паузе";
    return;
  }
  watchElapsed += Date.now() - watchStartedAt;
  clearInterval(watchInterval);
  watchInterval = null;
  renderWatch();
  renderWatchStatus();
  $("watchMessage").textContent = "Секундомер приостановлен";
});

$("resetWatch").addEventListener("click", () => {
  if (watchInterval !== null) clearInterval(watchInterval);
  watchInterval = null;
  watchElapsed = 0;
  lapStartElapsed = 0;
  lapNumber = 0;
  renderWatch();
  renderWatchStatus();
  $("watchMessage").textContent = "Готов к запуску";
  $("laps").innerHTML = '<li class="empty-lap">Круги появятся здесь после запуска</li>';
});

$("lapWatch").addEventListener("click", () => {
  if (watchInterval === null) {
    notify("Сначала запусти секундомер");
    $("watchMessage").textContent = "Запусти секундомер, чтобы записать круг.";
    return;
  }
  const current = elapsedWatchMs();
  const lapTime = current - lapStartElapsed;
  lapStartElapsed = current;
  lapNumber++;

  const empty = $("laps").querySelector(".empty-lap");
  if (empty) empty.remove();

  const full = formatStopwatch(current);
  const lap = formatStopwatch(lapTime);
  const li = document.createElement("li");
  const label = document.createElement("span");
  const total = document.createElement("span");
  label.textContent = `Круг ${lapNumber} · +${lap.main.join(":")}.${lap.cs}`;
  total.textContent = full.main.join(":") + "." + full.cs;
  li.append(label, total);
  $("laps").prepend(li);
});

$("clearLaps").addEventListener("click", () => {
  lapNumber = 0;
  lapStartElapsed = elapsedWatchMs();
  $("laps").innerHTML = '<li class="empty-lap">Круги очищены — продолжай отсчёт</li>';
});

renderTimer();
renderWatch();
renderWatchStatus();
