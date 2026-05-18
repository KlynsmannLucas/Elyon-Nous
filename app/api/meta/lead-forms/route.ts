// app/api/meta/lead-forms/route.ts
// Scaffold — integração de formulários de lead requer permissão leads_retrieval.
//
// Para implementar completamente:
// 1. Adicionar o escopo "leads_retrieval" ao app Meta e solicitar aprovação avançada
// 2. Adicionar "ads_management" com acesso a Lead Ads
// 3. Fluxo:
//    GET /me/adaccounts → lista de contas
//    GET /act_{id}/leadgen_forms → lista de formulários
//    GET /{form_id}/leads?fields=id,created_time,field_data → leads individuais
//    Filtrar por data: &filtering=[{"field":"time_created","operator":"GREATER_THAN","value":timestamp}]
// 4. Armazenar leads no Supabase com deduplicação por lead_id
// 5. Expor paginação via cursor (paging.cursors.after)
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      success:     false,
      code:        'NOT_IMPLEMENTED',
      message:     'Lead Forms integration requires leads_retrieval permission. Add this scope to your Meta App and reconnect.',
      requiredScopes: [
        'leads_retrieval',
        'ads_management',
        'pages_show_list',
      ],
      documentationUrl: 'https://developers.facebook.com/docs/marketing-api/guides/lead-ads/retrieving/',
    },
    { status: 501 }
  )
}
