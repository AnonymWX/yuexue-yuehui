export interface CourseWord {
  id: string
  name: string
  trans: string[]
  tags?: string[]
  source?: string[]
}

export interface CourseGrammarExample {
  vi: string
  zh: string
}

export interface CourseGrammar {
  point: string
  explain: string
  examples: CourseGrammarExample[]
}

export interface CourseTelex {
  target: string
  telex: string
  rule?: string
}

export interface CourseExercise {
  type: 'choose' | 'fill' | 'telex_input'
  question?: string
  options?: string[]
  answer: string
}

export interface Course {
  id: string
  title: string
  titleVi?: string
  level: string
  order: number
  scenario?: string
  goals: string[]
  words: CourseWord[]
  sentences: string[]
  grammar: CourseGrammar[]
  telex: CourseTelex[]
  exercises: CourseExercise[]
}

export interface CourseIndexItem {
  id: string
  title: string
  titleVi?: string
  file: string
  order: number
  level: string
}

export type CourseIndex = Record<string, CourseIndexItem[]>
