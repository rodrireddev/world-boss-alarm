import type { WorldBoss } from "./types"

const ROOT_ID = "world-boss-alarm-root"
const ICON_POSITION_KEY = "iconPosition"

const DEFAULT_ALARM_URL =
  chrome.runtime.getURL("default_alarm.mp3")

const LOGO_URL = chrome.runtime.getURL("logo.png")

let boss: WorldBoss | null = null
let interval: number | undefined
let audioUrl: string | undefined

let host: HTMLDivElement | null = null
let shadow: ShadowRoot | null = null

// ============================================================
// DRAG DEL BOTÓN
// ============================================================

let isDragging = false
let dragStarted = false
let dragTimer: number | undefined

let dragOffsetX = 0
let dragOffsetY = 0

// ============================================================
// CREAR UI
// ============================================================

function createUI() {
  if (document.getElementById(ROOT_ID)) {
    return
  }

  host = document.createElement("div")
  host.id = ROOT_ID

  Object.assign(host.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "0",
    height: "0",
    margin: "0",
    padding: "0",
    border: "0",
    zIndex: "2147483647"
  })

  shadow = host.attachShadow({
    mode: "open"
  })

  shadow.innerHTML = `
    <style>
      * {
        box-sizing: border-box;
      }

      .widget {
        position: fixed;

        top: 20px;
        right: 20px;

        width: 300px;

        padding: 16px;

        background: #111;
        color: #fff;

        border: 1px solid #444;
        border-radius: 12px;

        font-family:
          Arial,
          Helvetica,
          sans-serif;

        box-shadow:
          0 8px 30px rgba(0, 0, 0, 0.5);
      }

      .hidden {
        display: none;
      }

      .header {
        display: flex;

        align-items: center;
        justify-content: space-between;

        margin-bottom: 12px;

        font-size: 13px;
        font-weight: bold;

        letter-spacing: 1px;
      }

      .hide {
        width: 28px;
        height: 28px;

        padding: 0;
        margin: 0;

        border: 0;
        border-radius: 6px;

        background: #333;
        color: #fff;

        font-size: 18px;
        line-height: 28px;

        cursor: pointer;
      }

      .boss-name {
        font-size: 20px;
        font-weight: bold;

        margin-bottom: 4px;
      }

      .location {
        min-height: 18px;

        color: #aaa;

        font-size: 13px;

        margin-bottom: 12px;
      }

      .countdown {
        margin: 12px 0 18px;

        text-align: center;

        font-size: 32px;
        font-weight: bold;

        font-variant-numeric:
          tabular-nums;
      }

      .controls {
        display: flex;

        flex-direction: column;

        gap: 12px;
      }

      label {
        display: flex;

        flex-direction: column;

        gap: 5px;

        color: #aaa;

        font-size: 12px;
      }

      select,
      input[type="file"] {
        width: 100%;

        padding: 7px;

        border: 1px solid #444;
        border-radius: 6px;

        background: #222;
        color: #fff;

        font-size: 12px;
      }

      /* ======================================================
         BOTÓN MINIMIZADO
         ====================================================== */

      .show-button {
        position: fixed;

        top: 20px;
        right: 20px;

        width: 48px;
        height: 48px;

        padding: 0;
        margin: 0;

        border: none;
        outline: none;

        border-radius: 50%;

        overflow: hidden;

        background: transparent;

        cursor: pointer;

        display: flex;

        align-items: center;
        justify-content: center;

        z-index: 2147483647;

        appearance: none;
        -webkit-appearance: none;

        touch-action: none;
        user-select: none;
      }

      /* ======================================================
         LOGO
         ====================================================== */

      .show-button img {
        display: block;

        width: 48px;
        height: 48px;

        margin: 0;
        padding: 0;

        border: none;
        outline: none;

        background: transparent;

        border-radius: 50%;

        object-fit: cover;

        box-shadow: none;

        pointer-events: none;
      }
    </style>

    <!-- =====================================================
         PANEL
         ===================================================== -->

    <div
      id="widget"
      class="widget hidden"
    >

      <div class="header">
        <span>WORLD BOSS</span>

        <button
          id="hide"
          class="hide"
          type="button"
          title="Ocultar"
        >
          −
        </button>
      </div>

      <div
        id="boss-name"
        class="boss-name"
      >
        Cargando...
      </div>

      <div
        id="location"
        class="location"
      ></div>

      <div
        id="countdown"
        class="countdown"
      >
        --:--:--
      </div>

      <div class="controls">

        <label>
          Alarma

          <select id="alarm">
            <option value="30">
              30 minutos antes
            </option>

            <option value="15">
              15 minutos antes
            </option>

            <option value="5">
              5 minutos antes
            </option>
          </select>
        </label>

        <label>
          Música

          <input
            id="audio"
            type="file"
            accept="audio/*"
          />
        </label>

      </div>

    </div>

    <!-- =====================================================
         BOTÓN MINIMIZADO
         ===================================================== -->

    <button
      id="show"
      class="show-button"
      type="button"
      title="Mostrar World Boss"
    >
      <img
        id="logo"
        src="${LOGO_URL}"
        alt="World Boss"
      />
    </button>
  `

  document.documentElement.appendChild(host)

  // ==========================================================
  // BOTÓN OCULTAR
  // ==========================================================

  const hideButton =
    shadow.getElementById("hide")

  hideButton?.addEventListener(
    "click",
    hideWidget
  )

  // ==========================================================
  // BOTÓN MOSTRAR / DRAG
  // ==========================================================

  const showButton =
    shadow.getElementById("show")

  if (showButton) {
    showButton.addEventListener(
      "pointerdown",
      handlePointerDown
    )

    showButton.addEventListener(
      "pointermove",
      handlePointerMove
    )

    showButton.addEventListener(
      "pointerup",
      handlePointerUp
    )

    showButton.addEventListener(
      "pointercancel",
      handlePointerUp
    )
  }

  // ==========================================================
  // SELECT DE ALARMA
  // ==========================================================

  const alarm =
    shadow.getElementById("alarm")

  alarm?.addEventListener(
    "change",
    configureAlarm
  )

  // ==========================================================
  // SELECTOR DE AUDIO
  // ==========================================================

  const audio =
    shadow.getElementById("audio")

  audio?.addEventListener(
    "change",
    handleAudio
  )

  // ==========================================================
  // DEBUG DEL LOGO
  // ==========================================================

  // ==========================================================
  // CARGAR BOSS
  // ==========================================================

  restoreIconPosition()
  loadBoss()
}

