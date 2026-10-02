var ALARM_PREFIX = "worldboss-alarm-";
chrome.runtime.onInstalled.addListener(function () {
    console.log("World Boss Alarm instalado");
});
chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
    if (message.type === "SET_ALARM") {
        var bossId = message.bossId, timestamp = message.timestamp, minutesBefore = message.minutesBefore;
        var alarmTime = timestamp - minutesBefore * 60 * 1000;
        if (alarmTime <= Date.now()) {
            sendResponse({ success: false });
            return true;
        }
        chrome.alarms.create("".concat(ALARM_PREFIX).concat(bossId), {
            when: alarmTime
        });
        sendResponse({
            success: true,
            alarmTime: alarmTime
        });
        return true;
    }
});
chrome.alarms.onAlarm.addListener(function (alarm) {
    if (!alarm.name.startsWith(ALARM_PREFIX)) {
        return;
    }
    chrome.tabs.query({}, function (tabs) {
        for (var _i = 0, tabs_1 = tabs; _i < tabs_1.length; _i++) {
            var tab = tabs_1[_i];
            if (!tab.id)
                continue;
            chrome.tabs.sendMessage(tab.id, {
                type: "WORLD_BOSS_ALARM"
            }).catch(function () {
                // La pestaña puede no tener content script disponible.
            });
        }
    });
});
