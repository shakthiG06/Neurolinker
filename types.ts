
export enum UserRole {
  STUDENT = 'STUDENT',
  STAFF = 'STAFF'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: string[];
  patientScenario: string;
  patientBio: string;
}

export interface Interaction {
  role: 'student' | 'patient';
  content: string;
  timestamp: number;
}

export interface SimulationSession {
  id: string;
  studentId: string;
  courseId: string;
  transcript: Interaction[];
  status: 'active' | 'completed' | 'evaluated';
  evaluation?: Evaluation;
  startTime: number;
}

export interface Evaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  staffId: string;
  evaluatedAt: number;
}

export interface StudentProgress {
  studentId: string;
  completedCourseIds: string[];
  activeSimulationId?: string;
}
