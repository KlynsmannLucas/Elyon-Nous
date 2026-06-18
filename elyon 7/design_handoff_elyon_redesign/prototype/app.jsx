/* ELYON NOUS — app root ------------------------------------------------- */
const { useState: useStateApp, useEffect: useEffectApp } = React;

const AREA_META = {
  hoje:        { title: 'Hoje', sub: 'Seu resumo diário e próximas ações' },
  desempenho:  { title: 'Desempenho', sub: 'Campanhas, canais, criativos e funil' },
  diagnostico: { title: 'Diagnóstico', sub: 'Saúde do negócio, gargalos e causas' },
  mercado:     { title: 'Mercado', sub: 'Concorrência, benchmarks e oportunidades' },
  plano:       { title: 'Plano de Ação', sub: 'Execução priorizada por impacto' },
  relatorios:  { title: 'Relatórios', sub: 'Gere e compartilhe resultados' },
  integracoes: { title: 'Integrações', sub: 'Suas fontes de dados conectadas' },
  config:      { title: 'Configurações', sub: 'Workspace e preferências' },
  planos:      { title: 'Planos', sub: 'Diagnóstico → Acompanhamento → Operação' },
  estudio:     { title: 'Estúdio de Criação', sub: 'Crie, teste e otimize — guiado pelo NOUS' },
  criar:       { title: 'Criar campanha', sub: 'Descreva e o NOUS monta sua campanha' },
  biblioteca:  { title: 'Biblioteca', sub: 'Criativos, assets e geração de copy com IA' },
  conteudo:    { title: 'Conteúdo', sub: 'Ideias de posts geradas por IA, por plataforma' },
  abtest:      { title: 'Teste A/B', sub: 'Compare criativos e deixe os dados decidirem' },
  cro:         { title: 'Otimização (CRO)', sub: 'Gargalos de conversão e ações com impacto no CPL' },
  financeiro:  { title: 'Financeiro', sub: 'Receita da agência e honorários' },
};

function App() {
  const init = (() => { try { return JSON.parse(localStorage.getItem('elyon_nous_state_v2') || '{}'); } catch { return {}; } })();
  const [screen, setScreen] = useStateApp(init.screen || 'login');
  const [area, setArea] = useStateApp(init.area || 'hoje');
  const [mode, setMode] = useStateApp(init.mode || 'pro');
  const [period, setPeriod] = useStateApp(init.period || 'Últimos 7 dias');
  const [collapsed, setCollapsed] = useStateApp(init.collapsed || false);
  const [nousOpen, setNousOpen] = useStateApp(init.nousOpen != null ? init.nousOpen : (typeof window !== 'undefined' ? window.innerWidth >= 1280 : true));
  const [docked, setDocked] = useStateApp(typeof window !== 'undefined' ? window.innerWidth >= 1280 : true);

  useEffectApp(() => {
    const onR = () => setDocked(window.innerWidth >= 1280);
    onR(); window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  useEffectApp(() => {
    try { localStorage.setItem('elyon_nous_state_v2', JSON.stringify({ screen, area, mode, period, collapsed, nousOpen })); } catch {}
  }, [screen, area, mode, period, collapsed, nousOpen]);

  // Esc closes NOUS drawer when not docked
  useEffectApp(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !docked && nousOpen) setNousOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [docked, nousOpen]);

  // Keep DATA.period in sync for components that read it
  useEffectApp(() => { if (window.DATA) window.DATA.period = period; }, [period]);

  const navigate = (k) => {
    if (k === '__nous__') { setNousOpen(true); return; }
    setArea(k);
    document.querySelector('#scroll-main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePeriod = (p) => {
    setPeriod(p);
    window.toast && window.toast({ tone: 'blue', title: 'Período atualizado', body: `Exibindo: ${p}` });
  };

  const handleMode = (m) => {
    setMode(m);
    window.toast && window.toast({ tone: m === 'pro' ? 'blue' : 'good', title: m === 'pro' ? 'Modo Avançado' : 'Modo Simplificada', body: m === 'pro' ? 'Mais densidade e indicadores.' : 'Linguagem direta e foco no essencial.' });
  };

  if (screen === 'login') return <ToastProvider><Login onEnter={(to) => setScreen(to)} /></ToastProvider>;
  if (screen === 'onboarding') return <ToastProvider><Onboarding onDone={() => { setScreen('app'); setArea('hoje'); }} /></ToastProvider>;

  const meta = AREA_META[area] || AREA_META.hoje;

  return (
    <ToastProvider>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar active={area} onChange={navigate} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} onLogout={() => setScreen('login')} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Topbar mode={mode} onMode={handleMode} title={meta.title} sub={`${meta.sub} · ${period}`}
            period={period} onPeriod={handlePeriod} onAskNous={() => setNousOpen(true)} onNav={navigate} />
          <main id="scroll-main" style={{ flex: 1, overflowY: 'auto', padding: '22px 26px 60px' }}>
            <div key={area + mode} className="fade-in" style={{ maxWidth: 1240, margin: '0 auto' }}>
              {['estudio','criar','biblioteca','conteudo','abtest','cro'].includes(area) && <StudioTabs active={area} onNav={navigate} />}
              {area === 'hoje' && <Hoje mode={mode} onNav={navigate} />}
              {area === 'desempenho' && <Desempenho mode={mode} />}
              {area === 'diagnostico' && <Diagnostico mode={mode} onNav={navigate} />}
              {area === 'mercado' && <Mercado mode={mode} />}
              {area === 'plano' && <PlanoAcao mode={mode} onNav={navigate} />}
              {area === 'relatorios' && <Relatorios mode={mode} />}
              {area === 'integracoes' && <Integracoes mode={mode} />}
              {area === 'config' && <Config mode={mode} onNav={navigate} />}
              {area === 'planos' && <Planos mode={mode} />}
              {area === 'estudio' && <Estudio mode={mode} onNav={navigate} />}
              {area === 'criar' && <CriarCampanha mode={mode} onNav={navigate} />}
              {area === 'biblioteca' && <Biblioteca mode={mode} />}
              {area === 'conteudo' && <Conteudo mode={mode} />}
              {area === 'abtest' && <ABTest mode={mode} />}
              {area === 'cro' && <CRO mode={mode} />}
              {area === 'financeiro' && <Financeiro mode={mode} />}
            </div>
          </main>
        </div>

        <NousRail open={nousOpen} onToggle={() => setNousOpen(o => !o)} mode={mode} onNavigate={navigate} docked={docked} />
      </div>
    </ToastProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
