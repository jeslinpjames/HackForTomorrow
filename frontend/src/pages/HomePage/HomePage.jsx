"use client";
import React from 'react'
import { Button } from "@/components/ui/button"
import { EyeOffIcon, EarIcon } from "lucide-react"
import { useRouter } from 'next/navigation'

const HomePage = () => {
  const router = useRouter();

return (
    <div className="flex flex-col items-center justify-center bg-background p-4" style={{ minHeight: 'calc(100vh - 4rem)' }}>
        <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold tracking-tight">Choose Assistance Type</h1>
            <p className="text-muted-foreground">Select the type of assistance you need</p>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                    size="lg"
                    className="min-w-[200px] space-x-2"
                    onClick={() => router.push('/blind')}
                >
                    <EyeOffIcon className="w-5 h-5" />
                    <span>Blind Assistance</span>
                </Button>

                <Button 
                    size="lg"
                    variant="secondary"
                    className="min-w-[200px] space-x-2"
                    onClick={() => router.push('/deaf')}
                >
                    <EarIcon className="w-5 h-5" />
                    <span>Deaf Assistance</span>
                </Button>
            </div>
        </div>
    </div>
)
}

export default HomePage