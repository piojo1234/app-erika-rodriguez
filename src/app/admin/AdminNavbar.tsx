'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'

export default function AdminNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const links = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Nuevo Contrato', href: '/admin/nuevo-contrato' },
    { name: 'Pagos y Recibos', href: '/admin/pagos' },
    { name: 'Historias Clínicas', href: '/admin/historias' },
    { name: 'Documentos', href: '/admin/documentos' },
    { name: 'Agendamiento', href: '/admin/citas' },
  ]

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname?.startsWith(href)
  }

  return (
    <>
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/admin">
                  <img
                    className="h-10 w-auto"
                    src="https://erikarodriguezpsicologa.com/wp-content/uploads/2026/07/logo-erika-.png"
                    alt="Logo Psicóloga Erika Rodríguez"
                  />
                </Link>
              </div>
              <div className="hidden lg:-my-px lg:ml-6 lg:flex lg:space-x-8">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${
                      isActive(link.href)
                        ? 'border-[#0e787a] text-[#0e787a]'
                        : 'border-transparent text-gray-600 hover:border-[#0e787a] hover:text-[#0e787a]'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="hidden lg:ml-6 lg:flex lg:items-center gap-4">
              <Link
                href="/admin/nuevo-contrato"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#0e787a] hover:bg-[#224252] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0e787a] transition-colors"
              >
                + Crear Contrato
              </Link>
              <button
                onClick={() => logout()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="-mr-2 flex items-center lg:hidden gap-2">
              <Link
                href="/admin/nuevo-contrato"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-[#0e787a] hover:bg-[#224252]"
              >
                + Crear
              </Link>
              <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0e787a]"
                aria-controls="mobile-menu"
                aria-expanded={isOpen}
              >
                <span className="sr-only">Abrir menú principal</span>
                {isOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay / Dropdown */}
        <div 
          className={`lg:hidden transition-all duration-300 ease-in-out origin-top ${
            isOpen ? 'opacity-100 max-h-screen border-b border-gray-200' : 'opacity-0 max-h-0 overflow-hidden'
          }`} 
          id="mobile-menu"
        >
          <div className="pt-2 pb-3 space-y-1 bg-white px-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`${
                  isActive(link.href)
                    ? 'bg-teal-50 border-[#0e787a] text-[#0e787a]'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                } block pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors`}
              >
                {link.name}
              </Link>
            ))}
            <button
              onClick={() => { setIsOpen(false); logout(); }}
              className="block w-full text-left pl-3 pr-4 py-3 border-l-4 border-transparent text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-base font-medium transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>
      
      {/* Overlay opaco para cerrar al hacer clic afuera (opcional) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 lg:hidden mt-16" 
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
