import React, { useState } from 'react'
export default function ManagerPanel(){
  const [address, setAddress] = useState('')
  const [pools, setPools] = useState([])
  const [planText, setPlanText] = useState('')
  const [unsignedTxs, setUnsignedTxs] = useState([])
  async function fetchPositions(){
    if(!address) return alert('paste an address')
    const r = await fetch('/api/positions?address='+address)
    const j = await r.json()
    setPools(j.pools||[])
  }
  async function askAI(){
    const r = await fetch('/api/generate-plan', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({pools})})
    const j = await r.json()
    setPlanText(j.text || '')
  }
  async function prepare(){
    const r = await fetch('/api/execute-plan', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({plan: planText, address})})
    const j = await r.json()
    setUnsignedTxs(j.unsignedTxs || [])
  }
  return (
    <section>
      <div className="mb-4">
        <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="address (demo)" className="border p-2 mr-2" />
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={fetchPositions}>Fetch positions</button>
        <button className="ml-2 px-4 py-2 bg-green-600 text-white rounded" onClick={askAI}>Ask AI</button>
        <button className="ml-2 px-4 py-2 bg-indigo-600 text-white rounded" onClick={prepare}>Prepare Execution</button>
      </div>
      <div className="mb-4">
        <h2 className="font-semibold">Pools</h2>
        <pre className="p-2 bg-white rounded shadow max-h-52 overflow-auto">{JSON.stringify(pools, null, 2)}</pre>
      </div>
      <div className="mb-4">
        <h2 className="font-semibold">AI Plan</h2>
        <pre className="p-2 bg-white rounded shadow max-h-52 overflow-auto">{planText || 'No plan yet'}</pre>
      </div>
      <div className="mb-4">
        <h2 className="font-semibold">Unsigned Txns</h2>
        <pre className="p-2 bg-white rounded shadow max-h-52 overflow-auto">{JSON.stringify(unsignedTxs, null, 2)}</pre>
      </div>
    </section>
  )
}
