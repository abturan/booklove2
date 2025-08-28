export function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(' ')
}

export function monthKey(d = new Date()) {
  const y = d.getFullYear()
  const m = (d.getMonth()+1).toString().padStart(2,'0')
  return `${y}-${m}`
}
