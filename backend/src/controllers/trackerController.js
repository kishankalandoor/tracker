"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTrackerEntry = exports.getTrackerEntries = exports.createTracker = exports.getTrackers = void 0;
const express_1 = require("express");
const TrackerDefinition_1 = require("../models/TrackerDefinition");
const TrackerEntry_1 = require("../models/TrackerEntry");
const authMiddleware_1 = require("../middleware/authMiddleware");
const getTrackers = async (req, res) => {
    const trackers = await TrackerDefinition_1.TrackerDefinition.find({
        $or: [{ ownerId: req.user?._id }, { isTemplate: true }]
    });
    res.json({ success: true, data: trackers });
};
exports.getTrackers = getTrackers;
const createTracker = async (req, res) => {
    const { name, category, description, fields, isTemplate } = req.body;
    const tracker = await TrackerDefinition_1.TrackerDefinition.create({
        name,
        category,
        description,
        fields,
        ownerId: req.user?._id,
        isTemplate: isTemplate || false
    });
    res.status(201).json({ success: true, data: tracker });
};
exports.createTracker = createTracker;
const getTrackerEntries = async (req, res) => {
    const { trackerId } = req.params;
    const entries = await TrackerEntry_1.TrackerEntry.find({ trackerId, userId: req.user?._id }).sort({ date: -1 });
    res.json({ success: true, data: entries });
};
exports.getTrackerEntries = getTrackerEntries;
const createTrackerEntry = async (req, res) => {
    const { trackerId } = req.params;
    const { date, data } = req.body;
    const tracker = await TrackerDefinition_1.TrackerDefinition.findById(trackerId);
    if (!tracker) {
        res.status(404);
        throw new Error('Tracker not found');
    }
    const entry = await TrackerEntry_1.TrackerEntry.create({
        trackerId,
        userId: req.user?._id,
        date: date || Date.now(),
        data
    });
    res.status(201).json({ success: true, data: entry });
};
exports.createTrackerEntry = createTrackerEntry;
//# sourceMappingURL=trackerController.js.map