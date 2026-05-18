// services/security/encryption.ts
// Criptografia AES-256-GCM para tokens OAuth em repouso.
// Tokens NUNCA devem ser logados ou expostos ao frontend.
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
  const hex = process.env.TOKEN_ENCRYPTION_KEY || ''
  if (!hex || hex.length < 64) {
    // Fallback em desenvolvimento: deriva chave do service role key (não use em produção)
    const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY || 'elyon-dev-fallback-key-not-for-production'
    const { createHash } = require('crypto')
    return createHash('sha256').update(fallback).digest()
  }
  return Buffer.from(hex.slice(0, 64), 'hex')
}

// Formato: base64(iv):base64(authTag):base64(ciphertext)
export function encryptToken(plaintext: string): string {
  if (!plaintext) return ''
  const key = getKey()
  const iv  = randomBytes(12)
  const cipher = createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag   = cipher.getAuthTag()
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
}

export function decryptToken(ciphertext: string): string {
  if (!ciphertext) return ''
  const parts = ciphertext.split(':')
  if (parts.length !== 3) return ciphertext // plain text legado — retorna como está
  const [ivB64, authTagB64, encB64] = parts
  const key      = getKey()
  const iv       = Buffer.from(ivB64,      'base64')
  const authTag  = Buffer.from(authTagB64, 'base64')
  const encrypted= Buffer.from(encB64,     'base64')
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

// Detecta se um valor já está criptografado pelo formato iv:authTag:cipher
export function isEncrypted(value: string): boolean {
  return typeof value === 'string' && value.split(':').length === 3
}
