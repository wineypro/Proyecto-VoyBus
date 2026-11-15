import { request } from './client';

export type FavoriteLineItem = {
  id: number;
  code: string;
  name: string;
  color: string;
  status: 'active' | 'suspended';
  origin: string;
  destination: string;
};

export type FavoriteStopItem = {
  id: number;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type UserFavorites = {
  lines: FavoriteLineItem[];
  stops: FavoriteStopItem[];
};

export type UserProfile = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  alias: string | null;
  photoUrl: string | null;
  pendingEmail: string | null;
  createdAt: string;
  favorites: UserFavorites;
};

export type UpdateProfilePayload = {
  name?: string;
  alias?: string | null;
  photoUrl?: string | null;
  email?: string;
};

export type TripHistoryItem = {
  id: number;
  date: string;
  lineCode: string;
  lineName: string;
  routeDirection: string;
  requestedStopName: string;
  finalStatus: string;
  closeReason: string;
};

export const getMyProfile = () => request<UserProfile>('/me');

export const updateMyProfile = (body: UpdateProfilePayload) =>
  request<UserProfile>('/me', { method: 'PATCH', body });

export const verifyMyNewEmail = (code: string) =>
  request<UserProfile>('/me/verify-email', { method: 'POST', body: { code } });

export const getMyFavorites = () => request<UserFavorites>('/me/favorites');

export const addFavoriteLine = (lineId: number) =>
  request<UserFavorites>(`/me/favorites/lines/${lineId}`, { method: 'POST' });

export const removeFavoriteLine = (lineId: number) =>
  request<UserFavorites>(`/me/favorites/lines/${lineId}`, { method: 'DELETE' });

export const addFavoriteStop = (stopId: number) =>
  request<UserFavorites>(`/me/favorites/stops/${stopId}`, { method: 'POST' });

export const removeFavoriteStop = (stopId: number) =>
  request<UserFavorites>(`/me/favorites/stops/${stopId}`, { method: 'DELETE' });

export const getMyHistory = (filters?: { date?: string; lineId?: string }) => {
  const params = new URLSearchParams();
  if (filters?.date?.trim()) params.set('date', filters.date.trim());
  if (filters?.lineId?.trim()) params.set('lineId', filters.lineId.trim());
  const qs = params.toString();
  return request<TripHistoryItem[]>(qs ? `/me/history?${qs}` : '/me/history');
};