import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  collection, doc, onSnapshot, query, addDoc, updateDoc, 
  deleteDoc, serverTimestamp, setDoc, getDoc, getDocs, where, Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Project, Task, TaskStatus, TaskPriority, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { 
  Plus, Users, Trash2, CheckCircle2, Circle, Clock, 
  AlertCircle, ChevronRight, MoreVertical, Search, Play, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as TaskPriority, dueDate: '' });
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [taskErrorMessage, setTaskErrorMessage] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);

  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  const isAdminOrOwner = profile?.role === 'Admin' || project?.ownerId === user?.uid || myRole === 'Owner' || myRole === 'Admin';

  useEffect(() => {
    if (!projectId || !user) return;

    // Fetch Project
    const unsubscribeProject = onSnapshot(doc(db, 'projects', projectId), (snap) => {
      if (snap.exists()) {
        const data = snap.id ? { id: snap.id, ...snap.data() } as Project : null;
        setProject(data);
      } else {
        navigate('/projects');
      }
    }, (error) => {
      console.error("Project load error:", error);
      setLoading(false);
    });

    // Check Membership & Role
    const unsubscribeMemberCheck = onSnapshot(doc(db, 'projects', projectId, 'members', user.uid), (snap) => {
      setIsMember(snap.exists());
      if (snap.exists()) {
        setMyRole(snap.data()?.role);
      }
    });

    // Fetch Tasks
    const qTasks = query(collection(db, 'projects', projectId, 'tasks'));
    const unsubscribeTasks = onSnapshot(qTasks, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      setLoading(false);
    }, (error) => {
      console.error("Tasks load error:", error);
      // If we get a permission error here, it confirms the user isn't a member in the rules sense
      if (error.message.includes('permission')) {
        setIsMember(false);
      }
      setLoading(false);
    });

    // Fetch Members
    const qMembers = query(collection(db, 'projects', projectId, 'members'));
    const unsubscribeMembers = onSnapshot(qMembers, (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Members load error:", error);
    });

    return () => {
      unsubscribeProject();
      unsubscribeTasks();
      unsubscribeMembers();
      unsubscribeMemberCheck();
    };
  }, [projectId, user, navigate]);

  // Self-healing: if user is owner but not member, add them
  useEffect(() => {
    if (project && user && project.ownerId === user.uid && (!project.members || !project.members.includes(user.uid) || isMember === false)) {
      const fixMembership = async () => {
        try {
          console.log("Healing membership for owner...");
          // Update project doc with members array
          const currentMembers = project.members || [];
          if (!currentMembers.includes(user.uid)) {
            await updateDoc(doc(db, 'projects', project.id), {
              members: [...currentMembers, user.uid],
              updatedAt: serverTimestamp()
            });
          }

          // Also ensure subcollection record exists
          await setDoc(doc(db, 'projects', project.id, 'members', user.uid), {
            userId: user.uid,
            projectId: project.id,
            role: 'Owner',
            joinedAt: serverTimestamp(),
          });
          setIsMember(true);
        } catch (err) {
          console.error("Failed to heal membership:", err);
        }
      };
      fixMembership();
    }
  }, [project, user, isMember]);

  // Update Project stats whenever tasks change
  useEffect(() => {
    if (!project || !tasks || !projectId) return;

    const taskCount = tasks.length;
    const completedCount = tasks.filter(t => t.status === 'completed').length;

    // Only update if values changed to avoid infinite loops
    if (project.taskCount !== taskCount || project.completedCount !== completedCount) {
      const updateStats = async () => {
        try {
          await updateDoc(doc(db, 'projects', projectId), {
            taskCount,
            completedCount,
            updatedAt: serverTimestamp()
          });
        } catch (err) {
          console.error("Failed to update project stats:", err);
        }
      };
      updateStats();
    }
  }, [tasks, project, projectId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !user || !newTask.title) {
      console.warn("Invalid task submission:", { projectId, userId: user?.uid, title: newTask.title });
      return;
    }

    setTaskErrorMessage(null);
    setIsSubmittingTask(true);
    console.log("Task data prep:", {
      projectId,
      title: newTask.title,
      priority: newTask.priority,
      status: 'todo',
      createdBy: user.uid
    });

    const taskData = {
      projectId,
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      priority: newTask.priority,
      status: 'todo',
      assignedTo: null,
      dueDate: newTask.dueDate ? Timestamp.fromDate(new Date(newTask.dueDate)) : null,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, 'projects', projectId, 'tasks'), taskData);
      console.log("Task released successfully with ID:", docRef.id);
      setNewTask({ title: '', description: '', priority: 'medium', dueDate: '' });
      setIsTaskModalOpen(false);
    } catch (error: any) {
       console.error("Task release failed:", error);
       setTaskErrorMessage(error.message || "Failed to release task. Please check your permissions.");
       handleFirestoreError(error, OperationType.WRITE, `projects/${projectId}/tasks`);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (!projectId) return;
    try {
      await updateDoc(doc(db, 'projects', projectId, 'tasks', taskId), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}/tasks/${taskId}`);
    }
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !editingTask) return;

    try {
      await updateDoc(doc(db, 'projects', projectId, 'tasks', editingTask.id), {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        assignedTo: editingTask.assignedTo || null,
        dueDate: editingTask.dueDate ? (editingTask.dueDate instanceof Timestamp ? editingTask.dueDate : Timestamp.fromDate(new Date((editingTask.dueDate as any)))) : null,
        updatedAt: serverTimestamp(),
      });
      setEditingTask(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}/tasks/${editingTask.id}`);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!projectId || !confirm('Discard this operational task?')) return;
    try {
      await deleteDoc(doc(db, 'projects', projectId, 'tasks', taskId));
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}/tasks/${taskId}`);
    }
  };

  const handleRemoveMember = async (memberUid: string) => {
    if (!projectId || !project || !confirm('Partition this member from the team workspace?')) return;
    if (memberUid === project.ownerId) {
      alert("Constitutional protection: The owner cannot be partitioned.");
      return;
    }

    try {
      // Remove from members subcollection
      await deleteDoc(doc(db, 'projects', projectId, 'members', memberUid));

      // Update project members array
      const currentMembers = project.members || [];
      const updatedMembers = currentMembers.filter(id => id !== memberUid);
      
      await updateDoc(doc(db, 'projects', projectId), {
        members: updatedMembers,
        updatedAt: serverTimestamp(),
      });
      
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to partition member. Insufficient administrative authority.");
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !newMemberEmail || !project) return;

    try {
      // Find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', newMemberEmail.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("Member not found in current workspace registry.");
        return;
      }

      const memberUser = querySnapshot.docs[0].data();
      const memberUid = querySnapshot.docs[0].id;

      // Add to members subcollection
      await setDoc(doc(db, 'projects', projectId, 'members', memberUid), {
        userId: memberUid,
        projectId,
        role: 'Member',
        joinedAt: serverTimestamp(),
      });

      // Update project members array
      const currentMembers = project.members || [];
      if (!currentMembers.includes(memberUid)) {
        await updateDoc(doc(db, 'projects', projectId), {
          members: [...currentMembers, memberUid],
          updatedAt: serverTimestamp(),
        });
      }

      setNewMemberEmail('');
      setIsMemberModalOpen(false);
    } catch (error) {
      console.error("Error adding member:", error);
      alert("Failed to invite member. Check administrative privileges.");
    }
  };
  const deleteProject = async () => {
    if (!projectId) return;
    // Simple confirmation using state or just proceeding if the user clicked trash (we'll assume they meant it for this simplified demo if confirm is blocked)
    // In a real app, I'd build a custom modal.
    const isConfirmed = window.confirm ? window.confirm('Are you sure you want to delete this project? All tasks will be lost.') : true;
    if (!isConfirmed) return;

    try {
      await deleteDoc(doc(db, 'projects', projectId));
      navigate('/projects');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}`);
    }
  };

  if (loading) return (
    <div className="animate-pulse flex flex-col gap-10">
      <div className="space-y-4">
        <div className="h-6 bg-zinc-900 rounded w-1/4"></div>
        <div className="h-16 bg-zinc-900 rounded-xl w-1/2"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {[1, 2, 3].map(i => <div key={i} className="h-96 bg-zinc-900 rounded-2xl"></div>)}
      </div>
    </div>
  );

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const groupedTasks = {
    'todo': filteredTasks.filter(t => t.status === 'todo'),
    'in-progress': filteredTasks.filter(t => t.status === 'in-progress'),
    'completed': filteredTasks.filter(t => t.status === 'completed'),
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="max-w-3xl">
          <nav className="flex items-center text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">
            <Link to="/projects" className="hover:text-zinc-100 transition-colors">Workspace</Link>
            <ChevronRight className="h-3 w-3 mx-2" />
            <span className="text-zinc-100 italic serif lowercase px-2 bg-zinc-900 border border-zinc-800 rounded">{project?.name}</span>
          </nav>
          <h1 className="text-5xl font-light text-white serif">{project?.name}</h1>
          <p className="text-zinc-500 mt-4 text-base leading-relaxed max-w-xl">{project?.description}</p>
          
          {/* Progress Bar */}
          <div className="mt-8 max-w-md">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600 mb-2">
              <span>Objective Completion</span>
              <span>
                {tasks.length > 0 
                  ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) 
                  : 0}%
              </span>
            </div>
            <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ 
                  width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0}%` 
                }}
                className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMemberModalOpen(true)}
            className="p-3.5 bg-[#0F0F11] border border-[#27272A] rounded-full hover:bg-[#18181B] text-zinc-400 transition-colors flex items-center gap-2 px-6"
          >
            <Users className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">{members.length} Members</span>
          </button>
          {isAdminOrOwner && (
            <>
              <button 
                onClick={deleteProject}
                className="p-3.5 bg-[#0F0F11] border border-[#27272A] rounded-full hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/30 text-zinc-400 transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="bg-zinc-100 text-black px-8 py-3 rounded-full text-sm font-bold hover:bg-white transition-all shadow-lg ml-2"
              >
                + Add Task
              </button>
            </>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-2 bg-[#0F0F11] border border-[#27272A] rounded-2xl mb-12">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
          <input 
            type="text"
            placeholder="Search objectives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-white pl-12 pr-4 py-3 text-sm placeholder:text-zinc-700"
          />
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-zinc-900/50">
          {(['all', 'high', 'medium', 'low'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={cn(
                "px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                priorityFilter === p 
                  ? "bg-zinc-100 text-black shadow-lg" 
                  : "text-zinc-600 hover:text-zinc-400"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {(['todo', 'in-progress', 'completed'] as TaskStatus[]).map((status) => (
          <div key={status} className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  {status.replace('-', ' ')}
                </h3>
                <span className="ml-4 text-[10px] font-bold text-zinc-700 bg-zinc-900/50 px-2 py-0.5 rounded-md">
                  {groupedTasks[status].length}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <AnimatePresence mode="popLayout">
                {groupedTasks[status].map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group bg-[#0F0F11] p-6 rounded-xl border border-[#27272A] transition-hover hover:border-[#3F3F46] cursor-default"
                  >
                    <div className="flex items-start justify-between mb-5">
                      <span className={cn(
                        "role-badge text-[8px]",
                        task.priority === 'high' ? "text-red-400 border-red-900/30 bg-red-950/20" :
                        task.priority === 'medium' ? "text-amber-400 border-amber-900/30 bg-amber-950/20" :
                        "text-emerald-400 border-emerald-900/30 bg-emerald-950/20"
                      )}>
                        {task.priority}
                      </span>
                      <div className="flex items-center gap-1.5 grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                        {isAdminOrOwner && (
                          <button 
                            onClick={() => setEditingTask(task)} 
                            className="p-1 px-2 hover:bg-zinc-800 rounded text-zinc-400 flex items-center gap-1 transition-colors"
                            title="Edit Task"
                          >
                             <MoreVertical className="h-3 w-3" />
                          </button>
                        )}
                        
                        {status === 'todo' && (
                          <button 
                            onClick={() => updateTaskStatus(task.id, 'in-progress')} 
                            className="p-1 px-3 hover:bg-emerald-950/30 rounded text-emerald-500 transition-all active:scale-95"
                            title="Start Task"
                          >
                             <Play className="h-3 w-3 fill-current" />
                          </button>
                        )}

                        {status === 'in-progress' && (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => updateTaskStatus(task.id, 'completed')} 
                              className="p-1 px-3 hover:bg-white rounded text-black transition-all shadow-lg active:scale-95"
                              title="Finish Task"
                            >
                               <CheckCircle2 className="h-3 w-3" />
                            </button>
                            <button 
                              onClick={() => updateTaskStatus(task.id, 'todo')} 
                              className="p-1 px-2 hover:bg-zinc-800 rounded text-zinc-500 transition-all active:scale-95"
                              title="Revert to Todo"
                            >
                               <RotateCcw className="h-3 w-3" />
                            </button>
                          </div>
                        )}

                        {status === 'completed' && (
                          <button 
                            onClick={() => updateTaskStatus(task.id, 'in-progress')} 
                            className="p-1 px-3 hover:bg-zinc-800 rounded text-zinc-400 transition-all active:scale-95"
                            title="Reopen Task"
                          >
                             <RotateCcw className="h-3 w-3" />
                          </button>
                        )}

                        {isAdminOrOwner && (
                          <button 
                            onClick={() => deleteTask(task.id)} 
                            className="p-1 px-2 hover:bg-red-950/30 rounded text-red-500/50 hover:text-red-500 transition-all ml-1"
                            title="Delete Task"
                          >
                             <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <h4 className="text-sm font-medium text-zinc-100 leading-snug group-hover:text-white transition-colors">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-zinc-500 text-xs mt-3 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#18181B] text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                       <div className="flex items-center italic serif lowercase tracking-tight">
                         {task.dueDate?.seconds ? new Date(task.dueDate.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'flexible'}
                       </div>
                       <div className="flex items-center gap-2">
                         <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[7px] text-zinc-400 font-bold uppercase">
                           {task.assignedTo ? task.assignedTo.slice(0, 2) : '??'}
                         </div>
                         <span className="text-zinc-600 truncate max-w-[60px] lowercase italic serif">
                           {task.assignedTo ? 'assigned' : 'unassigned'}
                         </span>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {status === 'todo' && (
                <button 
                  onClick={() => setIsTaskModalOpen(true)}
                  className="w-full py-4 border border-dashed border-[#27272A] rounded-xl text-zinc-600 hover:text-zinc-300 hover:border-[#3F3F46] hover:bg-[#0F0F11] transition-all flex items-center justify-center font-bold text-[10px] uppercase tracking-widest"
                >
                  <Plus className="h-3 w-3 mr-2" />
                  New Task
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0F0F11] border border-[#27272A] rounded-2xl p-8 max-w-xl w-full shadow-2xl"
          >
            <h2 className="text-2xl font-light text-white serif mb-8 italic">New Operational Task</h2>
            {taskErrorMessage && (
              <div className="mb-6 p-4 bg-red-950/20 border border-red-900/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-200 leading-tight">{taskErrorMessage}</p>
              </div>
            )}
            <form onSubmit={handleCreateTask} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">Objective</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-3 bg-[#18181B] border border-[#27272A] rounded-lg focus:outline-none focus:border-[#3F3F46] text-white"
                  placeholder="Summarize the requirement..."
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">Priority Level</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                    className="w-full px-4 py-3 bg-[#18181B] border border-[#27272A] rounded-lg focus:outline-none focus:border-[#3F3F46] text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">Target Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-4 py-3 bg-[#18181B] border border-[#27272A] rounded-lg focus:outline-none focus:border-[#3F3F46] text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">Contextual Details</label>
                <textarea
                  rows={4}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-3 bg-[#18181B] border border-[#27272A] rounded-lg focus:outline-none focus:border-[#3F3F46] text-white resize-none"
                  placeholder="Provide detailed instructions for the assignee..."
                ></textarea>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="flex-1 px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className={cn(
                    "flex-1 px-4 py-3 text-xs font-bold uppercase tracking-widest text-black bg-white rounded-full transition-all",
                    isSubmittingTask ? "opacity-50 cursor-wait" : "hover:bg-zinc-200"
                  )}
                >
                  {isSubmittingTask ? "Releasing..." : "Release Task"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Member Management Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0F0F11] border border-[#27272A] rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-light text-white serif mb-8 italic">Team Composition</h2>
            
            <div className="space-y-6">
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-800 group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase">
                        {member.userId?.slice(0, 2) || 'M'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{member.userId === user?.uid ? 'You' : 'Member'}</div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500">{member.role}</div>
                      </div>
                    </div>
                    {project?.ownerId === user?.uid && member.userId !== user?.uid && (
                      <button 
                        onClick={() => handleRemoveMember(member.userId)}
                        className="p-2 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove Member"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">Invite by Email</label>
                    <input
                      type="email"
                      required
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-[#18181B] border border-[#27272A] rounded-lg focus:outline-none focus:border-[#3F3F46] text-white"
                      placeholder="colleague@company.com"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-3 text-xs font-bold uppercase tracking-widest text-black bg-white rounded-full hover:bg-zinc-200 transition-all"
                  >
                    Send Invitation
                  </button>
                </form>
              </div>

              <button
                onClick={() => setIsMemberModalOpen(false)}
                className="w-full px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0F0F11] border border-[#27272A] rounded-2xl p-8 max-w-xl w-full shadow-2xl"
          >
            <h2 className="text-2xl font-light text-white serif mb-8 italic">Adjust Objective</h2>
            <form onSubmit={handleEditTask} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">Objective</label>
                <input
                  type="text"
                  required
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full px-4 py-3 bg-[#18181B] border border-[#27272A] rounded-lg focus:outline-none focus:border-[#3F3F46] text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">Priority</label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as TaskPriority })}
                    className="w-full px-4 py-3 bg-[#18181B] border border-[#27272A] rounded-lg focus:outline-none focus:border-[#3F3F46] text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">Assign To</label>
                  <select
                    value={editingTask.assignedTo || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, assignedTo: e.target.value })}
                    className="w-full px-4 py-3 bg-[#18181B] border border-[#27272A] rounded-lg focus:outline-none focus:border-[#3F3F46] text-white"
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.id} value={m.userId}>{m.userId === user?.uid ? 'Myself' : `Member (${m.userId.slice(0,5)})`}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">Contextual Details</label>
                <textarea
                  rows={4}
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full px-4 py-3 bg-[#18181B] border border-[#27272A] rounded-lg focus:outline-none focus:border-[#3F3F46] text-white resize-none"
                ></textarea>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="flex-1 px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 text-xs font-bold uppercase tracking-widest text-black bg-white rounded-full hover:bg-zinc-200 transition-all"
                >
                  Solidify Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

