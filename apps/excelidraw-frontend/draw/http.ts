import axios from "axios";

export async function getExistingShapes(roomId:string){
 const res = await axios.get(`${process.env.NEXT_PUBLIC_HTTP_BACKEND}/chats/${roomId}`);
 const data = await res.data.messages;

 const shapes = data.map((x:{message:string})=>{
    const messageData = JSON.parse(x.message)

    return messageData.shape;
 })
 return shapes;

}

export async function deleteShape(roomId: string, shapeId: string) {
    try {
        const res = await axios.delete(`${process.env.NEXT_PUBLIC_HTTP_BACKEND}/chats/${roomId}/shapes/${shapeId}`);
        return res.data;
    } catch (error) {
        console.error('Error deleting shape:', error);
        throw error;
    }
}