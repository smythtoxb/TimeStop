
// ===== ЭЛЕМЕНТТЕР =====
const hoursInput = document.getElementById("hours");
const minutesInput = document.getElementById("minutes");
const secondsInput = document.getElementById("seconds");

const timerProgress = document.getElementById("timerProgress");
const timerMessage = document.getElementById("timerMessage");

const finishPopup = document.getElementById("finishPopup");
const closeFinish = document.getElementById("closeFinish");
const continueFinish = document.getElementById("continueFinish");

const toast = document.getElementById("toast");

// ===== ХАБАРЛАМА =====
let toastTimeout;

function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// ===== ДЫБЫС =====
let audioContext;

function unlockAudio() {
    try {
        if (!audioContext) {
            audioContext = new (
                window.AudioContext || window.webkitAudioContext
            )();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }
    } catch (error) {
        console.log("Дыбысты қосу мүмкін болмады:", error);
    }
}

function playFinishedSound() {
    try {
        if (!audioContext) return;

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const notes = [523.25, 659.25, 783.99, 1046.5];

        notes.forEach((frequency, index) => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();

            oscillator.type = "sine";
            oscillator.frequency.value = frequency;

            oscillator.connect(gain);
            gain.connect(audioContext.destination);

            const startTime = audioContext.currentTime + index * 0.18;

            gain.gain.setValueAtTime(0.15, startTime);
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                startTime + 0.35
            );

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.35);
        });
    } catch (error) {
        console.log("Дыбыс ойнатылмады:", error);
    }
}

// ===== GIF ТЕРЕЗЕСІ =====
function showFinishPopup() {
    finishPopup?.classList.add("show");
    playFinishedSound();
}

function hideFinishPopup() {
    finishPopup?.classList.remove("show");
}

closeFinish?.addEventListener("click", hideFinishPopup);
continueFinish?.addEventListener("click", hideFinishPopup);

// ===== ТАЙМЕР =====
let timerInterval = null;
let timerRemaining = 0;
let timerTotal = 0;

function getInputTime() {
    const h = Math.max(0, Number(hoursInput.value) || 0);
    const m = Math.max(0, Number(minutesInput.value) || 0);
    const s = Math.max(0, Number(secondsInput.value) || 0);

    return h * 3600 + m * 60 + s;
}

