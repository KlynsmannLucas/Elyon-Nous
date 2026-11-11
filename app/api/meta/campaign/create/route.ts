import {auth} from '@clerk/nextjs/server'
export async function POST(){const {userId}=await auth();if(!userId)return Response.json({error:'Entre na sua conta.'},{status:401});return Response.json({error:'Esta versão foi substituída pelo Estúdio. Abra /criar para preparar o pacote de campanha.'},{status:410,headers:{'Cache-Control':'private, no-store'}})}
