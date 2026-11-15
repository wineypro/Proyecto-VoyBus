import { request } from './client';

export type Preferences = {
  language: 'es';
  theme: 'light' | 'dark' | 'system';
  notifications: { serviceAlerts: boolean; favoriteLines: boolean; tips: boolean };
  privacy: { showRecentActivity: boolean; allowAnalytics: boolean };
};

// Cambio parcial: solo se envían las opciones que la persona modificó.
export type PreferencesPatch = {
  language?: Preferences['language'];
  theme?: Preferences['theme'];
  notifications?: Partial<Preferences['notifications']>;
  privacy?: Partial<Preferences['privacy']>;
};

// Valores seguros por defecto: nada se comparte ni se notifica hasta que la persona lo active.
export const DEFAULT_PREFERENCES: Preferences = {
  language: 'es',
  theme: 'system',
  notifications: { serviceAlerts: false, favoriteLines: false, tips: false },
  privacy: { showRecentActivity: false, allowAnalytics: false },
};

export const getPreferences = () => request<Preferences>('/auth/preferences');

export const updatePreferences = (patch: PreferencesPatch) =>
  request<Preferences>('/auth/preferences', { method: 'PATCH', body: patch });
