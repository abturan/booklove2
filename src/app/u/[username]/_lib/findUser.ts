// src/app/u/[username]/_lib/findUser.ts
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { variants, deslug, toTRDiacriticVersion } from './handle'

export type UserLite = {
  id: string; name: string|null; username: string|null; slug: string|null; bio: string|null; avatarUrl: string|null; bannerUrl: string|null; createdAt: Date
}

const select = { id:true,name:true,username:true,slug:true,bio:true,avatarUrl:true,bannerUrl:true,createdAt:true }

export async function findUserByHandle(handle: string): Promise<UserLite|null> {
  let user = await prisma.user.findFirst({ where:{ OR:[{username:handle},{slug:handle}] }, select }) as UserLite|null
  if (user) return user
  for (const v of variants(handle)) {
    const exact = await prisma.user.findFirst({ where:{ name:{ equals:v, mode:'insensitive'} }, select })
    if (exact) return exact as UserLite
    const partial = await prisma.user.findFirst({ where:{ name:{ contains:v, mode:'insensitive'} }, select })
    if (partial) return partial as UserLite
  }
  const tokens = deslug(handle).split(/\s+/).filter(Boolean)
  const tr = tokens.map(toTRDiacriticVersion).filter((x,i)=>x&&x!==tokens[i])
  const or:any[]=[]; for (const t of tokens) or.push({name:{contains:t,mode:'insensitive'}}); for (const t of tr) or.push({name:{contains:t,mode:'insensitive'}})
  const cands = or.length? await prisma.user.findMany({ where:{OR:or}, select, take:100 }):[]
  const exacts = cands.filter(c=>slugify((c.name||'').trim())===handle)
  const pool = exacts.length?exacts:cands
  if (!pool.length) return null
  pool.sort((a,b)=>(((b.username?2:0)+(b.slug?2:0))-((a.username?2:0)+(a.slug?2:0)))|| (new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()))
  return pool[0] as UserLite
}
