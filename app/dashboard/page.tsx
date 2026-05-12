// Server Component — teste direto sem nenhum hook ou import dinâmico
export default function DashboardPage() {
  console.log('DASHBOARD PAGE FILE LOADED')

  return (
    <div style={{ minHeight: '100vh', background: 'lime', color: 'black', padding: 40, fontSize: 32 }}>
      DASHBOARD PAGE DIRETO
    </div>
  )
}
