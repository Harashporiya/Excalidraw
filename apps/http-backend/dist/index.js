"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// import { JWT_SECRET } from "@repo/backend-common/config"
const { JWT_SECRET } = require("@repo/backend-common/config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const middleware_1 = require("./middleware");
const types_1 = require("@repo/common/types");
const client_1 = require("@repo/db/client");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const port = process.env.PORT || 3000;
app.post("/signup", async (req, res) => {
    const parsedData = types_1.CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({ message: "Incorrect input" });
        return;
    }
    try {
        const hashPassword = await bcryptjs_1.default.hash(parsedData.data.password, 10);
        const userCreate = await client_1.prismaClient.user.create({
            data: {
                email: parsedData.data?.email,
                name: parsedData.data?.name,
                password: hashPassword
            }
        });
        const userId = userCreate?.id;
        const token = jsonwebtoken_1.default.sign({ userId }, JWT_SECRET);
        res.status(200).json({
            userId: userCreate.id, token, userCreate
        });
    }
    catch (error) {
        res.status(411).json({
            message: "User already exists with his email"
        });
    }
});
app.post("/signin", async (req, res) => {
    const parsedData = types_1.SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({ message: "Incorrect input" });
        return;
    }
    try {
        const user = await client_1.prismaClient.user.findFirst({
            where: {
                email: parsedData.data?.email
            }
        });
        if (!user) {
            res.status(403).json({
                message: "Not authorized"
            });
            return;
        }
        const passwordMatch = await bcryptjs_1.default.compare(parsedData.data.password, user.password);
        if (!passwordMatch) {
            res.status(403).json({ message: "Invalid password" });
            return;
        }
        const userId = user?.id;
        const token = jsonwebtoken_1.default.sign({ userId }, JWT_SECRET);
        res.status(201).json({ message: "User login successfully", token: token, userId });
    }
    catch (error) {
        res.status(411).json({
            message: "User not exists with his email"
        });
    }
});
app.post("/room", middleware_1.middleware, async (req, res) => {
    const parsedData = types_1.CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({ message: "Incorrect input" });
        return;
    }
    // @ts-ignore
    const userId = req.userId;
    try {
        const roomCreated = await client_1.prismaClient.room.create({
            data: {
                slug: parsedData.data.name,
                adminId: userId
            }
        });
        res.json({
            roomId: roomCreated.id, roomCreated
        });
    }
    catch (error) {
        res.status(411).json({
            message: "Room already exists this name."
        });
    }
});
app.get("/chats/:roomId", async (req, res) => {
    try {
        const roomId = Number(req.params.roomId);
        const messages = await client_1.prismaClient.chat.findMany({
            where: {
                roomId: roomId
            },
            orderBy: {
                id: "desc"
            },
        });
        res.json({
            messages
        });
    }
    catch (error) {
        res.json({
            message: []
        });
    }
});
app.delete("/chats/:roomId/shapes/:shapeId", async (req, res) => {
    try {
        const roomId = Number(req.params.roomId);
        const shapeId = req.params.shapeId;
        console.log(roomId, shapeId);
        const messages = await client_1.prismaClient.chat.findMany({
            where: {
                roomId: roomId
            }
        });
        let messageToDelete = null;
        for (const message of messages) {
            try {
                const parsedMessage = JSON.parse(message.message);
                if (parsedMessage.shape && parsedMessage.shape.id === shapeId) {
                    messageToDelete = message;
                    break;
                }
            }
            catch (parseError) {
                continue;
            }
        }
        if (messageToDelete) {
            const deleteResult = await client_1.prismaClient.chat.deleteMany({
                where: {
                    id: messageToDelete.id,
                    roomId: roomId
                }
            });
            if (deleteResult.count > 0) {
                res.json({
                    success: true,
                    message: "Shape deleted successfully",
                    deletedCount: deleteResult.count
                });
            }
            else {
                res.status(404).json({
                    success: false,
                    message: "Shape was already deleted or not found"
                });
            }
        }
        else {
            res.status(404).json({
                success: false,
                message: "Shape not found"
            });
        }
    }
    catch (error) {
        console.error('Error deleting shape:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});
app.get("/room", async (req, res) => {
    const room = await client_1.prismaClient.room.findMany();
    res.json({
        room
    });
});
app.get("/room/:slug", async (req, res) => {
    const slug = req.params.slug;
    const room = await client_1.prismaClient.room.findFirst({
        where: {
            slug
        }
    });
    res.json({
        room
    });
});
app.listen(port, () => { (console.log(`Server Started At ${port}`)); });
