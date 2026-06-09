# Arquitetura de Contas: Com e Sem Elyon

> Este documento descreve a arquitetura de contas **antes** e **depois** da integração com a plataforma Elyon. O objetivo é esclarecer como a estrutura de contas se comporta em cada cenário, sem alterar o código existente.

---

## 📊 Visão Geral

| Aspecto | Sem Elyon | Com Elyon |
|---------|-----------|-----------|
| Autenticação | Clerk | Clerk (mesmo fluxo) |
| Persistência | Opcional (localStorage) | Supabase (tabelas relacionais) |
| Conexões Ads | Manual por conta | OAuth unificado com refresh automático |
| Análise de Dados | Nativa das plataformas | Elyon Intelligence (benchmarks, alertas) |
| Histórico | Não estruturado | Tabelas `strategy_history`, `campaign_metrics` |
| Clientes/Múltiplas contas | Isolados | Unificados via `user_id` |

---

## 🔵 ANTES — Cenário Sem Elyon

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUÁRIO                                   │
│                   (Gestor de Tráfego)                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLERK AUTH                                     │
│              (Identidade do Usuário)                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DASHBOARD TRADICIONAL                          │
│         (Interface de Visualização Pura)                        │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Meta Ads     │  │ Google Ads   │  │ Planilhas/Relatórios │   │
│  │ Manager      │  │ Ads          │  │ Manuais              │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│         │                │                      │               │
│         ▼                ▼                      ▼               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              SEM INTEGRAÇÃO CENTRALIZADA                 │   │
│  │  - Cada plataforma gerencia seus próprios dados          │   │
│  │  - Relatórios isolados e manuais                         │   │
│  │  - Sem contexto cross-platform                           │   │
│  │  - Histórico dependente de exports externos              │   │
│  └──��──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Características do Cenário Sem Elyon

1. **Autenticação**: Clerk para login, mas sem contexto unificado de clientes
2. **Dados**: Armazenamento local (localStorage) ou planilhas manuais
3. **Conexões**: Acesso direto às plataformas via tokens individuais
4. **Análise**:limitada à interface nativa de cada plataforma de ads
5. **Benchmarking**: Não disponível
6. **Alertas**: Não automatizados

---

## 🟣 DEPOIS — Cenário Com Elyon

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUÁRIO                                   │
│                   (Gestor de Tráfego)                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLERK AUTH                                     │
│              (Identidade do Usuário)                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ELYON NOUS                                    │
│              ┌─────────────────────┐                             │
│              │   Dashboard App    │                             │
│              │   (Next.js App)    │                             │
│              └─────────┬───────────┘                             │
│                        │                                         │
│  ┌─────────────────────┼─────────────────────────────────────┐ │
│  │                     │                                     │ │
│  ▼                     ▼                                     ▼ │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ ┌─────────┐ │
│ │ Nous Chat    │ │ Alerts Panel │ │ Intelligence Layer   │ │ Strategy│ │
│ │ (IA Context) │ │ (Proativos)  │ │ (Benchmarks, Niches) │ │ Builder │ │
│ └──────────────┘ └──────────────┘ └──────────────────────┘ └─────────┘ │
│                        │                                         │
│  ┌─────────────────────┴─────────────────────────────────────��� │
│  │                      SUPABASE                              │ │
│  │  ┌─────────────┐  ┌────────────┐  ┌─────────────────────┐  │ │
│  │  │  clients   │  │ strategy_ │  │   campaign_metrics  │  │ │
│  │  │           │  │ history    │  │                     │  │ │
│  │  └─────────────┘  └────────────┘  └─────────────────────┘  │ │
│  │  ┌─────────────┐  ┌────────────┐  ┌─────────────────────┐  │ │
│  │  │ads_connec- │  │ nous_chat  │  │      clients        │  │ │
│  │  │tions       │  │ messages   │  │  _health_scores     │  │ │
│  │  └─────────────┘  └────────────┘  └─────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                        │                                         │
│  ┌─────────────────────┴─────────────────────────────────────┐ │
│  │               CONEXÕES OAUTH                               │ │
│  │  ┌──────────────────┐  ┌───────────────────────────────┐   │ │
│  │  │    META ADS     │  │         GOOGLE ADS            │   │ │
│  │  │  (ads_connections)│ │      (ads_connections)        │   │ │
│  │  └──────────────────┘  └───────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Características do Cenário Com Elyon

