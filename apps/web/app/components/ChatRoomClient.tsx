"use client"
import React, { useEffect, useState } from 'react'
import { useSocket } from '../hooks/useSocket';

const ChatRoomClient = ({messages,id}:{messages:{message:string}[];id:string}) => {

    const {socket, loading} = useSocket();
    const [chats, setChats] = useState(messages)
    const [currentMessage, setCurrentMessage] = useState('')

    useEffect(()=>{
        if(socket && !loading){
             
            socket.send(JSON.stringify({
                type:"join_room",
                roomId:id
            }))

            socket.onmessage = (event)=>{ 
                const parsedData = JSON.parse(event.data)
                if(parsedData.type === "chat"){
                    setChats(c => [...c, {message:parsedData.message}])
                    
                }

            }
        }
    },[socket,loading, id])


  return (
    <div>
        {chats.map((m)=>(
            <div>{m.message}</div>
        ))}
        <input type='text' value={currentMessage} 
        onChange={(e)=>setCurrentMessage(e.target.value)}></input>

        <button onClick={()=>{
            socket?.send(JSON.stringify({
                type:"chat",
                roomId:id,
                message:currentMessage
            }))
            setCurrentMessage("")
        }}>Send message</button>
    </div>
  )
}

export default ChatRoomClient