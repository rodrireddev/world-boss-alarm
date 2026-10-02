export interface WorldBoss {
  id: string
  name: string
  timestamp: number
  location?: string
}

export interface HelltidesSchedule {
  world_boss: unknown[]
}