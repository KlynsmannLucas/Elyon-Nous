# Pulse diário — configuração do WhatsApp (Meta Cloud API)

O Pulse diário (urgências + 1 vitória) é enviado todo dia às **8h de Brasília**
(`0 11 * * *` UTC) pelo cron `/api/cron/morning-briefing`, pelos canais que o
usuário ligar em **Configurações → Pulse diário proativo**.

E-mail já funciona via Resend (`RESEND_API_KEY`). Para o **WhatsApp** é preciso
configurar a Meta Cloud API e criar um **template aprovado** (mensagem proativa,
fora da janela de 24h, só sai por template).

## 1. Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Variável | O que é | Exemplo |
|---|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | ID do número no WhatsApp Manager (não é o telefone) | `123456789012345` |
| `WHATSAPP_ACCESS_TOKEN` | Token permanente do System User com permissão `whatsapp_business_messaging` | `EAAG...` |
| `WHATSAPP_PULSE_TEMPLATE` | Nome do template (default `pulse_diario`) | `pulse_diario` |
| `WHATSAPP_TEMPLATE_LANG` | Idioma do template (default `pt_BR`) | `pt_BR` |
| `PULSE_FROM_EMAIL` | (opcional) remetente do e-mail | `ELYON <pulse@elyonnous.com>` |
| `NEXT_PUBLIC_APP_URL` | (opcional) base dos links | `https://www.elyonnous.com` |

> Sem essas variáveis o código **não quebra** — apenas pula o canal WhatsApp.

## 2. Criar o template no WhatsApp Manager

Business Manager → **WhatsApp Manager → Modelos de mensagem → Criar modelo**:

- **Nome:** `pulse_diario` (igual a `WHATSAPP_PULSE_TEMPLATE`)
- **Categoria:** `UTILITY` (utilitário)
- **Idioma:** Português (BR) → código `pt_BR`
- **Corpo (Body)** — exatamente com **4 variáveis** `{{1}}`..`{{4}}`:

```
☀️ Pulse ELYON — {{1}}

⚠️ Precisa de atenção: {{2}}

✅ {{3}}

Abra o painel: {{4}}
```

- **Exemplos para aprovação** (sample values):
  - `{{1}}` = `Aliança Móveis · Segunda, 22 de junho`
  - `{{2}}` = `R$ 484 em desperdício · 2 campanhas sem conversão`
  - `{{3}}` = `CPL caiu de R$ 42 para R$ 28 — o ELYON já gerou cerca de +R$ 4.820/mês`
  - `{{4}}` = `https://www.elyonnous.com/hoje`

> **Importante:** o template precisa ter **exatamente 4 variáveis** no corpo —
> é o que o código envia (`pulseToWhatsAppParams` em `lib/pulse.ts`). Se a Meta
> rejeitar a URL como variável, troque `{{4}}` por um **botão de URL** estático e
> reduza o corpo para 3 variáveis — nesse caso, ajuste `pulseToWhatsAppParams`
> para retornar 3 itens.

A aprovação costuma levar de minutos a algumas horas.

## 3. Opt-in do destinatário

A Meta exige que o destinatário tenha **consentido** em receber mensagens. Para o
próprio dono da agência recebendo o Pulse, basta ele ter iniciado conversa com o
número comercial uma vez (ou aceitar o opt-in).

## 4. Testar

Em **Configurações → Pulse diário proativo**: ligue, ative WhatsApp, informe o
número com DDD e clique **"Enviar teste agora"**. O endpoint `POST /api/pulse/test`
dispara o Pulse real e mostra o resultado por canal (`enviado ✓` ou o erro da Meta).
