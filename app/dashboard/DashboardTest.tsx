'use client'
// Sem nenhum import — só para provar que o dynamic funciona

export default function DashboardTest() {
  return (
    <div style={{ background: 'cyan', color: 'black', minHeight: '100vh', padding: 40, fontSize: 24 }}>
      <h1>Chunk vazio carregou!</h1>
      <p>Nenhum import — dynamic funciona.</p>
    </div>
  )
}
