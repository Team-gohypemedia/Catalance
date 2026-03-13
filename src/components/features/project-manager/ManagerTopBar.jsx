"use client"

import React, { useEffect, useState } from "react"
import Bell from "lucide-react/dist/esm/icons/bell";
import Settings from "lucide-react/dist/esm/icons/settings";
import { Button } from "@/components/ui/button"
import { getSession } from "@/shared/lib/auth-storage"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export const ManagerTopBar = () => {
    const [sessionUser, setSessionUser] = useState(null)

    useEffect(() => {
        const session = getSession()
        setSessionUser(session?.user ?? null)
    }, [])

    return (
        <div className="flex h-20 w-full items-center justify-between border-b border-slate-100 bg-white/80 px-4 backdrop-blur-md sticky top-0 z-50">
            <div className="w-full max-w-xl" />

            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 p-1 bg-slate-50/50 rounded-[7px] border border-slate-100">
                    <Button variant="ghost" size="icon" className="h-9 w-9 border-0 bg-transparent text-slate-500 rounded-[7px] hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-white" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 border-0 bg-transparent text-slate-500 rounded-[7px] hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all">
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
                
                <div className="h-8 w-[1px] bg-slate-100 mx-2" />

                <div className="flex items-center gap-3 pl-2 group cursor-pointer">
                    <div className="text-right flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-900 leading-none">{sessionUser?.fullName || 'Project Manager'}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Management Portal</span>
                    </div>
                    <Avatar className="h-11 w-11 rounded-2xl border-2 border-white shadow-md ring-1 ring-slate-100 transition-transform group-hover:scale-105">
                        <AvatarImage src={sessionUser?.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-[10px] font-bold text-white uppercase">
                            {sessionUser?.fullName?.split(' ').map(n => n[0]).join('') || 'PM'}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </div>
    )
}
