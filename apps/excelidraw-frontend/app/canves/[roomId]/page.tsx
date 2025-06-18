"use client"
import React, { useEffect, useState } from "react"
import RoomCanves from "@/components/RoomCanvas"

export default function Canves() {
  const [roomId, setRoomId] = useState<string | null>(null)

  useEffect(() => {
    const id = localStorage.getItem("roomId")
    console.log(id)
    if (id) {
      setRoomId(id)
    }
  }, [])

  if (!roomId) return null // or return a loading spinner

  return <RoomCanves roomId={roomId} />
}
