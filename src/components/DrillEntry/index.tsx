import { useNavigate } from 'react-router-dom'
import IconSchool from '~icons/tabler/school'

export default function DrillEntry() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate('/practice')}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500 text-white shadow-xl transition-all hover:scale-105 hover:bg-indigo-400"
      title="基础练习"
    >
      <IconSchool className="h-7 w-7" />
    </button>
  )
}
