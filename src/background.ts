import type { WorldBoss } from "./types"

interface DemonlyWorldBoss {
  boss: string | null
  spawnAt: string
  zones: string[]
}

interface DemonlyResponse {
  data?: {
    worldBoss?: DemonlyWorldBoss[]
  }
}

const WORLD_BOSS_API = "https://demonly.net/api/worldstone/v1/events"
const UPDATE_ALARM = "worldboss-page-update"
const BOSS_ALARM_PREFIX = "worldboss-alarm-"
const STORAGE_KEY = "nextBoss"

// El service worker de MV3 se suspende: el estado vive en storage.
async function getBoss(): Promise<WorldBoss | null> {
  const stored = await chrome.storage.local.get(STORAGE_KEY)
  return (stored[STORAGE_KEY] as WorldBoss | undefined) ?? null
}

function broadcast(type: string, boss: WorldBoss | null) {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id !== undefined) {
        chrome.tabs.sendMessage(tab.id, { type, boss }).catch(() => {})
      }
    }
  })
}

function parseWorldBosses(bosses: DemonlyWorldBoss[]): WorldBoss[] {
  const results: WorldBoss[] = []

  for (const boss of bosses) {
    const timestamp = Date.parse(boss.spawnAt)
    if (Number.isNaN(timestamp)) continue

    results.push({
      id: `${boss.boss ?? "unknown"}-${timestamp}`,
      name: boss.boss ?? "World Boss",
      timestamp,
      location: Array.isArray(boss.zones) ? boss.zones.filter(Boolean).join(", ") : "",
    })
  }

  return results
}

async function updateWorldBoss() {
  try {
    const response = await fetch(WORLD_BOSS_API)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const { data } = (await response.json()) as DemonlyResponse
    if (!Array.isArray(data?.worldBoss)) {
      throw new Error("La respuesta no contiene data.worldBoss")
    }

    const now = Date.now()
    const next =
      parseWorldBosses(data.worldBoss)
        .filter((event) => event.timestamp > now)
        .sort((a, b) => a.timestamp - b.timestamp)[0] ?? null

    await chrome.storage.local.set({ [STORAGE_KEY]: next })
    broadcast("WORLD_BOSS_UPDATE", next)
  } catch (error) {
    console.error("Error consultando Demonly API:", error)
  }
}

async function setBossAlarm(minutesBefore: number): Promise<boolean> {
  const boss = await getBoss()
  if (!boss) return false

  const when = boss.timestamp - minutesBefore * 60_000
  if (when <= Date.now()) return false

  // Una sola alarma de boss activa a la vez.
  const alarms = await chrome.alarms.getAll()
  await Promise.all(
    alarms
      .filter((alarm) => alarm.name.startsWith(BOSS_ALARM_PREFIX))
      .map((alarm) => chrome.alarms.clear(alarm.name))
  )

  await chrome.alarms.create(`${BOSS_ALARM_PREFIX}${boss.id}`, { when })
  return true
}

function ensureUpdateAlarm() {
  chrome.alarms.get(UPDATE_ALARM, (alarm) => {
    if (!alarm) chrome.alarms.create(UPDATE_ALARM, { periodInMinutes: 5 })
  })
}

chrome.runtime.onInstalled.addListener(() => {
  ensureUpdateAlarm()
  updateWorldBoss()
})

chrome.runtime.onStartup.addListener(() => {
  ensureUpdateAlarm()
  updateWorldBoss()
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === UPDATE_ALARM) {
    await updateWorldBoss()
  } else if (alarm.name.startsWith(BOSS_ALARM_PREFIX)) {
    broadcast("WORLD_BOSS_ALARM", await getBoss())
  }
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_WORLD_BOSS") {
    getBoss().then((boss) => sendResponse({ boss }))
    return true
  }

  if (message.type === "SET_ALARM") {
    const minutesBefore = Number(message.minutesBefore)

    if (!Number.isFinite(minutesBefore) || minutesBefore < 0) {
      sendResponse({ success: false, error: "Tiempo de alarma inválido" })
      return
    }

    setBossAlarm(minutesBefore).then((success) =>
      sendResponse({ success, error: success ? undefined : "No hay World Boss o la hora ya pasó" })
    )
    return true
  }
})
