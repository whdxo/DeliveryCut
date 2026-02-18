"use client"

import { useState, useEffect } from "react"

interface CopyButtonProps {
    text: string
    label?: string
}

export default function CopyButton({ text, label = "복사" }: CopyButtonProps) {
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (!copied && !error) return

        const timer = setTimeout(() => {
            setCopied(false)
            setError(false)
        }, 2000)

        return () => clearTimeout(timer)
    }, [copied, error])

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setError(false)
        } catch (err) {
            console.error("복사 실패:", err)
            setError(true)
            setCopied(false)
        }
    }

    return (
        <button
            onClick={handleCopy}
            className="h-9 px-4 rounded-lg bg-dc-primary text-white text-sm font-medium hover:bg-[#2d6b45] transition-colors"
        >
            {error ? "❌ 복사 실패" : copied ? "✓ 복사됨" : label}
        </button>
    )
}
