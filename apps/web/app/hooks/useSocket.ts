import { useEffect, useState } from "react";
import { WS_URL } from "../config";

export function useSocket(){
    const [loading, setLoading] = useState(true)
    const [socket, setSocket] = useState<WebSocket>();
    
    useEffect(()=>{
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2M2VmZjQ0Yy05ZWMzLTQ1ZmMtODc2OC0zOWExNDFmNDBlYTMiLCJpYXQiOjE3NTAxMjk3MTl9.j4c4f0rYsKXsADswvaBV2d-aVPDqTxt3IrvoeaxKa_A`)
        ws.onopen=()=>{
            setLoading(false)
            setSocket(ws)
        }
    },[])

    return{
        socket,
        loading
    }
}