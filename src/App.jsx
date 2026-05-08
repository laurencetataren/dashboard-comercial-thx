import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard.jsx'

const SENHA_CORRETA = 'venda'
const SESSION_KEY = 'thx_auth'

function PasswordGate({ onSuccess }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(false)
  const [shake, setShake] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (senha === SENHA_CORRETA) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onSuccess()
    } else {
      setErro(true)
      setShake(true)
      setSenha('')
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
      <div className={`w-full max-w-sm px-8 py-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur ${shake ? 'animate-[shake_0.4s_ease]' : ''}`}
        style={shake ? { animation: 'shake 0.4s ease' } : {}}>
        <div className="text-center mb-8">
          <div className="text-white font-bold text-xl tracking-wide">THX Group</div>
          <div className="text-white/40 text-xs mt-1 tracking-widest uppercase">Dashboard Comercial</div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={senha}
              onChange={e => { setSenha(e.target.value); setErro(false) }}
              placeholder="Senha de acesso"
              autoFocus
              className={`w-full bg-white/5 border ${erro ? 'border-red-500/60' : 'border-white/10'} rounded-lg px-4 py-3 text-white placeholder-white/25 text-sm outline-none focus:border-cyan-500/50 transition-colors`}
            />
            {erro && <p className="text-red-400 text-xs mt-1.5">Senha incorreta</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-semibold py-3 rounded-lg text-sm transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0) }
          20% { transform: translateX(-8px) }
          40% { transform: translateX(8px) }
          60% { transform: translateX(-6px) }
          80% { transform: translateX(6px) }
        }
      `}</style>
    </div>
  )
}

export default function App() {
  const [auth, setAuth] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (!auth) return <PasswordGate onSuccess={() => setAuth(true)} />

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cyan-400/60 text-sm tracking-widest uppercase">Carregando Dashboard</p>
        </div>
      </div>
    )
  }

  return <Dashboard />
}
