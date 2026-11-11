import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'

const key = () => {
  const value = process.env.REPORTEI_ENCRYPTION_KEY || ''
  if (!/^[a-f0-9]{64}$/i.test(value)) throw new Error('Reportei encryption is not configured.')
  return Buffer.from(value, 'hex')
}
export const isEncryptedReporteiToken = (value: unknown): value is string => typeof value === 'string' && value.split(':').length === 3
export function encryptReporteiToken(token: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), encrypted].map(part => part.toString('base64')).join(':')
}
export function decryptReporteiToken(value: string) {
  if (!isEncryptedReporteiToken(value)) throw new Error('Invalid Reportei token format.')
  const [iv, tag, data] = value.split(':').map(part => Buffer.from(part, 'base64'))
  const decipher = createDecipheriv('aes-256-gcm', key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}
