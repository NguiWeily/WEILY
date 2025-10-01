import React from 'react'
import ManagerPanel from './ManagerPanel'
export default function App(){
  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">AI LP Portfolio Manager</h1>
      </header>
      <main><ManagerPanel /></main>
    </div>
  )
}
