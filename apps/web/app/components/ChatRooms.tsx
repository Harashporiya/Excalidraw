import axios from 'axios'
import React from 'react'
import { BACKEND_URL } from '../config'
import ChatRoomClient from './ChatRoomClient'

async function getChat(roomId:string){
  const response  = await axios.get(`${BACKEND_URL}/chats/${roomId}`)
  return response.data.messages
}

const ChatRooms = async({id}:{id:string}) => {
   const messages = await getChat(id)

   return <ChatRoomClient id={id} messages={messages}/>
}

export default ChatRooms