
import { Course, User, UserRole } from './types';

export const MOCK_COURSES: Course[] = [
  {
    id: 'cbt-101',
    title: 'Cognitive Behavioral Therapy (CBT) Foundations',
    description: 'Learn the core principles of CBT including identifying cognitive distortions and restructuring beliefs.',
    modules: [
      'The Cognitive Triad',
      'Identifying Automatic Thoughts',
      'Behavioral Activation Techniques',
      'Structuring the First Session'
    ],
    patientScenario: 'Anxiety and Work Stress',
    patientBio: 'You are Alex, a 34-year-old software engineer. You have been feeling overwhelmed by deadlines and are starting to experience panic attacks before meetings. You are skeptical about therapy but desperate for relief.'
  },
  {
    id: 'mi-202',
    title: 'Motivational Interviewing',
    description: 'Master the art of clinical conversation to elicit behavioral change by exploring and resolving ambivalence.',
    modules: [
      'The Spirit of MI',
      'OARS Skills (Open-ended questions, Affirmations, Reflections, Summaries)',
      'Identifying Change Talk',
      'Developing a Change Plan'
    ],
    patientScenario: 'Smoking Cessation Ambivalence',
    patientBio: 'You are Jordan, a 45-year-old parent who wants to quit smoking for your kids but finds it is the only way you manage stress at a high-pressure job. You feel guilty but also defensive about your habit.'
  },
  {
    id: 'crisis-303',
    title: 'Crisis Intervention & De-escalation',
    description: 'Advanced techniques for handling acute psychological distress and ensuring patient safety.',
    modules: [
      'Risk Assessment Protocols',
      'Grounding Techniques in Crisis',
      'Safety Planning',
      'Ethical Boundaries in Acute Care'
    ],
    patientScenario: 'Acute Relationship Grief',
    patientBio: 'You are Sam, a 22-year-old university student. Your partner of 4 years just ended the relationship unexpectedly. You feel empty, unable to sleep, and are questioning if things will ever get better.'
  }
];

export const MOCK_USERS: User[] = [
  {
    id: 'u-1',
    name: 'Dr. Sarah Mitchell',
    role: UserRole.STAFF,
    avatar: 'https://picsum.photos/seed/sarah/100/100'
  },
  {
    id: 'u-2',
    name: 'Kevin Zhang',
    role: UserRole.STUDENT,
    avatar: 'https://picsum.photos/seed/kevin/100/100'
  }
];
