"use client"

import { useEffect, useState } from "react"
import Canvas from "./Canvas"

export default function RoomCanves({ roomId }: { roomId: string }) {
   
    const [socket, setSocket] = useState<WebSocket | null>(null)

    useEffect(() => {
        const token =  localStorage.getItem("token")
        const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}?token=${token}`)

        ws.onopen = () => {
            setSocket(ws)
            ws.send(JSON.stringify({
                type:"join_room",
                roomId
            }))

        }
    }, [])

    if (!socket) {
        return <div>
            Connecting to server....
        </div>
    }

    return (
        <div>
            <Canvas roomId={roomId} socket={socket}/>
        </div>
    )
    
}