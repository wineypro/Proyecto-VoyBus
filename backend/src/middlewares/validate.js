const AppError = require('../utils/AppError');

// Uso: router.get('/:id', validate(schema, 'params'), controller)
// source: 'body' | 'query' | 'params'
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'Datos inválidos', result.error.issues));
  }
  // En Express 5 req.query es de solo lectura: guardamos lo validado aparte
  req.valid = { ...(req.valid || {}), [source]: result.data };
  next();
};

module.exports = validate;