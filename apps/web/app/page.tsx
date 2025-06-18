'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [roomId, setRoomId] = useState("")
  const router = useRouter()
  return (
    <div style={{
      display:'flex',
      justifyContent:"center",
      alignItems:'center',
      height:"100vh",
      width:"100wh"
    }}>
      <input style={{padding:4}} value={roomId} onChange={(e)=>setRoomId(e.target.value)}
       type="text" placeholder="Room id"></input>

       <button style={{padding:4}} onClick={()=>{router.push(`/room/${roomId}`)}}>Join room</button>
    </div>
  );
}
