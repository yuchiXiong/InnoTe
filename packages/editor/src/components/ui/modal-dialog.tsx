"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface DialogOptions {
  title: string
  description?: string
  defaultValue?: string
  placeholder?: string
  type?: "input" | "textarea" | "confirm"
  confirmText?: string
  cancelText?: string
  multiline?: boolean
}

interface DialogState extends DialogOptions {
  isOpen: boolean
  resolve?: (value: string | boolean | null) => void
}

// 全局对话框状态管理
class DialogManager {
  private listeners: ((state: DialogState) => void)[] = []
  private currentState: DialogState = {
    isOpen: false,
    title: "",
    type: "input",
  }

  subscribe(listener: (state: DialogState) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentState))
  }

  async showInput(options: DialogOptions): Promise<string | null> {
    return new Promise((resolve) => {
      this.currentState = {
        ...options,
        type: "input",
        isOpen: true,
        resolve: (value) => resolve(value as string | null),
      }
      this.notify()
    })
  }

  async showTextarea(options: DialogOptions): Promise<string | null> {
    return new Promise((resolve) => {
      this.currentState = {
        ...options,
        type: "textarea",
        isOpen: true,
        resolve: (value) => resolve(value as string | null),
      }
      this.notify()
    })
  }

  async showConfirm(options: DialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.currentState = {
        ...options,
        type: "confirm",
        isOpen: true,
        resolve: (value) => resolve(value as boolean),
      }
      this.notify()
    })
  }

  close(value: string | boolean | null = null) {
    if (this.currentState.resolve) {
      this.currentState.resolve(value)
    }
    this.currentState = {
      ...this.currentState,
      isOpen: false,
      resolve: undefined,
    }
    this.notify()
  }
}

// 全局对话框管理器实例
export const dialogManager = new DialogManager()

// 便捷的 API 函数
export const showInputDialog = (options: DialogOptions) => dialogManager.showInput(options)
export const showTextareaDialog = (options: DialogOptions) => dialogManager.showTextarea(options)
export const showConfirmDialog = (options: DialogOptions) => dialogManager.showConfirm(options)

// 对话框组件
export function ModalDialog() {
  const [state, setState] = useState<DialogState>({
    isOpen: false,
    title: "",
    type: "input",
  })
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const unsubscribe = dialogManager.subscribe(setState)
    return unsubscribe
  }, [])

  useEffect(() => {
    if (state.isOpen) {
      setInputValue(state.defaultValue || "")
      // 延迟聚焦，确保对话框已经渲染
      setTimeout(() => {
        if (state.type === "input") {
          inputRef.current?.focus()
          inputRef.current?.select()
        } else if (state.type === "textarea") {
          textareaRef.current?.focus()
          textareaRef.current?.select()
        }
      }, 100)
    }
  }, [state.isOpen, state.type])

  const handleConfirm = () => {
    if (state.type === "confirm") {
      dialogManager.close(true)
    } else {
      dialogManager.close(inputValue.trim() || null)
    }
  }

  const handleCancel = () => {
    if (state.type === "confirm") {
      dialogManager.close(false)
    } else {
      dialogManager.close(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (state.type !== "textarea") {
        e.preventDefault()
        handleConfirm()
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleCancel()
    }
  }

  return (
    <Dialog open={state.isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{state.title}</DialogTitle>
          {state.description && <DialogDescription>{state.description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4">
          {state.type === "input" && (
            <div className="space-y-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={state.placeholder}
                onKeyDown={handleKeyDown}
                className="w-full"
              />
            </div>
          )}

          {state.type === "textarea" && (
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={state.placeholder}
                onKeyDown={handleKeyDown}
                className="w-full min-h-[100px] resize-none"
              />
            </div>
          )}

          {state.type === "confirm" && state.description && (
            <div className="text-sm text-gray-600">{state.description}</div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            {state.cancelText || "取消"}
          </Button>
          <Button onClick={handleConfirm} disabled={state.type !== "confirm" && !inputValue.trim()}>
            {state.confirmText || (state.type === "confirm" ? "确认" : "确定")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
