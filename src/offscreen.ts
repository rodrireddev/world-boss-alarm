// Documento offscreen: reproduce la alarma cuando ninguna pestaña puede hacerlo.
chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "OFFSCREEN_PLAY_ALARM") return

  const audio = new Audio(chrome.runtime.getURL("default_alarm.mp3"))
  audio.volume = 1
  audio.addEventListener("ended", () => window.close())
  audio.play().catch((error) => {
    console.error("No se pudo reproducir la alarma:", error)
    window.close()
  })
})