// ============================================================
// POSICIÓN DEL ICONO (se guarda y se restaura entre recargas)
// ============================================================

function saveIconPosition() {
  const button = getShowButton()

  if (!button) {
    return
  }

  const rect = button.getBoundingClientRect()

  chrome.storage.local
    .set({ [ICON_POSITION_KEY]: { left: rect.left, top: rect.top } })
    .catch(() => {})
}

async function restoreIconPosition() {
  const button = getShowButton()

  if (!button) {
    return
  }

  try {
    const stored = await chrome.storage.local.get(ICON_POSITION_KEY)
    const position = stored[ICON_POSITION_KEY] as
      | { left: number; top: number }
      | undefined

    if (
      !position ||
      !Number.isFinite(position.left) ||
      !Number.isFinite(position.top)
    ) {
      return
    }

    // Si la ventana es más pequeña que cuando se guardó, mantenerlo visible.
    const maxLeft = Math.max(0, window.innerWidth - button.offsetWidth)
    const maxTop = Math.max(0, window.innerHeight - button.offsetHeight)

    button.style.left = `${Math.min(Math.max(0, position.left), maxLeft)}px`
    button.style.top = `${Math.min(Math.max(0, position.top), maxTop)}px`
    button.style.right = "auto"
  } catch {
    // Sin acceso a storage: se queda en la posición por defecto.
  }
}

// ============================================================
// OBTENER BOTÓN
// ============================================================

function getShowButton():
  HTMLButtonElement | null {
  return shadow?.getElementById(
    "show"
  ) as HTMLButtonElement | null
}

// ============================================================
// INICIAR POINTER
// ============================================================

function handlePointerDown(
  event: PointerEvent
) {
  const button =
    getShowButton()

  if (!button) {
    return
  }

  dragStarted = false

  const rect =
    button.getBoundingClientRect()

  dragOffsetX =
    event.clientX - rect.left

  dragOffsetY =
    event.clientY - rect.top

  if (dragTimer !== undefined) {
    clearTimeout(dragTimer)
  }

  dragTimer =
    window.setTimeout(() => {
      isDragging = true
      dragStarted = true

      button.style.cursor =
        "grabbing"

      button.setPointerCapture(
        event.pointerId
      )
    }, 300)
}

