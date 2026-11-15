// Preferencias de cuenta (ACC-06). No sabe nada de req/res.
// Se guardan como JSON en Users.preferences; lo que falte se completa con valores por defecto seguros.

const DEFAULTS = {
  language: 'es',
  theme: 'system',
  notifications: { serviceAlerts: false, favoriteLines: false, tips: false },
  privacy: { showRecentActivity: false, allowAnalytics: false },
};

// Mezcla por secciones: lo guardado pisa los valores por defecto, y el cambio pisa lo guardado.
function merge(base, extra = {}) {
  return {
    language: extra.language ?? base.language,
    theme: extra.theme ?? base.theme,
    notifications: { ...base.notifications, ...(extra.notifications ?? {}) },
    privacy: { ...base.privacy, ...(extra.privacy ?? {}) },
  };
}

function getPreferences(user) {
  return merge(DEFAULTS, user.preferences ?? {});
}

// Aplica un cambio parcial (ya validado) y devuelve las preferencias completas.
async function updatePreferences(user, patch) {
  const next = merge(getPreferences(user), patch);
  await user.update({ preferences: next });
  return next;
}

module.exports = { DEFAULTS, getPreferences, updatePreferences };
