declare module 'qrcode' {
  export function toDataURL(text: string, options?: any): Promise<string>
  export function toString(text: string, options?: any): Promise<string>
  export function toCanvas(canvas: any, text: string, options?: any): Promise<any>
}

declare module 'next-themes' {
  import * as React from 'react'

  export interface ThemeProviderProps {
    children?: React.ReactNode
    attribute?: string
    defaultTheme?: string
    enableSystem?: boolean
    disableTransitionOnChange?: boolean
    storageKey?: string
    forcedTheme?: string
    themes?: string[]
    value?: { [themeName: string]: string }
  }

  export function ThemeProvider(props: ThemeProviderProps): React.JSX.Element
  export function useTheme(): {
    theme?: string
    setTheme: (theme: string) => void
    forcedTheme?: string
    resolvedTheme?: string
    themes: string[]
    systemTheme?: 'dark' | 'light'
  }
}