// ============================================================
// MOVER BOTÓN
// ============================================================

function handlePointerMove(
  event: PointerEvent
) {
  if (!isDragging) {
    return
  }

  const button =
    getShowButton()

  if (!button) {
    return
  }

  const newLeft =
    event.clientX -
    dragOffsetX

  const newTop =
    event.clientY -
    dragOffsetY

  const maxLeft =
    window.innerWidth -
    button.offsetWidth

  const maxTop =
    window.innerHeight -
    button.offsetHeight

  button.style.left =
    `${Math.max(
      0,
      Math.min(
        newLeft,
        maxLeft
      )
    )}px`

  button.style.top =
    `${Math.max(
      0,
      Math.min(
        newTop,
        maxTop
      )
    )}px`

  button.style.right =
    "auto"
}

// ============================================================
// TERMINAR POINTER
// ============================================================

function handlePointerUp(
  event: PointerEvent
) {
  if (dragTimer !== undefined) {
    clearTimeout(dragTimer)
    dragTimer = undefined
  }

  const button =
    getShowButton()

  if (button) {
    button.style.cursor =
      "pointer"

    if (
      button.hasPointerCapture(
        event.pointerId
      )
    ) {
      button.releasePointerCapture(
        event.pointerId
      )
    }
  }

  if (isDragging) {
    isDragging = false
    dragStarted = false

    saveIconPosition()

    return
  }

  if (!dragStarted) {
    showWidget()
  }

  dragStarted = false
}

// ============================================================
// CARGAR WORLD BOSS
// ============================================================

function loadBoss() {
  chrome.runtime.sendMessage(
    {
      type: "GET_WORLD_BOSS"
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error obteniendo World Boss:",
          chrome.runtime.lastError.message
        )

        return
      }

      applyAlarmMinutes(response?.alarmMinutes)

      if (!response?.boss) {
        return
      }

      boss = response.boss

      updateBossUI()
      startCountdown()
    }
  )
}

// Muestra en el selector la alarma guardada.
function applyAlarmMinutes(minutes: unknown) {
  const select =
    shadow?.getElementById("alarm") as HTMLSelectElement | null

  if (select && minutes !== undefined) {
    select.value = String(minutes)
  }
}

// ============================================================
// ACTUALIZAR UI
// ============================================================

function updateBossUI() {
  if (!boss || !shadow) {
    return
  }

  const name =
    shadow.getElementById(
      "boss-name"
    )

  if (name) {
    name.textContent =
      boss.name
  }

  const location =
    shadow.getElementById(
      "location"
    )

  if (location) {
    location.textContent =
      boss.location ?? ""
  }
}

// ============================================================
// OCULTAR WIDGET
// ============================================================

function hideWidget() {
  if (!shadow) {
    return
  }

  const widget =
    shadow.getElementById(
      "widget"
    )

  const show =
    shadow.getElementById(
      "show"
    )

  widget?.classList.add(
    "hidden"
  )

  if (show) {
    show.style.display =
      "flex"
  }
}

// ============================================================
// MOSTRAR WIDGET
// ============================================================

function showWidget() {
  if (!shadow) {
    return
  }

  const widget =
    shadow.getElementById(
      "widget"
    ) as HTMLDivElement | null

  const show =
    shadow.getElementById(
      "show"
    ) as HTMLButtonElement | null

  if (!widget || !show) {
    return
  }

  // ==========================================================
  // OBTENER POSICIÓN REAL DEL ICONO
  // ==========================================================

  const rect =
    show.getBoundingClientRect()


  // ==========================================================
  // MOSTRAR PANEL TEMPORALMENTE
  // ==========================================================

  widget.classList.remove(
    "hidden"
  )

  // ==========================================================
  // OBTENER TAMAÑO REAL
  // ==========================================================

  const widgetRect =
    widget.getBoundingClientRect()

  const widgetWidth =
    widgetRect.width

  const widgetHeight =
    widgetRect.height

  // ==========================================================
  // EMPEZAR EN LA POSICIÓN DEL ICONO
  // ==========================================================

  let left =
    rect.left

  let top =
    rect.top

  // ==========================================================
  // AJUSTAR BORDE DERECHO
  // ==========================================================

  if (
    left + widgetWidth >
    window.innerWidth
  ) {
    left =
      window.innerWidth -
      widgetWidth -
      10
  }

  // ==========================================================
  // AJUSTAR BORDE INFERIOR
  // ==========================================================

  if (
    top + widgetHeight >
    window.innerHeight
  ) {
    top =
      window.innerHeight -
      widgetHeight -
      10
  }

  // ==========================================================
  // AJUSTAR BORDE IZQUIERDO
  // ==========================================================

  left =
    Math.max(
      10,
      left
    )

  // ==========================================================
  // AJUSTAR BORDE SUPERIOR
  // ==========================================================

  top =
    Math.max(
      10,
      top
    )


  // ==========================================================
  // FORZAR POSICIÓN
  // ==========================================================

  widget.style.setProperty(
    "left",
    `${left}px`,
    "important"
  )

  widget.style.setProperty(
    "top",
    `${top}px`,
    "important"
  )

  widget.style.setProperty(
    "right",
    "auto",
    "important"
  )

  widget.style.setProperty(
    "bottom",
    "auto",
    "important"
  )

  // ==========================================================
  // OCULTAR ICONO
  // ==========================================================

  show.style.display =
    "none"
}

