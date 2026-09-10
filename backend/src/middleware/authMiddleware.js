"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            const user = await User_1.User.findById(decoded.id).select('-passwordHash');
            if (!user) {
                res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not found' } });
                return;
            }
            req.user = user;
            next();
        }
        catch (error) {
            res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authorized, token failed' } });
        }
    }
    else {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authorized, no token' } });
    }
};
exports.protect = protect;
//# sourceMappingURL=authMiddleware.js.map