import type { CSSProperties } from 'react'

export type CosmeticType = 'nameplate' | 'background' | 'avatar_frame' | 'username'

export interface ShopItem {
  id: string
  type: CosmeticType
  name: string
  price: number
  value: string
  title: string | null
}

/** Colonnes `equipped_*` du profil. */
export interface EquippedIds {
  equipped_nameplate: string | null
  equipped_background: string | null
  equipped_avatar_frame: string | null
  equipped_username: string | null
}

export interface Cosmetics {
  nameplate?: ShopItem
  background?: ShopItem
  avatarFrame?: ShopItem
  username?: ShopItem
}

export const COSMETIC_LABELS: Record<CosmeticType, string> = {
  nameplate: 'Plaques',
  background: 'Fonds de profil',
  avatar_frame: "Cadres d'avatar",
  username: 'Pseudo & titres',
}

export const COSMETIC_ORDER: CosmeticType[] = ['nameplate', 'background', 'avatar_frame', 'username']

/** Résout les ids équipés d'un profil vers les objets ShopItem complets. */
export function resolveCosmetics(
  equipped: Partial<EquippedIds>,
  byId: Map<string, ShopItem>,
): Cosmetics {
  const get = (id: string | null | undefined) => (id ? byId.get(id) : undefined)
  return {
    nameplate: get(equipped.equipped_nameplate),
    background: get(equipped.equipped_background),
    avatarFrame: get(equipped.equipped_avatar_frame),
    username: get(equipped.equipped_username),
  }
}

/** Style à appliquer au pseudo (couleur unie ou dégradé clippé sur le texte). */
export function usernameStyle(item?: ShopItem): CSSProperties {
  if (!item) return {}
  if (item.value.includes('gradient')) {
    return {
      backgroundImage: item.value,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      color: 'transparent',
    }
  }
  return { color: item.value }
}
