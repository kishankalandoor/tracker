"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const express_1 = require("express");
const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        success: false,
        error: {
            code: 'SERVER_ERROR',
            message: err.message,
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        },
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorMiddleware.js.map