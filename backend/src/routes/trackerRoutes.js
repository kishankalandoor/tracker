"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const trackerController_1 = require("../controllers/trackerController");
const router = express_1.default.Router();
router.route('/')
    .get(authMiddleware_1.protect, (0, express_async_handler_1.default)(trackerController_1.getTrackers))
    .post(authMiddleware_1.protect, (0, express_async_handler_1.default)(trackerController_1.createTracker));
router.route('/:trackerId/entries')
    .get(authMiddleware_1.protect, (0, express_async_handler_1.default)(trackerController_1.getTrackerEntries))
    .post(authMiddleware_1.protect, (0, express_async_handler_1.default)(trackerController_1.createTrackerEntry));
exports.default = router;
//# sourceMappingURL=trackerRoutes.js.map