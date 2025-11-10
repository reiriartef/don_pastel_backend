export function notFound(req, res, next) {
  res.status(404).json({ success: false, message: 'Recurso no encontrado' });
}

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);
  if (res.headersSent) return;
  const status = err.status || 500;
  res.status(status).json({ success: false, message: err.publicMessage || 'Error interno del servidor' });
}
