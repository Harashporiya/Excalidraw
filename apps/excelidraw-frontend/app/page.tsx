"use client"
import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import axios from 'axios'


interface Room {
  id: number;
  slug: string;
  adminId: string;
}

const LandingPage = () => {
  const [name, setName] = useState("")
  const [token, setToken] = useState<string | null>(null)
  const [userIdSignin, setUserIdSignin] = useState<string | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem("token"))
      setUserIdSignin(localStorage.getItem("userIdSignup"))
    }
  }, [])

  const roomHandler = async () => {
    if (!token) {
      console.error("No token available")
      return
    }

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_HTTP_BACKEND}/room`, {
        name
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      })
      console.log("Room created:", res.data)
      localStorage.setItem("roomId",res.data.roomId)
      fetchRooms()
    } catch (error) {
      console.error("Error creating room:", error)
    }
  }

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_HTTP_BACKEND}/room`)
      setRooms(response.data.room || [])
      console.log(response.data.room)
    } catch (error) {
      console.error("Error fetching rooms:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const userRooms = rooms.filter((room) => room.adminId === userIdSignin)

 

  return (
    <>
      <Head>
        <title>SketchBoard | Collaborative Whiteboard Tool</title>
        <meta name="description" content="Simple, open-source whiteboard tool for sketching and collaboration" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <svg className="h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 6V18M18 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <span className="ml-2 text-xl font-bold text-gray-900">SketchBoard</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/signin" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Sign In
                </Link>
                {token ? (
                  <Link 
                    href={userRooms.length > 0 ? `/canves/${userRooms[0].id}` : "#"} 
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                    onClick={(e) => {
                      if (userRooms.length === 0) {
                        e.preventDefault()
                        alert("Please create a room first")
                      }
                    }}
                  >
                    Get Started
                  </Link>
                ) : (
                  <Link href="/signup" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                    Signup
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
              <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                <div className="sm:text-center lg:text-left">
                  <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block">Sketch ideas</span>
                    <span className="block text-indigo-600">together in real-time</span>
                  </h1>
                  <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                    An open-source whiteboard tool that lets you draw, collaborate, and share your ideas visually.
                  </p>

                  <div className='flex flex-col sm:flex-row gap-4 mt-8'>
                    {loading ? (
                      <div>Loading...</div>
                    ) : userRooms.length > 0 ? (
                      <div className="rounded-md shadow">
                        <Link 
                          href={`/canves/${userRooms[0].id}`} 
                          className="w-full flex items-center justify-center border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-4"
                        >
                         
                          Go to Your Whiteboard
                        </Link>
                      </div>
                    ) : (
                      <>
                        <div>
                          <input 
                            className='p-2 m-2 border-2 font-bold rounded-lg border-indigo-600 focus:border-indigo-600 focus:outline-none' 
                            type='text' 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Room name"
                          />
                        </div>
                        <button 
                          onClick={roomHandler} 
                          className='flex items-center justify-center h-12 mt-1 p-4 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg'
                          disabled={!name.trim()}
                        >
                          Create room
                        </button>
                      </>
                    ) 
                    }
                  </div>
                </div>
              </main>
            </div>
          </div>
          
          <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
            <div className="h-56 w-full sm:h-72 md:h-96 lg:w-full lg:h-full bg-gray-100 flex items-center justify-center">
           
              <div className="relative w-4/5 h-4/5 border-2 border-gray-300 rounded-lg bg-white flex items-center justify-center">
                <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-indigo-100 to-blue-200"></div>
                <div className="relative z-10 text-center p-4">
                  <svg className="mx-auto h-16 w-16 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Interactive Whiteboard</h3>
                  <p className="mt-1 text-sm text-gray-500">Draw, erase, and collaborate in real-time</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                A better way to visualize ideas
              </p>
            </div>

            <div className="mt-10">
              <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                {/* Feature 1 */}
                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Real-time collaboration</p>
                  <p className="mt-2 ml-16 text-base text-gray-500">
                    Work together with teammates or friends on the same board simultaneously.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">No account needed</p>
                  <p className="mt-2 ml-16 text-base text-gray-500">
                    Start drawing immediately without signing up. Your work is saved in your browser.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Multiple tools</p>
                  <p className="mt-2 ml-16 text-base text-gray-500">
                    Pencil, shapes, text, and more. Everything you need to sketch your ideas.
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Export options</p>
                  <p className="mt-2 ml-16 text-base text-gray-500">
                    Save your drawings as PNG or SVG, or share them via a link.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Footer */}
        <footer className="bg-white">
          <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
            <p className="mt-8 text-center text-base text-gray-400">
              &copy; {new Date().getFullYear()} SketchBoard. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

    </>
  )
}

export default LandingPage      
