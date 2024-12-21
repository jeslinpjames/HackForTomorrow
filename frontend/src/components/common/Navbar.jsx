import React from 'react'
import Logo from './Logo'
import Link from 'next/link'

const Navbar = () => {
  return (
    <nav className="w-full bg-slate-900">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
      </div>
    </nav>
  )
}

export default Navbar