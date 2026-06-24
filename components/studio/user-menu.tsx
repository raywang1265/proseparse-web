'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/lib/auth/context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function initials(name: string | null, email: string | null) {
  const source = name?.trim() || email?.split('@')[0] || ''
  const parts = source.split(/[\s._-]+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function UserMenu() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await logout()
      router.push('/')
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  if (!user) return null

  const displayName = user.displayName
  const email = user.email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full"
          aria-label="Account menu"
        >
          <Avatar className="size-7">
            {user.photoURL && (
              <AvatarImage src={user.photoURL} alt={displayName ?? 'You'} />
            )}
            <AvatarFallback className="text-xs">
              {initials(displayName, email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2 font-normal">
          <UserIcon className="size-4 text-muted-foreground" />
          <div className="min-w-0">
            {displayName && (
              <p className="truncate text-sm font-medium text-foreground">
                {displayName}
              </p>
            )}
            {email && (
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            handleSignOut()
          }}
          disabled={signingOut}
        >
          <LogOut className="size-4" />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
