/**
 * Custom error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  const errStatus = Number(err.status || err.statusCode);
  const statusCode = errStatus >= 400 && errStatus < 600 ? errStatus : (res.statusCode === 200 ? 500 : res.statusCode);
  const isProd = process.env.NODE_ENV === 'production';

  if (statusCode >= 500) {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.stack || err.message);
  }

  const message =
    statusCode === 413 ? 'Request is too large.' :
    statusCode >= 500 && isProd ? 'Internal Server Error' :
    err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    stack: isProd ? null : err.stack,
  });
};

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
