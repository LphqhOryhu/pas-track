export interface StepEntry {
  id: string
  user_id: string
  date: string
  count: number
}

export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  role: UserRole
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly'

export interface LeaderboardRow {
  userId: string
  username: string
  avatarUrl: string | null
  total: number
}
