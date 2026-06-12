export type QuestType = 'daily' | 'weekly' | 'monthly'

export interface QuestDef {
  type: QuestType
  label: string
  threshold: number
  reward: number
}

/**
 * Doit rester aligné avec la fonction SQL `claim_quest` (seuils + récompenses).
 * Le client ne fait qu'afficher la progression ; l'attribution est validée côté serveur.
 */
export const QUESTS: QuestDef[] = [
  { type: 'daily', label: 'Quotidienne', threshold: 7000, reward: 50 },
  { type: 'weekly', label: 'Hebdomadaire', threshold: 49000, reward: 300 },
  { type: 'monthly', label: 'Mensuelle', threshold: 7000 * 31, reward: 1500 },
]
