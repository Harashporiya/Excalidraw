"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.middleware = middleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// import { JWT_SECRET } from "@repo/backend-common/config";
const { JWT_SECRET } = require("@repo/backend-common/config");
function middleware(req, res, next) {
    const authHeader = req.headers["authorization"] ?? "";
    const token = authHeader.split(' ')[1]; // Get token after 'Bearer '
    if (!token) {
        res.status(401).json({ message: "Token missing" });
        return;
    }
    const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
    if (decoded) {
        // @ts-ignore: TODO: fix this??
        req.userId = decoded.userId;
        next();
    }
    else {
        res.status(403).json({
            message: "Unauthorized"
        });
    }
}
