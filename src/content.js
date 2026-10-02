"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./content.css");
var ROOT_ID = "world-boss-alarm-root";
var boss = {
    name: "World Boss",
    timestamp: Date.now() + 60 * 60 * 1000
};
var interval;
function createUI() {
    var _a, _b, _c;
    if (document.getElementById(ROOT_ID)) {
        return;
    }
    var root = document.createElement("div");
    root.id = ROOT_ID;
    root.innerHTML = "\n    <div class=\"wba-header\">\n      <span>WORLD BOSS</span>\n\n      <button id=\"wba-hide\" title=\"Ocultar\">\n        \u2212\n      </button>\n    </div>\n\n    <div class=\"wba-boss-name\">\n      ".concat(boss.name, "\n    </div>\n\n    <div id=\"wba-countdown\" class=\"wba-countdown\">\n      00:00:00\n    </div>\n\n    <div class=\"wba-controls\">\n\n      <label>\n        Alarma\n        <select id=\"wba-alarm\">\n          <option value=\"30\">30 minutos antes</option>\n          <option value=\"15\">15 minutos antes</option>\n          <option value=\"5\">5 minutos antes</option>\n        </select>\n      </label>\n\n      <label class=\"wba-audio\">\n        M\u00FAsica\n        <input\n          id=\"wba-audio-input\"\n          type=\"file\"\n          accept=\"audio/*\"\n        />\n      </label>\n\n    </div>\n  ");
    document.documentElement.appendChild(root);
    (_a = document
        .getElementById("wba-hide")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", hideWidget);
    (_b = document
        .getElementById("wba-alarm")) === null || _b === void 0 ? void 0 : _b.addEventListener("change", configureAlarm);
    (_c = document
        .getElementById("wba-audio-input")) === null || _c === void 0 ? void 0 : _c.addEventListener("change", handleAudio);
    startCountdown();
}
function hideWidget() {
    var root = document.getElementById(ROOT_ID);
    if (!root)
        return;
    root.classList.add("wba-hidden");
    createShowButton();
}
function createShowButton() {
    if (document.getElementById("wba-show")) {
        return;
    }
    var button = document.createElement("button");
    button.id = "wba-show";
    button.textContent = "WB";
    button.addEventListener("click", function () {
        var _a;
        (_a = document.getElementById(ROOT_ID)) === null || _a === void 0 ? void 0 : _a.classList.remove("wba-hidden");
        button.remove();
    });
    document.documentElement.appendChild(button);
}
function startCountdown() {
    updateCountdown();
    if (interval) {
        clearInterval(interval);
    }
    interval = window.setInterval(updateCountdown, 1000);
}
function updateCountdown() {
    var element = document.getElementById("wba-countdown");
    if (!element)
        return;
    var remaining = boss.timestamp - Date.now();
    if (remaining <= 0) {
        element.textContent = "¡AHORA!";
        if (interval) {
            clearInterval(interval);
        }
        return;
    }
    var totalSeconds = Math.floor(remaining / 1000);
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    element.textContent =
        "".concat(String(hours).padStart(2, "0"), ":") +
            "".concat(String(minutes).padStart(2, "0"), ":") +
            "".concat(String(seconds).padStart(2, "0"));
}
function configureAlarm() {
    var select = document.getElementById("wba-alarm");
    if (!select)
        return;
    var minutesBefore = Number(select.value);
    chrome.runtime.sendMessage({
        type: "SET_ALARM",
        bossId: "test-boss",
        timestamp: boss.timestamp,
        minutesBefore: minutesBefore
    });
}
var audioUrl;
function handleAudio(event) {
    var _a;
    var input = event.target;
    var file = (_a = input.files) === null || _a === void 0 ? void 0 : _a[0];
    if (!file)
        return;
    if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
    }
    audioUrl = URL.createObjectURL(file);
    console.log("Audio seleccionado:", file.name);
}
chrome.runtime.onMessage.addListener(function (message) {
    if (message.type !== "WORLD_BOSS_ALARM") {
        return;
    }
    playAlarm();
});
function playAlarm() {
    if (!audioUrl) {
        console.log("¡WORLD BOSS!");
        return;
    }
    var audio = new Audio(audioUrl);
    audio.volume = 1;
    audio.play().catch(console.error);
}
createUI();
