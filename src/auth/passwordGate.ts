const PASSWORD_HASH_HEX = 'b66134c8fefb3ef80a74c1d8732ee3625ca28f43d7c3b80dc1f2272642b76cec'
const UNLOCK_KEY = 'lexicon-unlocked'

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string): Promise<boolean> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  return toHex(digest) === PASSWORD_HASH_HEX
}

export function isUnlocked(storage?: Storage): boolean {
  const resolvedStorage = storage ?? (typeof sessionStorage === 'undefined' ? undefined : sessionStorage)
  return resolvedStorage?.getItem(UNLOCK_KEY) === 'true'
}

export function unlock(storage?: Storage): void {
  const resolvedStorage = storage ?? (typeof sessionStorage === 'undefined' ? undefined : sessionStorage)
  resolvedStorage?.setItem(UNLOCK_KEY, 'true')
}

export function lock(storage?: Storage): void {
  const resolvedStorage = storage ?? (typeof sessionStorage === 'undefined' ? undefined : sessionStorage)
  resolvedStorage?.removeItem(UNLOCK_KEY)
}