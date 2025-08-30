"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.errorHandler = void 0;
const errorHandler = (err, _req, res, _next) => {
    let error = { ...err };
    error.message = err.message;
    console.error(err);
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = { message, statusCode: 404 };
    }
    if (err.name === 'MongoServerError' && err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = { message, statusCode: 400 };
    }
    if (err.message === 'User already exists with this email') {
        const message = err.message;
        error = { message, statusCode: 409 };
    }
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message).join(', ');
        error = { message, statusCode: 400 };
    }
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error'
    });
};
exports.errorHandler = errorHandler;
const notFound = (req, _res, next) => {
    const error = new Error(`Not found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};
exports.notFound = notFound;
//# sourceMappingURL=errorHandler.js.map