// ============================================================
// COUNTDOWN
// ============================================================

function startCountdown() {
  updateCountdown()

  if (interval) {
    clearInterval(interval)
  }

  interval =
    window.setInterval(
      updateCountdown,
      1000
    )
}

function updateCountdown() {
  if (!boss || !shadow) {
    return
  }

  const element =
    shadow.getElementById(
      "countdown"
    )

  if (!element) {
    return
  }

  const remaining =
    boss.timestamp -
    Date.now()

  if (remaining <= 0) {
    element.textContent =
      "¡AHORA!"

    if (interval) {
      clearInterval(interval)
    }

    return
  }

  const totalSeconds =
    Math.floor(
      remaining / 1000
    )

  const hours =
    Math.floor(
      totalSeconds / 3600
    )

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60
    )

  const seconds =
    totalSeconds % 60

  element.textContent =
    `${String(hours).padStart(2, "0")}:` +
    `${String(minutes).padStart(2, "0")}:` +
    `${String(seconds).padStart(2, "0")}`
}

// ============================================================
// CONFIGURAR ALARMA
// ============================================================

function configureAlarm() {
  if (!boss || !shadow) {
    return
  }

  const select =
    shadow.getElementById(
      "alarm"
    ) as HTMLSelectElement | null

  if (!select) {
    return
  }

  const minutesBefore =
    Number(select.value)

  chrome.runtime.sendMessage(
    {
      type: "SET_ALARM",

      bossId:
        boss.id,

      timestamp:
        boss.timestamp,

      minutesBefore
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error configurando alarma:",
          chrome.runtime.lastError.message
        )

        return
      }

      if (!response?.success) {
        console.error(
          "No se pudo configurar la alarma:",
          response?.error
        )

        return
      }

    }
  )
}

// ============================================================
// AUDIO PERSONALIZADO
// ============================================================

function handleAudio(
  event: Event
) {
  const input =
    event.target as HTMLInputElement

  const file =
    input.files?.[0]

  if (!file) {
    return
  }

  if (audioUrl) {
    URL.revokeObjectURL(
      audioUrl
    )
  }

  audioUrl =
    URL.createObjectURL(file)

}

// ============================================================
// REPRODUCIR ALARMA
// ============================================================

// Devuelve si sonó: el autoplay puede bloquearse si no hubo interacción en la página.
async function playAlarm(): Promise<boolean> {
  const selectedAudio =
    audioUrl ??
    DEFAULT_ALARM_URL

  const audio =
    new Audio(selectedAudio)

  audio.volume = 1

  try {
    await audio.play()
    return true
  } catch (error) {
    console.error(
      "No se pudo reproducir la alarma:",
      error
    )
    return false
  }
}

// ============================================================
// MENSAJES DEL BACKGROUND
// ============================================================

chrome.runtime.onMessage
  .addListener(
    (message, _sender, sendResponse) => {
      if (
        message.type ===
        "WORLD_BOSS_UPDATE"
      ) {
        boss =
          message.boss

        applyAlarmMinutes(message.alarmMinutes)
        updateBossUI()
        startCountdown()

        return
      }

      if (
        message.type ===
        "WORLD_BOSS_ALARM"
      ) {
        playAlarm().then((played) =>
          sendResponse({ played })
        )

        return true
      }
    }
  )

// ============================================================
// INICIAR
// ============================================================

createUI()