function updateTimerDisplay() {
    const h = Math.floor(timerRemaining / 3600);
    const m = Math.floor((timerRemaining % 3600) / 60);
    const s = timerRemaining % 60;

    hoursInput.value = h;
    minutesInput.value = m;
    secondsInput.value = s;

    if (timerTotal > 0) {
        const progress =
            ((timerTotal - timerRemaining) / timerTotal) * 100;

        timerProgress.style.width = progress + "%";
    } else {
        timerProgress.style.width = "0%";
    }
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function startTimer() {
    if (timerInterval) return;

    unlockAudio();

    if (timerRemaining <= 0) {
        timerRemaining = getInputTime();
        timerTotal = timerRemaining;
    }

    if (timerRemaining <= 0) {
        showToast("Алдымен уақытты енгіз!");
        return;
    }

    hideFinishPopup();

    timerMessage.textContent = "Таймер жұмыс істеп тұр...";
    timerMessage.style.color = "#70eaff";

    timerInterval = setInterval(() => {
        timerRemaining--;

        updateTimerDisplay();

        if (timerRemaining <= 0) {
            stopTimer();

            timerRemaining = 0;
            timerTotal = 0;

            updateTimerDisplay();

            timerMessage.textContent = "Уақыт аяқталды!";
            showFinishPopup();

            showToast("Уақытың аяқталды! 🎉");
        }
    }, 1000);
}

function pauseTimer() {
    if (!timerInterval) return;

    stopTimer();
    timerMessage.textContent = "Таймер уақытша тоқтады";
}

function resetTimer() {
    stopTimer();

    timerRemaining = 0;
    timerTotal = 0;

    hoursInput.value = 0;
    minutesInput.value = 0;
    secondsInput.value = 0;

    timerProgress.style.width = "0%";
    timerMessage.textContent = "Іске қосуға дайын";

    hideFinishPopup();
}

document.getElementById("startTimer")
    .addEventListener("click", startTimer);

document.getElementById("pauseTimer")
    .addEventListener("click", pauseTimer);

document.getElementById("resetTimer")
    .addEventListener("click", resetTimer);

// ===== ЖЫЛДАМ ТАҢДАУ =====
document.querySelectorAll(".presets button").forEach(button => {
    button.addEventListener("click", () => {
        stopTimer();

        const minutes = Number(button.dataset.minutes);

        hoursInput.value = 0;
        minutesInput.value = minutes;
        secondsInput.value = 0;

        timerRemaining = minutes * 60;
        timerTotal = timerRemaining;

        updateTimerDisplay();

        timerMessage.textContent = "Іске қосуға дайын";
    });
});

// ===== САН ЕНГІЗУДІ ТҮЗЕТУ =====
const timeInputs = [
    hoursInput,
    minutesInput,
    secondsInput
];

timeInputs.forEach(input => {
    // 0 санын басқанда автоматты түрде өшіру
    input.addEventListener("focus", () => {
        if (input.value === "0") {
            input.value = "";
        }
    });

    // Өрістен шыққанда бос болса, 0 қою
    input.addEventListener("blur", () => {
        if (input.value === "") {
            input.value = "0";
        }

        updateInputTime();
    });

    // Сан енгізілген сайын уақытты жаңарту
    input.addEventListener("input", () => {
        updateInputTime();
    });
});

function updateInputTime() {
    if (timerInterval) {
        stopTimer();
    }

    timerRemaining = getInputTime();
    timerTotal = timerRemaining;

    if (timerTotal > 0) {
        timerProgress.style.width = "0%";
    } else {
        timerProgress.style.width = "0%";
    }

    timerMessage.textContent = "Іске қосуға дайын";
}

// ===== СЕКУНДОМЕР =====
let watchInterval = null;
let watchStart = 0;
let watchElapsed = 0;
let laps = [];

const stopwatchDisplay =
    document.getElementById("stopwatchDisplay");

const watchMessage =
    document.getElementById("watchMessage");

const watchIndicator =
    document.getElementById("watchIndicator");

const lapsList =
    document.getElementById("laps");

function formatWatch(time) {
    const centiseconds = Math.floor(time / 10) % 100;
    const seconds = Math.floor(time / 1000) % 60;
    const minutes = Math.floor(time / 60000) % 60;
    const hours = Math.floor(time / 3600000);

    return (
        String(hours).padStart(2, "0") + ":" +
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0") +
        "<small>." +
        String(centiseconds).padStart(2, "0") +
        "</small>"
    );
}

function updateWatch() {
    const currentTime =
        watchElapsed + (Date.now() - watchStart);

    stopwatchDisplay.innerHTML = formatWatch(currentTime);
}

function startWatch() {
    if (watchInterval) return;

    watchStart = Date.now();

    watchInterval = setInterval(updateWatch, 10);

    watchMessage.textContent = "Секундөлшегіш жұмыс істеп тұр";
    watchIndicator.style.background = "#50e6a8";
}

function pauseWatch() {
    if (!watchInterval) return;

    watchElapsed += Date.now() - watchStart;

    clearInterval(watchInterval);
    watchInterval = null;

    updateWatch();

    watchMessage.textContent = "Уақытша тоқтады";
    watchIndicator.style.background = "#596984";
}

function resetWatch() {
    clearInterval(watchInterval);

    watchInterval = null;
    watchElapsed = 0;
    watchStart = 0;

    stopwatchDisplay.innerHTML = formatWatch(0);

    watchMessage.textContent = "Іске қосуға дайын";
    watchIndicator.style.background = "#596984";

    laps = [];
    renderLaps();
}

function addLap() {
    if (!watchInterval && watchElapsed === 0) {
        showToast("Алдымен секундөлшегішті қос!");
        return;
    }

    const currentTime =
        watchElapsed +
        (watchInterval ? Date.now() - watchStart : 0);

    laps.push(currentTime);
    renderLaps();
}

function renderLaps() {
    lapsList.innerHTML = "";

    if (laps.length === 0) {
        lapsList.innerHTML =
            '<li class="empty-lap">Айналымдар осы жерде көрсетіледі</li>';
        return;
    }

    laps.forEach((lap, index) => {
        const li = document.createElement("li");

        const name = document.createElement("span");
        name.textContent = "Айналым " + (index + 1);

        const time = document.createElement("span");
        time.textContent = formatWatch(lap)
            .replace(/<small>|<\/small>/g, "");

        li.append(name, time);
        lapsList.appendChild(li);
    });
}

document.getElementById("startWatch")
    .addEventListener("click", startWatch);

document.getElementById("pauseWatch")
    .addEventListener("click", pauseWatch);

document.getElementById("resetWatch")
    .addEventListener("click", resetWatch);

document.getElementById("lapWatch")
    .addEventListener("click", addLap);

document.getElementById("clearLaps")
    .addEventListener("click", () => {
        laps = [];
        renderLaps();
    });

// ===== БАСТАПҚЫ КӨРІНІС =====
updateTimerDisplay();
renderLaps();
