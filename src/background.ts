interface WorldBoss {
  id: string
  name: string
  timestamp: number
  location?: string
}

interface DemonlyWorldBoss {
  boss: string | null
  spawnAt: string
  zones: string[]
  confidence: string
}

interface DemonlyResponse {
  ok: boolean
  source: string
  fetchedAt: string
  generatedAt: string
  data: {
    worldBoss: DemonlyWorldBoss[]
    helltides: unknown[]
    legions: unknown[]
    realmwalkers: unknown[]
  }
}

const WORLD_BOSS_API =
  "https://demonly.net/api/worldstone/v1/events"

const UPDATE_ALARM = "worldboss-page-update"
const BOSS_ALARM_PREFIX = "worldboss-alarm-"

let nextBoss: WorldBoss | null = null

// ==========================================
// INSTALACIÓN
// ==========================================

chrome.runtime.onInstalled.addListener(() => {
  console.log("==========================================")
  console.log("World Boss Alarm instalado")
  console.log("==========================================")

  chrome.alarms.create(UPDATE_ALARM, {
    periodInMinutes: 5,
  })

  updateWorldBoss()
})

// ==========================================
// INICIO DEL NAVEGADOR
// ==========================================

chrome.runtime.onStartup.addListener(() => {
  updateWorldBoss()
})

// ==========================================
// ALARMAS
// ==========================================

chrome.alarms.onAlarm.addListener(async (alarm) => {
  // Actualización periódica
  if (alarm.name === UPDATE_ALARM) {
    await updateWorldBoss()
    return
  }

  // Alarma del World Boss
  if (alarm.name.startsWith(BOSS_ALARM_PREFIX)) {
    console.log("==========================================")
    console.log("🔔 ALARMA DEL WORLD BOSS")
    console.log("==========================================")

    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id === undefined) {
          continue
        }

        chrome.tabs
          .sendMessage(tab.id, {
            type: "WORLD_BOSS_ALARM",
            boss: nextBoss,
          })
          .catch(() => {})
      }
    })
  }
})

// ==========================================
// MENSAJES
// ==========================================

chrome.runtime.onMessage.addListener(
  (message, _sender, sendResponse) => {
    // --------------------------------------
    // Obtener próximo World Boss
    // --------------------------------------

    if (message.type === "GET_WORLD_BOSS") {
      sendResponse({
        boss: nextBoss,
      })

      return true
    }

    // --------------------------------------
    // Configurar alarma
    // --------------------------------------

    if (message.type === "SET_ALARM") {
      const minutesBefore = Number(
        message.minutesBefore
      )

      if (!nextBoss) {
        sendResponse({
          success: false,
          error: "No hay World Boss",
        })

        return true
      }

      if (
        !Number.isFinite(minutesBefore) ||
        minutesBefore < 0
      ) {
        sendResponse({
          success: false,
          error: "Tiempo de alarma inválido",
        })

        return true
      }

      const success = setBossAlarm(minutesBefore)

      sendResponse({
        success,
      })

      return true
    }
  }
)

// ==========================================
// ACTUALIZAR WORLD BOSS
// ==========================================

async function updateWorldBoss() {
  try {
    console.log("==========================================")
    console.log("Consultando API de Demonly...")
    console.log("URL:", WORLD_BOSS_API)

    const response = await fetch(WORLD_BOSS_API)

    console.log("HTTP:", response.status)
    console.log("OK:", response.ok)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data =
      (await response.json()) as DemonlyResponse

    console.log("Respuesta Demonly:", data)

    if (
      !data.data ||
      !Array.isArray(data.data.worldBoss)
    ) {
      throw new Error(
        "La respuesta no contiene data.worldBoss"
      )
    }

    console.log(
      "World Bosses encontrados:",
      data.data.worldBoss.length
    )

    const events = parseWorldBosses(
      data.data.worldBoss
    )

    console.log("Eventos válidos:", events)

    const now = Date.now()

    const futureEvents = events
      .filter((event) => event.timestamp > now)
      .sort(
        (a, b) =>
          a.timestamp - b.timestamp
      )

    if (futureEvents.length === 0) {
      console.warn(
        "No hay World Bosses futuros."
      )

      nextBoss = null

      notifyTabs()

      return
    }

    nextBoss = futureEvents[0]

    console.log("==========================================")
    console.log("PRÓXIMO WORLD BOSS")
    console.log(nextBoss)
    console.log("==========================================")

    logBossTime(nextBoss)

    notifyTabs()
  } catch (error) {
    console.error(
      "Error consultando Demonly API:",
      error
    )
  }
}

