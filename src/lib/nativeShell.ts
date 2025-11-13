// src/lib/nativeShell.ts
export type NativePlatform = 'web' | 'ios' | 'android' | 'electron' | 'desktop' | 'unknown'
export type NativeShellState = { isNative: boolean; platform: NativePlatform; forced: 'native' | 'web' | null }

export function detectNativeShell(): NativeShellState {
  if (typeof window === 'undefined') return { isNative: false, platform: 'web', forced: null }
  const runtime = (window as any)?.Capacitor
  const params = new URLSearchParams(window.location?.search || '')
  const forcedParam = params.get('appShell')
  const forced = forcedParam === 'native' ? 'native' : forcedParam === 'web' ? 'web' : null
  if (forced === 'native') return { isNative: true, platform: 'unknown', forced }
  if (forced === 'web') return { isNative: false, platform: 'web', forced }
  if (!runtime) return { isNative: false, platform: 'web', forced: null }
  const platformRaw =
    typeof runtime.getPlatform === 'function' ? runtime.getPlatform() : runtime.platform || 'unknown'
  const platform = normalizeNativePlatform(String(platformRaw || 'unknown'))
  const isNative =
    typeof runtime.isNativePlatform === 'function' ? !!runtime.isNativePlatform() : platform !== 'web'
  return { isNative, platform, forced: null }
}

export function formatNativePlatform(platform: NativePlatform): string {
  if (platform === 'ios') return 'iOS'
  if (platform === 'android') return 'Android'
  if (platform === 'electron' || platform === 'desktop') return 'Masaüstü'
  if (platform === 'unknown') return 'Native'
  return 'Web'
}

export function normalizeNativePlatform(value: string): NativePlatform {
  const normalized = value.toLowerCase()
  if (normalized === 'ios') return 'ios'
  if (normalized === 'android') return 'android'
  if (normalized === 'electron') return 'electron'
  if (normalized === 'desktop') return 'desktop'
  if (normalized === 'web') return 'web'
  return 'unknown'
}
