import express from "express"
import jwt from "jsonwebtoken"
// import { JWT_SECRET } from "@repo/backend-common/config"
const { JWT_SECRET } = require("@repo/backend-common/config");
import bcrypt from 'bcryptjs'
import { middleware } from "./middleware"
import {CreateUserSchema, SigninSchema, CreateRoomSchema} from "@repo/common/types"
import { prismaClient } from "@repo/db/client"
import cors from "cors"
import {config} from "dotenv"
const app = express()

config()

const corsOptions = {
  origin: [
    process.env.FRONTEND_URL
  ].filter((origin): origin is string => Boolean(origin)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json())

console.log(process.env.PORT)
const port = process.env.PORT || 3000


app.post("/signup",async (req, res) => {
    const parsedData = CreateUserSchema.safeParse(req.body)
    if(!parsedData.success){
        res.json({message:"Incorrect input"})
        return
    }

    try {
        const hashPassword = await bcrypt.hash(parsedData.data.password,10)
        const userCreate = await prismaClient.user.create({
            data:{
                email:parsedData.data?.email,
                name:parsedData.data?.name,
                password:hashPassword
            }
        })
        const userId = userCreate?.id;
        const token = jwt.sign({ userId }, JWT_SECRET)

        res.status(200).json({
            userId: userCreate.id,token,userCreate
        })
    } catch (error) {
        res.status(411).json({
            message:"User already exists with his email"
        })
    }
})

app.post("/signin", async(req, res) => {
    const parsedData = SigninSchema.safeParse(req.body)

    if(!parsedData.success){
        res.json({message:"Incorrect input"})
        return
    }

    try {
        const user = await prismaClient.user.findFirst({
            where:{
                email:parsedData.data?.email
            }
        })

        if(!user){
            res.status(403).json({
                message:"Not authorized"
            })
            return;
        }

        const passwordMatch = await bcrypt.compare(parsedData.data.password,user.password)

        if (!passwordMatch) {
            res.status(403).json({ message: "Invalid password" })
            return;
        }

        const userId = user?.id;
        const token = jwt.sign({ userId }, JWT_SECRET)

        res.status(201).json({message:"User login successfully",token:token,userId})
    } catch (error) {
        res.status(411).json({
            message:"User not exists with his email"
        })
    }
})

app.post("/room", middleware, async(req, res) => {

    const parsedData = CreateRoomSchema.safeParse(req.body)

    if(!parsedData.success){
        res.json({message:"Incorrect input"})
        return
    }
    // @ts-ignore
    const userId = req.userId;

    try {
        
        const roomCreated = await prismaClient.room.create({
            data:{
                slug:parsedData.data.name,
                adminId:userId
            }
        })

        res.json({
            roomId: roomCreated.id,roomCreated
        })
    } catch (error) {
        res.status(411).json({
            message:"Room already exists this name."
        })
    }
})

app.get("/chats/:roomId", async (req,res)=>{
    try {
        const roomId = Number(req.params.roomId)

        const messages = await prismaClient.chat.findMany({
            where:{
                roomId: roomId
            },
            orderBy:{
                id: "desc"
            },
        })

        res.json({
            messages
        })
    } catch (error) {
        res.json({
            message:[]
        })
    }
})

app.delete("/chats/:roomId/shapes/:shapeId", async (req,res)=>{
    try {
        const roomId = Number(req.params.roomId)
        const shapeId = req.params.shapeId

        console.log(roomId,shapeId)

        const messages = await prismaClient.chat.findMany({
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
            } catch (parseError) {
                continue;
            }
        }

        if (messageToDelete) {
            
            const deleteResult = await prismaClient.chat.deleteMany({
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
            } else {
                res.status(404).json({
                    success: false,
                    message: "Shape was already deleted or not found"
                });
            }
        } else {
            res.status(404).json({
                success: false,
                message: "Shape not found"
            });
        }
    } catch (error) {
        console.error('Error deleting shape:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
})

app.get("/room", async (req,res)=>{
   

    const room = await prismaClient.room.findMany()
    res.json({
        room})
})



app.get("/room/:slug", async (req,res)=>{
    const slug =req.params.slug

    const room = await prismaClient.room.findFirst({
        where:{
            slug
        }
    })
    res.json({
        room
    })
})

app.listen(port,() => {(console.log(`Server Started At ${port}`))})