import { createClient, type User } from '@supabase/supabase-js'
import type { LearningState } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
const client = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null

export interface SyncAccount {
  id: string
  email: string
}

function accountFromUser(user: User): SyncAccount {
  return { id: user.id, email: user.email ?? '' }
}

function requireClient() {
  if (!client) throw new Error('Cloud sync is not configured for this deployment.')
  return client
}

export function isSyncConfigured(): boolean {
  return client !== null
}

export async function getSyncAccount(): Promise<SyncAccount | null> {
  if (!client) return null
  const { data } = await client.auth.getUser()
  return data.user ? accountFromUser(data.user) : null
}

export async function signInToSync(email: string, password: string): Promise<SyncAccount> {
  const { data, error } = await requireClient().auth.signInWithPassword({ email, password })
  if (error || !data.user) throw error ?? new Error('The sync account could not be opened.')
  return accountFromUser(data.user)
}

export async function createSyncAccount(email: string, password: string): Promise<{ account: SyncAccount | null; needsConfirmation: boolean }> {
  const { data, error } = await requireClient().auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) throw error
  return {
    account: data.user ? accountFromUser(data.user) : null,
    needsConfirmation: !data.session,
  }
}

export async function signOutOfSync(): Promise<void> {
  await requireClient().auth.signOut()
}

export async function downloadSyncedState(): Promise<unknown | null> {
  const account = await getSyncAccount()
  if (!account) return null
  const { data, error } = await requireClient()
    .from('learning_states')
    .select('state')
    .eq('user_id', account.id)
    .maybeSingle()
  if (error) throw error
  return data?.state ?? null
}

export async function uploadSyncedState(state: LearningState): Promise<void> {
  const account = await getSyncAccount()
  if (!account) throw new Error('Sign in before syncing progress.')
  const { error } = await requireClient().from('learning_states').upsert({
    user_id: account.id,
    state,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}