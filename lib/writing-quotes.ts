import quotes from '@/data/writing-quotes.json'

export type WritingQuote = {
  text: string
  author: string
}

export const writingQuotes = quotes as WritingQuote[]

export function pickRandomQuote(): WritingQuote {
  return writingQuotes[Math.floor(Math.random() * writingQuotes.length)]
}
