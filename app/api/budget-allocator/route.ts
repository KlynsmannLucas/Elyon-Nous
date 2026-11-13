import {auth} from '@clerk/nextjs/server'
export async function POST(){const {userId}=await auth();if(!userId)return Response.json({error:'Não autorizado.'},{status:401});return Response.json({error:'O Alocador IA foi removido. Consulte o investimento real em Desempenho → Canais.'},{status:410,headers:{'Cache-Control':'private, no-store'}})}
