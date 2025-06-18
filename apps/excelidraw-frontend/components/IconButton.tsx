import React, { ReactNode } from 'react'

const IconButton = ({icon, onClick,activated}:{icon:ReactNode,onClick:()=> void,activated:boolean}) => {
  return (
    <div className={`m-2 pointer rounded-full border-white border p-2 bg-black hover:bg-gray ${activated ? "text-red-400":"text-white"}`}  onClick={onClick}>
       {icon}
    </div>
  )
}

export default IconButton