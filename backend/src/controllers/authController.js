"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const express_1 = require("express");
const User_1 = require("../models/User");
const generateToken_1 = __importDefault(require("../utils/generateToken"));
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    const userExists = await User_1.User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }
    const user = await User_1.User.create({
        name,
        email,
        passwordHash: password, // Pre-save hook hashes it
    });
    if (user) {
        res.status(201).json({
            success: true,
            data: {
                _id: user.id,
                name: user.name,
                email: user.email,
                token: (0, generateToken_1.default)(user.id),
            },
        });
    }
    else {
        res.status(400);
        throw new Error('Invalid user data');
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User_1.User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
        res.json({
            success: true,
            data: {
                _id: user.id,
                name: user.name,
                email: user.email,
                token: (0, generateToken_1.default)(user.id),
            },
        });
    }
    else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
};
exports.loginUser = loginUser;
//# sourceMappingURL=authController.js.map