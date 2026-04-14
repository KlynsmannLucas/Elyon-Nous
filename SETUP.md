# ELYON Dashboard — Setup

## 1. Instalar Node.js (se não tiver)
Baixe em: https://nodejs.org (versão LTS recomendada)

## 2. Instalar dependências
```bash
cd ~/Desktop/elyon-dashboard
npm install
```

## 3. Configurar Clerk
1. Crie uma conta em https://clerk.com (gratuito)
2. Crie um novo "Application"
3. Copie as chaves em Dashboard → API Keys
4. Edite o arquivo `.env.local`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_SUA_CHAVE_AQUI
CLERK_SECRET_KEY=sk_test_SUA_CHAVE_AQUI
```

## 4. Rodar em desenvolvimento
```bash
npm run dev
```
Abra: http://localhost:3000

## 5. Build para produção
```bash
npm run build
npm run start
```

## Estrutura do projeto
```
elyon-dashboard/
├── app/
│   ├── page.tsx                    # Landing page pública
│   ├── layout.tsx                  # Layout raiz (fontes + Clerk)
│   ├── dashboard/page.tsx          # Dashboard protegido
│   ├── sign-in/[[...sign-in]]/     # Login Clerk
│   └── sign-up/[[...sign-up]]/     # Cadastro Clerk
├── components/
│   ├── dashboard/                  # Todos os componentes das tabs
│   └── pdf/RelatorioPDF.tsx        # Export PDF 4 páginas
├── lib/
│   └── mockData.ts                 # Todos os dados mockados
├── middleware.ts                   # Proteção de rotas
└── tailwind.config.ts              # Tema ELYON
```

## Deploy no Vercel
```bash
npm install -g vercel
vercel
```
Adicione as variáveis do `.env.local` no painel do Vercel em Settings → Environment Variables.
