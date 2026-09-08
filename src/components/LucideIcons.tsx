import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function IconBase({ children, ...props }: IconProps) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>
}

export function SearchIcon(props: IconProps) {
  return <IconBase {...props}><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></IconBase>
}

export function MoonIcon(props: IconProps) {
  return <IconBase {...props}><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" /></IconBase>
}

export function SunIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></IconBase>
}

export function ArrowUpIcon(props: IconProps) {
  return <IconBase {...props}><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></IconBase>
}

export function CommandIcon(props: IconProps) {
  return <IconBase {...props}><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" /></IconBase>
}

export function LayersIcon(props: IconProps) {
  return <IconBase {...props}><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" /><path d="m22 12.5-9.17 4.17a2 2 0 0 1-1.66 0L2 12.5" /><path d="m22 17.5-9.17 4.17a2 2 0 0 1-1.66 0L2 17.5" /></IconBase>
}
