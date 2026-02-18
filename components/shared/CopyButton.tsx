"use client"

import { useState } from "react"

interface CopyButtonProps {
    text: string
    label?: string
}

export default function CopyButton({ text, label = "복사" }: CopyButtonProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("복사 실패:", err)
        }
    }

    return (
        <button
            onClick={handleCopy}
            className="h-9 px-4 rounded-lg bg-dc-primary text-white text-sm font-medium hover:bg-[#2d6b45] transition-colors"
        >
            {copied ? "✓ 복사됨" : label}
        </button>
    )
}
