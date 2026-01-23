
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Quiz, Lesson, StudentQuizResult, TeacherData } from '@/types/quiz';

const LS_QUIZZES_KEY = 'mathWithMalikQuizzes';
const LS_LESSONS_KEY = 'mathWithMalikLessons';
const LS_RESULTS_KEY = 'mathWithMalikResults';
const LS_TEACHER_KEY = 'mathWithMalikTeacher';

export const dbService = {
  // Quizzes
  async getQuizzes(): Promise<Quiz[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('quizzes').select('*').order('createdAt', { ascending: false });
        if (!error && data) return data as Quiz[];
        if (error) console.warn('Supabase getQuizzes error:', error.message);
      } catch (e) {
        console.error('Supabase connection error:', e);
      }
    }
    const stored = localStorage.getItem(LS_QUIZZES_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  async saveQuiz(quiz: Quiz): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('quizzes').upsert(quiz);
      if (error) {
        console.error('Error saving quiz to Supabase:', error);
        throw error;
      }
    }
    // Also update local storage for redundancy/offline
    try {
      const stored = localStorage.getItem(LS_QUIZZES_KEY);
      let quizzes: Quiz[] = stored ? JSON.parse(stored) : [];
      const index = quizzes.findIndex(q => q.id === quiz.id);
      if (index >= 0) quizzes[index] = quiz;
      else quizzes.push(quiz);
      localStorage.setItem(LS_QUIZZES_KEY, JSON.stringify(quizzes));
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }
  },

  async deleteQuiz(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('quizzes').delete().eq('id', id);
      if (error) {
        console.error('Error deleting quiz from Supabase:', error);
        throw error;
      }
    }
    try {
      const stored = localStorage.getItem(LS_QUIZZES_KEY);
      if (stored) {
        let quizzes: Quiz[] = JSON.parse(stored);
        localStorage.setItem(LS_QUIZZES_KEY, JSON.stringify(quizzes.filter(q => q.id !== id)));
      }
    } catch (e) {
      console.error('LocalStorage delete error:', e);
    }
  },

  async getQuizByCode(code: string): Promise<Quiz | null> {
    const cleanCode = code.toUpperCase().trim();
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('accessCode', cleanCode)
          .maybeSingle();
        if (!error && data) return data as Quiz;
        if (error) console.warn('Supabase getQuizByCode error:', error.message);
      } catch (e) {
        console.error('Supabase connection error:', e);
      }
    }
    const quizzes = await this.getQuizzes();
    return quizzes.find(q => q.accessCode === cleanCode) || null;
  },

  // Lessons
  async getLessons(): Promise<Lesson[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('lessons').select('*').order('createdAt', { ascending: false });
        if (!error && data) return data as Lesson[];
        if (error) console.warn('Supabase getLessons error:', error.message);
      } catch (e) {
        console.error('Supabase connection error:', e);
      }
    }
    const stored = localStorage.getItem(LS_LESSONS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  async saveLesson(lesson: Lesson): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('lessons').upsert(lesson);
      if (error) {
        console.error('Error saving lesson to Supabase:', error);
        throw error;
      }
    }
    try {
      const stored = localStorage.getItem(LS_LESSONS_KEY);
      let lessons: Lesson[] = stored ? JSON.parse(stored) : [];
      const index = lessons.findIndex(l => l.id === lesson.id);
      if (index >= 0) lessons[index] = lesson;
      else lessons.push(lesson);
      localStorage.setItem(LS_LESSONS_KEY, JSON.stringify(lessons));
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }
  },

  async deleteLesson(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('lessons').delete().eq('id', id);
      if (error) {
        console.error('Error deleting lesson from Supabase:', error);
        throw error;
      }
    }
    try {
      const stored = localStorage.getItem(LS_LESSONS_KEY);
      if (stored) {
        let lessons: Lesson[] = JSON.parse(stored);
        localStorage.setItem(LS_LESSONS_KEY, JSON.stringify(lessons.filter(l => l.id !== id)));
      }
    } catch (e) {
      console.error('LocalStorage delete error:', e);
    }
  },

  async getLessonByCode(code: string): Promise<Lesson | null> {
    const cleanCode = code.toUpperCase().trim();
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .eq('accessCode', cleanCode)
          .maybeSingle();
        if (!error && data) return data as Lesson;
        if (error) console.warn('Supabase getLessonByCode error:', error.message);
      } catch (e) {
        console.error('Supabase connection error:', e);
      }
    }
    const lessons = await this.getLessons();
    return lessons.find(l => l.accessCode === cleanCode) || null;
  },

  // Results
  async getResults(): Promise<StudentQuizResult[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('results').select('*').order('completedAt', { ascending: false });
        if (!error && data) return data as StudentQuizResult[];
        if (error) console.warn('Supabase getResults error:', error.message);
      } catch (e) {
        console.error('Supabase connection error:', e);
      }
    }
    const stored = localStorage.getItem(LS_RESULTS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  async saveResult(result: StudentQuizResult): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('results').upsert(result);
      if (error) {
        console.error('Error saving result to Supabase:', error);
        throw error;
      }
    }
    try {
      const stored = localStorage.getItem(LS_RESULTS_KEY);
      let results: StudentQuizResult[] = stored ? JSON.parse(stored) : [];
      results.push(result);
      localStorage.setItem(LS_RESULTS_KEY, JSON.stringify(results));
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }
  },

  // Teacher
  async saveTeacher(teacher: TeacherData): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('teachers').upsert(teacher);
      if (error) {
        console.error('Error saving teacher to Supabase:', error);
        throw error;
      }
    }
    localStorage.setItem(LS_TEACHER_KEY, JSON.stringify(teacher));
  }
};
