interface Props {
  total: number
  current: number
}

export default function ProgressDots({ total, current }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current
        const active = i === current
        let cls = 'h-2.5 rounded-full transition-all duration-300 '
        if (active) cls += 'w-7 bg-indigo-500'
        else if (done) cls += 'w-2.5 bg-indigo-500'
        else cls += 'w-2.5 bg-gray-200 dark:bg-gray-700'
        return <div key={i} className={cls} />
      })}
    </div>
  )
}
