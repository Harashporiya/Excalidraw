"use client"
import { useEffect, useRef } from "react";
import IconButton from "./IconButton";
import {Circle, Eraser, Pencil, RectangleHorizontalIcon, TypeOutline} from "lucide-react"
import { useState } from "react";
import { Game } from "@/draw/Game";

export type Tool = "circle" | "rect" | "pencil" | "eraser" | "text"

export default function Canvas({roomId, socket}: {roomId: string, socket: WebSocket}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("circle");
    const [selectedColor, setSelectedColor] = useState("#ffffff"); 

    useEffect(() => {
        game?.setTool(selectedTool);
    }, [selectedTool, game]);

    useEffect(() => {
        game?.setColor(selectedColor);
    }, [selectedColor, game]);

    useEffect(() => {
        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);
            g.setColor(selectedColor);

            return () => {
                g.destroy();
            };
        }
    }, [canvasRef]);

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedColor(e.target.value);
    };

    return (
        <div>
            <canvas ref={canvasRef} width={1920} height={953}></canvas>
            <TopBar 
                selectedTool={selectedTool} 
                setSelectedTool={setSelectedTool}
                selectedColor={selectedColor}
                onColorChange={handleColorChange}
            />
        </div>
    );
}

function TopBar({
    selectedTool,
    setSelectedTool,
    selectedColor,
    onColorChange
}: {
    selectedTool: Tool,
    setSelectedTool: (s: Tool) => void,
    selectedColor: string,
    onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
    return (
        <div style={{position: "fixed", top: 10, left: 10}}>
            <div className="flex m-2">
                <IconButton onClick={() => setSelectedTool("pencil")} activated={selectedTool === "pencil"} icon={<Pencil/>} />
                <IconButton onClick={() => setSelectedTool("rect")} activated={selectedTool === "rect"} icon={<RectangleHorizontalIcon/>} />
                <IconButton onClick={() => setSelectedTool("circle")} activated={selectedTool === "circle"} icon={<Circle/>} />
                <IconButton onClick={() => setSelectedTool("eraser")} activated={selectedTool === "eraser"} icon={<Eraser/>} />
                <IconButton onClick={() => setSelectedTool("text")} activated={selectedTool === "text"} icon={<TypeOutline/>} />
                <div className="ml-2 mt-2">
                    <input 
                        type="color" 
                        value={selectedColor}
                        onChange={onColorChange}
                        className="w-10 h-10 cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );
}