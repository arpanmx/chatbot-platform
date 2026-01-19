'use client'

import { UserButton } from '@clerk/nextjs'

export default function HeaderUserMenu() {
  return (
    <div className="flex items-center">
      <UserButton afterSignOutUrl="/sign-in" />
    </div>
  )
}