1. **Autenticação**: Clerk (mesmo fluxo, sem mudanças)
2. **Persistência**: Supabase com tabelas relacionais para histórico estruturado
3. **Conexões**: OAuth centralizado com refresh token automático, tokens criptografados
4. **Análise**: Elyon Intelligence com benchmarks de nicho e alertas proativos
5. **Benchmarking**: Dados de mercado via Tavily API e benchmarks internos
6. **Chat**: Nous Chat para contexto de IA sobre os dados do usuário
7. **Múltiplos Clientes**: Um usuário → múltiplos clientes via `user_id`
8. **Plano de Ação**: Strategy history e audit persistence

---

## 🔄 Comparação Detalhada: Fluxo de Dados

### Fluxo Sem Elyon

```
User Login → Acesso Direto Meta/Google → Análise Manual → Planilha/Relatório
     │
     └──────────────────→ LocalStorage (opcional, volátil)
```

**Problemas**: 
- Dados dispersos entre plataformas
- Sem histórico centralizado
- Análise requer conhecimento profundo de cada plataforma
- Dificuldade para comparar performance cross-platform

### Fluxo Com Elyon

```
User Login → Clerk Auth → Dashboard Elyon
                            │
        ┌───────────────────┼───────────────────┐
        ���                   │                   │
        ▼                   ▼                   ▼
   Conexões Ads       Dados de          Elyon Intelligence
   (OAuth → Supabase) Clientes         (Benchmarks + Alertas)
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                    Supabase (Persistido)
                            │
                            ▼
               Visualização Unificada + Nous Chat
```

**Benefícios**:
- Dados centralizados em um único lugar
- Histórico estruturado para análise de trends
- Alertas proativos sobre anomalias
- Benchmarks de mercado para contextualização
- IA conversa sobre os dados do usuário

---

## 📋 Tabelas Supabase — O Que Persiste

| Tabela | Descrição | Relação |
|--------|-----------|---------|
| `clients` | Dados dos clientes do usuário | `user_id` → User |
| `ads_connections` | Tokens OAuth (criptografados) | `user_id` → User |
| `strategy_history` | Histórico de estratégias | `user_id` → User |
| `campaign_metrics` | Métricas por período | `user_id` → User |
| `priority_actions` | Ações priorizadas | `user_id` → User |
| `client_health_scores` | Scores de saúde por cliente | `user_id` → User |

---

## 🔒 Segurança

| Aspecto | Sem Elyon | Com Elyon |
|---------|-----------|-----------|
| Tokens OAuth | Armazenamento variável | Criptografados (AES) |
| RLS (Row Level Security) | N/A | Policies por `user_id` |
| Service Role Key | Exposta em cliente | Server-side apenas |
| Audit Trail | Não disponível | Tabelas de log |

---

## 📝 Resumo

A arquitetura **com Elyon** adiciona uma **camada inteligente** sobre o fluxo existente de autenticação (Clerk), sem modificar como o usuário se autentica. As diferenças principais são:

1. **Persistência centralizada** em Supabase (em vez de dados voláteis ou dispersos)
2. **Conexões OAuth unificadas** com gerenciamento automático de refresh tokens
3. **Inteligência contextual** (benchmarks, alertas, Nous Chat)
4. **Histórico estruturado** para análise de evolução

O projeto **mantém 100% da compatibilidade** com o que já existia — apenas expõe essas capacidades através da interface Elyon.
