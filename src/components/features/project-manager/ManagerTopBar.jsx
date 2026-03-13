"use client"

import React, { useEffect, useState } from "react"
import Bell from "lucide-react/dist/esm/icons/bell";
import Search from "lucide-react/dist/esm/icons/search";
import Settings from "lucide-react/dist/esm/icons/settings";
import { Input } from "@/components/ui/input"
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
        <div className="flex h-20 w-full items-center justify-between border-b border-slate-100 bg-white/80 px-8 backdrop-blur-md sticky top-0 z-50">
            <div className="relative w-full max-w-xl">
                <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input 
                    type="text" 
                    placeholder="Search projects, freelancers, or files..." 
                    className="h-12 w-full rounded-2xl border-none bg-slate-50/50 pl-14 text-sm font-medium placeholder:text-slate-400/80 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-all focus:bg-white focus:shadow-xl shadow-inner-sm"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40">
                   <span className="text-[10px] font-bold border border-slate-300 rounded px-1.5 py-0.5">⌘</span>
                   <span className="text-[10px] font-bold border border-slate-300 rounded px-1.5 py-0.5">K</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 p-1.5 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <Button variant="ghost" size="icon" className="h-10 w-10 border-0 bg-transparent text-slate-500 rounded-xl hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-white" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 border-0 bg-transparent text-slate-500 rounded-xl hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all">
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
