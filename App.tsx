
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, Course, SimulationSession, Interaction, StudentProgress, Evaluation } from './types';
import { MOCK_COURSES, MOCK_USERS } from './constants';
import { simulatePatientResponse, generateStaffBriefing } from './geminiService';
import { 
  BookOpen, 
  MessageSquare, 
  ClipboardCheck, 
  Users, 
  LogOut, 
  ChevronRight, 
  Send, 
  AlertCircle,
  CheckCircle2,
  Clock,
  LayoutDashboard
} from 'lucide-react';

// --- Components ---

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-indigo-600 text-white shadow-md' 
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const CourseCard = ({ course, completed, onSelect }: { course: Course, completed: boolean, onSelect: () => void }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${completed ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
          <BookOpen size={24} />
        </div>
        {completed && (
          <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center">
            <CheckCircle2 size={12} className="mr-1" />
            COMPLETED
          </span>
        )}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{course.title}</h3>
      <p className="text-sm text-slate-500 line-clamp-2 mb-4">{course.description}</p>
      <button
        onClick={onSelect}
        className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all"
      >
        <span>View Modules</span>
        <ChevronRight size={16} />
      </button>
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'simulations' | 'evaluations'>('dashboard');
  const [courses] = useState<Course[]>(MOCK_COURSES);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  // Persistence state
  const [studentProgress, setStudentProgress] = useState<StudentProgress>({
    studentId: 'u-2',
    completedCourseIds: [],
  });
  const [sessions, setSessions] = useState<SimulationSession[]>([]);
  const [activeSession, setActiveSession] = useState<SimulationSession | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Initialize data
  useEffect(() => {
    const savedProgress = localStorage.getItem('psychebridge_progress');
    const savedSessions = localStorage.getItem('psychebridge_sessions');
    if (savedProgress) setStudentProgress(JSON.parse(savedProgress));
    if (savedSessions) setSessions(JSON.parse(savedSessions));
  }, []);

  useEffect(() => {
    localStorage.setItem('psychebridge_progress', JSON.stringify(studentProgress));
    localStorage.setItem('psychebridge_sessions', JSON.stringify(sessions));
  }, [studentProgress, sessions]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedCourse(null);
    setActiveSession(null);
  };

  const completeCourse = (id: string) => {
    setStudentProgress(prev => ({
      ...prev,
      completedCourseIds: Array.from(new Set([...prev.completedCourseIds, id]))
    }));
    alert("Course completed! Simulation unlocked.");
  };

  const startSimulation = (course: Course) => {
    const newSession: SimulationSession = {
      id: `sess-${Date.now()}`,
      studentId: currentUser?.id || 'u-2',
      courseId: course.id,
      transcript: [],
      status: 'active',
      startTime: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSession(newSession);
    setActiveTab('simulations');
    setSelectedCourse(null);
  };

  const sendMessage = async (text: string) => {
    if (!activeSession || !text.trim()) return;

    const studentInteraction: Interaction = {
      role: 'student',
      content: text,
      timestamp: Date.now()
    };

    const updatedTranscript = [...activeSession.transcript, studentInteraction];
    
    setActiveSession(prev => prev ? { ...prev, transcript: updatedTranscript } : null);
    setIsTyping(true);

    const course = courses.find(c => c.id === activeSession.courseId);
    const patientResponseText = await simulatePatientResponse(
      course?.patientBio || '',
      activeSession.transcript,
      text
    );

    const patientInteraction: Interaction = {
      role: 'patient',
      content: patientResponseText,
      timestamp: Date.now()
    };

    const finalTranscript = [...updatedTranscript, patientInteraction];
    
    setIsTyping(false);
    setActiveSession(prev => prev ? { ...prev, transcript: finalTranscript } : null);
    
    // Update main sessions list
    setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, transcript: finalTranscript } : s));
  };

  const finishSession = () => {
    if (!activeSession) return;
    const completedSession: SimulationSession = {
      ...activeSession,
      status: 'completed'
    };
    setSessions(prev => prev.map(s => s.id === activeSession.id ? completedSession : s));
    setActiveSession(null);
    setActiveTab('dashboard');
  };

  const submitEvaluation = (sessionId: string, evaluation: Evaluation) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'evaluated', evaluation } : s));
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl text-indigo-600 mb-4">
              <BookOpen size={40} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">PsycheBridge</h1>
            <p className="text-slate-500 mt-2">Clinical Training Portal</p>
          </div>
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Role to Enter</h2>
            {MOCK_USERS.map(user => (
              <button
                key={user.id}
                onClick={() => handleLogin(user)}
                className="w-full flex items-center justify-between p-4 border-2 border-slate-100 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <img src={user.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt={user.name} />
                  <div className="text-left">
                    <p className="font-bold text-slate-800">{user.name}</p>
                    <p className="text-xs text-indigo-600 font-medium">{user.role}</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-indigo-500" />
              </button>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-slate-400">
            Secure Academy Training Environment &bull; V1.0
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-indigo-600">
            {/* Fix: Lucide icons do not support a 'weight' prop. Removed 'weight="bold"'. */}
            <BookOpen size={24} />
            <span className="text-xl font-bold tracking-tight text-slate-900">PsycheBridge</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setSelectedCourse(null); setActiveSession(null); }} 
          />
          <SidebarItem 
            icon={BookOpen} 
            label="Curriculum" 
            active={activeTab === 'courses'} 
            onClick={() => { setActiveTab('courses'); setSelectedCourse(null); setActiveSession(null); }} 
          />
          {currentUser.role === UserRole.STUDENT && (
            <SidebarItem 
              icon={MessageSquare} 
              label="Simulations" 
              active={activeTab === 'simulations'} 
              onClick={() => setActiveTab('simulations')} 
            />
          )}
          <SidebarItem 
            icon={ClipboardCheck} 
            label={currentUser.role === UserRole.STAFF ? "Review Tasks" : "Evaluations"} 
            active={activeTab === 'evaluations'} 
            onClick={() => setActiveTab('evaluations')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center space-x-3 p-2">
            <img src={currentUser.avatar} className="w-10 h-10 rounded-full border border-slate-200" alt="" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 truncate">{currentUser.role}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <h2 className="text-lg font-bold text-slate-800 capitalize">
            {activeTab === 'dashboard' ? 'Overview' : activeTab}
          </h2>
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
              Academic Term: Fall 2024
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 text-sm font-medium">Courses Completed</span>
                    <BookOpen className="text-indigo-500" size={20} />
                  </div>
                  <p className="text-3xl font-bold text-slate-900">
                    {currentUser.role === UserRole.STUDENT 
                      ? studentProgress.completedCourseIds.length 
                      : courses.length}
                  </p>
                  <div className="mt-2 text-xs text-green-600 font-medium">Progress tracked</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 text-sm font-medium">Simulations Conducted</span>
                    <MessageSquare className="text-orange-500" size={20} />
                  </div>
                  <p className="text-3xl font-bold text-slate-900">
                    {sessions.length}
                  </p>
                  <div className="mt-2 text-xs text-slate-400 font-medium">Total sessions</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 text-sm font-medium">Pending Reviews</span>
                    <ClipboardCheck className="text-purple-500" size={20} />
                  </div>
                  <p className="text-3xl font-bold text-slate-900">
                    {sessions.filter(s => s.status === 'completed').length}
                  </p>
                  <div className="mt-2 text-xs text-amber-600 font-medium">Awaiting evaluation</div>
                </div>
              </div>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Quick Access</h3>
                  <button onClick={() => setActiveTab('courses')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View all</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map(course => (
                    <CourseCard 
                      key={course.id} 
                      course={course} 
                      completed={studentProgress.completedCourseIds.includes(course.id)}
                      onSelect={() => { setSelectedCourse(course); setActiveTab('courses'); }}
                    />
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="max-w-4xl mx-auto">
              {!selectedCourse ? (
                <div className="grid grid-cols-1 gap-6">
                  {courses.map(course => (
                    <div key={course.id} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row items-center gap-8">
                       <div className="p-6 bg-indigo-50 rounded-2xl text-indigo-600">
                        <BookOpen size={48} />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{course.title}</h3>
                        <p className="text-slate-500 mb-6">{course.description}</p>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                          <button 
                            onClick={() => setSelectedCourse(course)}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                          >
                            Enter Course
                          </button>
                          {studentProgress.completedCourseIds.includes(course.id) && (
                            <button 
                              onClick={() => startSimulation(course)}
                              className="bg-white border-2 border-indigo-600 text-indigo-600 px-6 py-2 rounded-lg font-bold hover:bg-indigo-50 transition-colors"
                            >
                              Start Simulation
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="bg-indigo-600 p-8 text-white">
                    <button onClick={() => setSelectedCourse(null)} className="text-indigo-100 hover:text-white mb-4 text-sm font-bold flex items-center">
                      &larr; Back to Catalog
                    </button>
                    <h2 className="text-3xl font-bold">{selectedCourse.title}</h2>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="md:col-span-2 space-y-8">
                        <div>
                          <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                            <AlertCircle size={20} className="mr-2 text-indigo-500" />
                            Learning Modules
                          </h4>
                          <div className="space-y-3">
                            {selectedCourse.modules.map((m, idx) => (
                              <div key={idx} className="flex items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-slate-400 mr-4 border border-slate-200">{idx + 1}</span>
                                <span className="font-medium text-slate-700">{m}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800">
                          <h4 className="font-bold mb-2">Completion Requirement</h4>
                          <p className="text-sm">You must read and acknowledge all modules before the AI Simulation will be unlocked for this course. Simulations are the final practical step before staff review.</p>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                          <h4 className="font-bold text-slate-900 mb-4">Course Status</h4>
                          {studentProgress.completedCourseIds.includes(selectedCourse.id) ? (
                            <div className="space-y-4">
                              <div className="flex items-center text-green-600 bg-green-50 p-3 rounded-lg text-sm font-bold">
                                <CheckCircle2 className="mr-2" /> Course Completed
                              </div>
                              <button 
                                onClick={() => startSimulation(selectedCourse)}
                                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                              >
                                Enter Patient Sim
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => completeCourse(selectedCourse.id)}
                              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
                            >
                              Acknowledge Completion
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'simulations' && (
            <div className="max-w-5xl mx-auto h-full flex flex-col">
              {!activeSession ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                  <div className="p-8 bg-slate-100 rounded-full text-slate-400">
                    <MessageSquare size={64} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">No Active Simulation</h3>
                    <p className="text-slate-500">Go to Curriculum to start a new patient interaction.</p>
                  </div>
                  <button onClick={() => setActiveTab('courses')} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">
                    Open Curriculum
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                        P
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Patient: {courses.find(c => c.id === activeSession.courseId)?.patientScenario}</h4>
                        <p className="text-xs text-slate-500">Training Session In Progress</p>
                      </div>
                    </div>
                    <button 
                      onClick={finishSession}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors"
                    >
                      End Session
                    </button>
                  </div>

                  {/* Message Area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeSession.transcript.length === 0 && (
                      <div className="text-center py-10">
                        <p className="text-slate-400 italic">Patient is waiting for you to begin the session...</p>
                      </div>
                    )}
                    {activeSession.transcript.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                          msg.role === 'student' 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                        }`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className={`text-[10px] mt-2 opacity-60 ${msg.role === 'student' ? 'text-right' : 'text-left'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 rounded-2xl p-4 rounded-tl-none border border-slate-200">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="p-4 border-t border-slate-200">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
                        if (input.value.trim()) {
                          sendMessage(input.value);
                          input.value = '';
                        }
                      }}
                      className="flex space-x-4"
                    >
                      <input 
                        name="message"
                        type="text" 
                        placeholder="Type your therapeutic response..." 
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        autoComplete="off"
                        disabled={isTyping}
                      />
                      <button 
                        type="submit"
                        disabled={isTyping}
                        className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
                      >
                        <Send size={24} />
                      </button>
                    </form>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">Session is being recorded for supervisor evaluation.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'evaluations' && (
            <div className="max-w-5xl mx-auto space-y-8">
              {currentUser.role === UserRole.STUDENT ? (
                <div className="space-y-6">
                  <div className="bg-white p-8 rounded-2xl border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">My Evaluation Record</h3>
                    <p className="text-slate-500 mb-6">Track your clinical performance and certification status.</p>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="pb-4 font-bold text-slate-400 text-sm uppercase">Simulation</th>
                            <th className="pb-4 font-bold text-slate-400 text-sm uppercase">Date</th>
                            <th className="pb-4 font-bold text-slate-400 text-sm uppercase">Status</th>
                            <th className="pb-4 font-bold text-slate-400 text-sm uppercase">Score</th>
                            <th className="pb-4 font-bold text-slate-400 text-sm uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {sessions.filter(s => s.studentId === currentUser.id).map(session => {
                            const course = courses.find(c => c.id === session.courseId);
                            return (
                              <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-4">
                                  <div className="font-bold text-slate-800">{course?.title}</div>
                                  <div className="text-xs text-slate-400">Sess ID: {session.id}</div>
                                </td>
                                <td className="py-4 text-sm text-slate-600">
                                  {new Date(session.startTime).toLocaleDateString()}
                                </td>
                                <td className="py-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    session.status === 'evaluated' ? 'bg-green-100 text-green-700' :
                                    session.status === 'completed' ? 'bg-amber-100 text-amber-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {session.status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-4 font-bold text-slate-900">
                                  {session.evaluation ? `${session.evaluation.score}/100` : '--'}
                                </td>
                                <td className="py-4">
                                  <button 
                                    className="text-indigo-600 font-bold text-sm hover:underline"
                                    onClick={() => alert(`View Details for ${session.id}\nStatus: ${session.status}`)}
                                  >
                                    View Report
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                /* STAFF REVIEW INTERFACE */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <h3 className="text-xl font-bold text-slate-900">Pending Reviews</h3>
                    <div className="space-y-4">
                      {sessions.filter(s => s.status === 'completed').length === 0 && (
                        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                          <p className="text-slate-400">No sessions currently pending review.</p>
                        </div>
                      )}
                      {sessions.filter(s => s.status === 'completed').map(session => {
                        const course = courses.find(c => c.id === session.courseId);
                        const student = MOCK_USERS.find(u => u.id === session.studentId);
                        return (
                          <button 
                            key={session.id}
                            onClick={() => setActiveSession(session)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                              activeSession?.id === session.id 
                                ? 'bg-indigo-50 border-indigo-600 shadow-sm' 
                                : 'bg-white border-white hover:border-slate-200 shadow-sm'
                            }`}
                          >
                            <div className="flex items-center space-x-3 mb-2">
                              <img src={student?.avatar} className="w-8 h-8 rounded-full" alt="" />
                              <span className="font-bold text-slate-900">{student?.name}</span>
                            </div>
                            <p className="text-sm font-medium text-slate-700 mb-1">{course?.title}</p>
                            <div className="flex items-center text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                              <Clock size={10} className="mr-1" />
                              {new Date(session.startTime).toLocaleString()}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    {activeSession ? (
                      <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                            <h4 className="font-bold">Interaction Transcript</h4>
                            <span className="text-xs bg-indigo-500 px-2 py-1 rounded">Locked for Review</span>
                          </div>
                          <div className="p-6 h-[400px] overflow-y-auto bg-slate-50 space-y-4">
                            {activeSession.transcript.map((msg, idx) => (
                              <div key={idx} className={`p-4 rounded-xl text-sm ${
                                msg.role === 'student' ? 'bg-indigo-100 border border-indigo-200' : 'bg-white border border-slate-200'
                              }`}>
                                <p className="font-bold mb-1 text-[10px] uppercase text-slate-400">{msg.role}</p>
                                <p>{msg.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                          <h4 className="text-lg font-bold text-slate-900 mb-6">Submit Evaluation</h4>
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.currentTarget);
                              const evaluation: Evaluation = {
                                score: Number(formData.get('score')),
                                feedback: formData.get('feedback') as string,
                                strengths: [formData.get('strengths') as string],
                                improvements: [formData.get('improvements') as string],
                                staffId: currentUser.id,
                                evaluatedAt: Date.now()
                              };
                              submitEvaluation(activeSession.id, evaluation);
                              setActiveSession(null);
                              alert("Evaluation submitted successfully.");
                            }}
                            className="space-y-6"
                          >
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Clinical Competency Score (0-100)</label>
                                <input name="score" type="number" min="0" max="100" defaultValue="85" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3" required />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Detailed Feedback</label>
                              <textarea name="feedback" rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3" placeholder="Provide clinical observations..." required></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Core Strengths</label>
                                <input name="strengths" type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3" placeholder="e.g., Active Listening" />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Areas for Improvement</label>
                                <input name="improvements" type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3" placeholder="e.g., Boundary Setting" />
                              </div>
                            </div>
                            <div className="pt-4 flex justify-end space-x-4">
                              <button type="button" onClick={() => setActiveSession(null)} className="px-6 py-2 text-slate-600 font-bold">Cancel</button>
                              <button type="submit" className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-100">
                                Certify Student
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-6 bg-white rounded-2xl border border-dashed border-slate-300 p-12">
                        <Users size={64} className="text-slate-300" />
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Select a Session to Review</h3>
                          <p className="text-slate-400">Click a pending simulation from the left sidebar to begin clinical evaluation.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