// ==========================================
// PARSEAR WORLD BOSSES
// ==========================================

function parseWorldBosses(
  bosses: DemonlyWorldBoss[]
): WorldBoss[] {
  const results: WorldBoss[] = []

  for (const boss of bosses) {
    if (!boss.spawnAt) {
      console.warn(
        "World Boss sin spawnAt:",
        boss
      )

      continue
    }

    const timestamp = Date.parse(
      boss.spawnAt
    )

    if (Number.isNaN(timestamp)) {
      console.warn(
        "spawnAt inválido:",
        boss.spawnAt
      )

      continue
    }

    const location = Array.isArray(
      boss.zones
    )
      ? boss.zones
          .filter(Boolean)
          .join(", ")
      : ""

    const event: WorldBoss = {
      id: `${boss.boss ?? "unknown"}-${timestamp}`,

      // Si Demonly todavía no conoce el boss,
      // mostramos "World Boss"
      name: boss.boss ?? "World Boss",

      // spawnAt ya viene en ISO UTC.
      // Date.parse() lo convierte correctamente
      // al timestamp absoluto.
      timestamp,

      location,
    }

    console.log(
      "World Boss convertido:",
      {
        original: boss.spawnAt,

        timestamp,

        local: new Date(
          timestamp
        ).toString(),

        iso: new Date(
          timestamp
        ).toISOString(),

        name: event.name,

        location: event.location,
      }
    )

    results.push(event)
  }

  return results
}

// ==========================================
// MOSTRAR INFORMACIÓN DEL BOSS
// ==========================================

function logBossTime(
  boss: WorldBoss
) {
  const date = new Date(
    boss.timestamp
  )

  const remaining =
    boss.timestamp - Date.now()

  console.log("------------------------------------------")
  console.log("Boss:", boss.name)
  console.log(
    "Timestamp:",
    boss.timestamp
  )
  console.log(
    "Fecha local:",
    date.toString()
  )
  console.log(
    "ISO:",
    date.toISOString()
  )
  console.log(
    "Ubicación:",
    boss.location
  )
  console.log(
    "Tiempo restante:",
    remaining,
    "ms"
  )
  console.log(
    "Tiempo restante:",
    (
      remaining /
      1000 /
      60
    ).toFixed(2),
    "minutos"
  )
  console.log("------------------------------------------")
}

// ==========================================
// CONFIGURAR ALARMA
// ==========================================

function setBossAlarm(
  minutesBefore: number
): boolean {
  if (!nextBoss) {
    console.warn(
      "No hay World Boss para configurar alarma."
    )

    return false
  }

  const alarmTime =
    nextBoss.timestamp -
    minutesBefore * 60 * 1000

  if (alarmTime <= Date.now()) {
    console.warn(
      "La hora de alarma ya pasó."
    )

    return false
  }

  const alarmName =
    `${BOSS_ALARM_PREFIX}${nextBoss.id}`

  chrome.alarms.clear(
    alarmName,
    () => {
      chrome.alarms.create(
        alarmName,
        {
          when: alarmTime,
        }
      )
    }
  )

  console.log("==========================================")
  console.log("ALARMA CONFIGURADA")
  console.log("Boss:", nextBoss.name)
  console.log(
    "Minutos antes:",
    minutesBefore
  )
  console.log(
    "Hora del boss:",
    new Date(
      nextBoss.timestamp
    ).toString()
  )
  console.log(
    "Hora de alarma:",
    new Date(
      alarmTime
    ).toString()
  )
  console.log("==========================================")

  return true
}

// ==========================================
// NOTIFICAR A LAS PESTAÑAS
// ==========================================

function notifyTabs() {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id === undefined) {
        continue
      }

      chrome.tabs
        .sendMessage(tab.id, {
          type: "WORLD_BOSS_UPDATE",
          boss: nextBoss,
        })
        .catch(() => {})
    }
  })
}