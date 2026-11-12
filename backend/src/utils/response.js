// Formato único de respuestas exitosas: { data, meta }
const ok = (res, data, meta = {}, status = 200) => res.status(status).json({ data, meta });

module.exports = { ok };