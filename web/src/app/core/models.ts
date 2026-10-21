export interface Platform {
  id: number;
  slug: string;
  name: string;
}
export interface Game {
  id: number;
  slug: string;
  title: string;
  region: string;
  releaseYear: number | null;
  coverUrl: string | null;
  platform: Platform;
}
export interface GamePage {
  items: Game[];
  total: number;
  page: number;
  pageSize: number;
}
export const STATUSES = [
  { value: 'WISHLIST', label: 'Lista de deseos' },
  { value: 'BACKLOG', label: 'Pendiente' },
  { value: 'PLAYING', label: 'Jugando' },
  { value: 'ON_HOLD', label: 'En pausa' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'ABANDONED', label: 'Abandonado' },
] as const;
export type BacklogStatus = (typeof STATUSES)[number]['value'];
export interface CollectionItem {
  id: number;
  game: Game;
  status: BacklogStatus;
  owned: boolean;
  ownedCondition: string | null;
  personalRating: number | null;
  hoursPlayed: string | null;
  notes: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}
export function statusLabel(value: BacklogStatus) {
  return STATUSES.find((s) => s.value === value)?.label ?? value;
}

// The API searches title_norm. Match the catalog's normalization for queries.
export function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
