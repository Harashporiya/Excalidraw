"use client"
import { useEffect, useRef } from "react";
import IconButton from "./IconButton";
import {Circle, Eraser, Pencil,RectangleHorizontalIcon} from "lucide-react"
import { useState } from "react";
import { Game } from "@/draw/Game";

 export type Tool = "circle" | "rect" | "pencil" | "eraser"

export default function Canvas({roomId, socket}:{roomId:string,socket:WebSocket
}){
     const canvasRef = useRef<HTMLCanvasElement>(null)
     const [game, setGame] = useState<Game>();
     const [selectedTool, setSelectedTool] =useState<Tool>("circle")

     useEffect(()=>{
       game?.setTool(selectedTool)
     },[selectedTool,game])
     useEffect(() => {

        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket)
           setGame(g)
        

        return ()=>{
            g.destroy()
        }
    }
    }, [canvasRef])

    return (
        <div>
            <canvas ref={canvasRef} width={1920} height={953}></canvas>
            <TopBar selectedTool={selectedTool} setSelectedTool={setSelectedTool}/>

        </div>
    )
}

function TopBar({selectedTool,setSelectedTool}:{selectedTool:Tool,setSelectedTool:(s:Tool)=>void}){
    return<div style={{position:"fixed",top:10,left:10}}>
          <div className="flex m-2">
          <IconButton onClick={()=>{setSelectedTool("pencil")}} activated={selectedTool==="pencil"} icon={<Pencil/>} />
          <IconButton onClick={()=>{setSelectedTool("rect")}} activated={selectedTool==="rect"} icon={<RectangleHorizontalIcon/>} />
          <IconButton onClick={()=>{setSelectedTool("circle")}} activated={selectedTool==="circle"} icon={<Circle/>} />
          <IconButton onClick={()=>{setSelectedTool("eraser")}} activated={selectedTool==="eraser"} icon={<Eraser/>} />
          </div>
    </div>
}