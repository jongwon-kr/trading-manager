"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/LoginForm"
import { SignupForm } from "@/components/auth/SignupForm"
import { Button } from "@/components/ui/button"
import { useAppSelector } from "@/store/hooks"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-4">
        {isLogin ? (
          <>
            <LoginForm onSuccess={() => router.push("/")} />
            <div className="text-center">
              <Button variant="link" onClick={() => setIsLogin(false)}>
                계정이 없으신가요? 회원가입
              </Button>
            </div>
          </>
        ) : (
          <>
            <SignupForm onSuccess={() => router.push("/")} />
            <div className="text-center">
              <Button variant="link" onClick={() => setIsLogin(true)}>
                이미 계정이 있으신가요? 로그인
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
