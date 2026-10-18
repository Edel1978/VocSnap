import type { ExchangeData, ImportSummary } from './exchange'
import type {
  Lesson,
  LessonInput,
  Profile,
  ProfileInput,
  ReviewEvent,
  ReviewEventInput,
  Word,
  WordInput,
} from './types'

// Einzige Schnittstelle der Oberfläche zu den Daten. Listen liefern nur nicht gelöschte Datensätze.
// Löschen einer Lektion oder eines Profils markiert die zugehörigen Datensätze mit.
export interface Store {
  listProfiles(): Promise<Profile[]>
  getProfile(id: string): Promise<Profile | undefined>
  createProfile(input: ProfileInput): Promise<Profile>
  updateProfile(id: string, patch: Partial<ProfileInput>): Promise<Profile>
  deleteProfile(id: string): Promise<void>

  listLessons(profileId: string): Promise<Lesson[]>
  getLesson(id: string): Promise<Lesson | undefined>
  createLesson(input: LessonInput): Promise<Lesson>
  updateLesson(id: string, patch: Partial<LessonInput>): Promise<Lesson>
  deleteLesson(id: string): Promise<void>

  listWords(lessonId: string): Promise<Word[]>
  getWord(id: string): Promise<Word | undefined>
  createWord(input: WordInput): Promise<Word>
  // Mehrere Wörter auf einmal: alle oder keins.
  createWords(inputs: WordInput[]): Promise<Word[]>
  updateWord(id: string, patch: Partial<WordInput>): Promise<Word>
  deleteWord(id: string): Promise<void>

  addReviewEvent(input: ReviewEventInput): Promise<ReviewEvent>
  listReviewEvents(profileId: string): Promise<ReviewEvent[]>

  exportAll(): Promise<ExchangeData>
  // Erwartet geprüfte Daten (parseExchange) und führt sie nach der Konfliktregel zusammen.
  importAll(data: ExchangeData): Promise<ImportSummary>
}
