function errorHandler(err, req, res, next) {
    console.error(err);
    const status = (() => {
        if (err.name === 'ValidationError') return 400;
        if (err.code && err.code === 11000) return 409;
        if (err.name === 'CastError') return 400;
        return 500;
    })();

    const payload = {
        success: false,
        error: err.message || 'Server Error'
    };

    if (process.env.NODE_ENV === 'development') {
        payload.stack = err.stack;
    }

    res.status(status).json(payload);
}

module.exports = errorHandler;
