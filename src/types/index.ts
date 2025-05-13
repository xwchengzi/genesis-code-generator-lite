
export interface Profile {
  id: string;
  username: string;
  phone_number: string;
  school: string | null;
  college: string | null;
  major: string | null;
  grade_year: string | null;
  user_type: 'user' | 'admin';
  access_expiry_date: string;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: number;
  subject_id: number;
  title: string;
  description: string | null;
  keywords: string | null;
  created_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: number;
  course_id: number;
  title: string;
  video_storage_path: string;
  order_in_course: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChapterProgress {
  user_id: string;
  chapter_id: number;
  watched_at: string;
}
