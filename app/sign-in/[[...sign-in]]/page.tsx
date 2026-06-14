// app/sign-in/\[\[...sign-in\]\]/page.tsx — Login page (v2 light theme)
'use client'

export default function SignInPage() {
  const signInUrl =
    'https://accounts.elyonnous.com/sign-in' +
    '?redirect_url=' +
    encodeURIComponent('https://elyonnous.com/hoje')

  return (
    <div className="min-h-screen bg-canvas flex">
      {/* Left - Brand Panel */}
      <div className="hidden lg:flex lg:w-[1.15fr] bg-gradient-to-br from-blue-soft via-blue-soft/50 to-green-soft flex-col items-center justify-center p-8">
        <div className="max-w-md text-center">
          {/* Logo */}
          <div className="mb-10">
            <div className="w-16 h-16 rounded-xl bg-blue flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">E</span>
            </div>
            <h1 className="text-[40px] font-display font-bold text-ink">ELYON</h1>
            <p className="text-ink-2 text-sm">Inteligência de marketing com IA</p>
          </div>

          {/* Headline */}
          <h2 className="text-[28px] font-semibold text-ink leading-tight mb-8">
            A inteligência que <span className="text-blue">decide</span> com seus dados.
          </h2>

          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <span className="px-3 py-1.5 bg-paper border border-line rounded-full text-xs font-medium text-ink-2">
              📊 Dados reais
            </span>
            <span className="px-3 py-1.5 bg-paper border border-line rounded-full text-xs font-medium text-ink-2">
              🤖 IA estratégica
            </span>
            <span className="px-3 py-1.5 bg-paper border border-line rounded-full text-xs font-medium text-ink-2">
              📈 ROI comprovado
            </span>
          </div>

          {/* Metrics chips */}
          <div className="flex justify-center gap-6">
            <div className="bg-paper/80 backdrop-blur-sm border border-line rounded-lg px-4 py-3">
              <p className="text-xs text-ink-3 mb-1">ROAS médio</p>
              <p className="text-xl font-mono font-bold text-green">3.2x</p>
            </div>
            <div className="bg-paper/80 backdrop-blur-sm border border-line rounded-lg px-4 py-3">
              <p className="text-xs text-ink-3 mb-1">Receita 7d</p>
              <p className="text-xl font-mono font-bold text-blue">+127%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 rounded-lg bg-blue flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl font-bold">E</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-ink">ELYON</h1>
          </div>

          <div className="bg-paper border border-line rounded-lg p-6">
            <h2 className="text-xl font-semibold text-ink mb-1 text-center">
              Entrar na ELYON
            </h2>
            <p className="text-sm text-ink-2 text-center mb-6">
              Acesse sua conta para continuar
            </p>

            {/* Google sign in */}
            <a
              href={signInUrl}
              className="w-full flex items-center justify-center gap-3 rounded-md py-2.5 px-4 font-medium text-sm bg-canvas-2 border border-line text-ink hover:bg-canvas transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Entrar com Google
            </a>

            <div className="mt-6 pt-6 border-t border-line text-center">
              <p className="text-sm text-ink-2">
                Não tem conta?{' '}
                <a href="/sign-up" className="font-semibold text-blue hover:underline">
                  Criar conta grátis
                </a>
              </p>
            </div>
          </div>

          <p className="mt-6 text-xs text-ink-3 text-center">
            Ao entrar, você concorda com nossos{' '}
            <a href="/termos" className="text-blue hover:underline">Termos de Uso</a> e{' '}
            <a href="/privacidade" className="text-blue hover:underline">Política de Privacidade</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
