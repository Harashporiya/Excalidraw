import { Response, Request, NextFunction } from "express";
import jwt from "jsonwebtoken"
// import { JWT_SECRET } from "@repo/backend-common/config";
const { JWT_SECRET } = require("@repo/backend-common/config");


export function middleware(req:Request, res:Response, next:NextFunction){
  const authHeader = req.headers["authorization"] ?? ""

 
  const token = authHeader.split(' ')[1]; // Get token after 'Bearer '
  if (!token) {
     res.status(401).json({ message: "Token missing" });
     return;
  }
  const decoded = jwt.verify(token,JWT_SECRET)
  if(decoded){
    // @ts-ignore: TODO: fix this??
    req.userId = decoded.userId
    next()
  }else{
    res.status(403).json({
        message:"Unauthorized"
    })
  }
}