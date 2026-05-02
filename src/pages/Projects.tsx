import React, { useEffect, useState } from 'react';
import { collection, query, addDoc, onSnapshot, serverTimestamp, doc, setDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Project, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { Plus, Briefcase, ChevronRight, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    // Fetch only projects where the user is a member/owner
    const q = query(collection(db, 'projects'), where('members', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
      setLoading(false);
    }, (error) => {
      console.error("Projects load error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProject.name) return;

    try {
      const projectRef = await addDoc(collection(db, 'projects'), {
        name: newProject.name,
        description: newProject.description,
        ownerId: user.uid,
        members: [user.uid], // Include members array for easy listing
        taskCount: 0,
        completedCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Add the creator as the Owner in the members subcollection
      await setDoc(doc(db, 'projects', projectRef.id, 'members', user.uid), {
        userId: user.uid,
        projectId: projectRef.id,
        role: 'Owner',
        joinedAt: serverTimestamp(),
      });

      setNewProject({ name: '', description: '' });
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'projects');
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-light text-white serif">Projects</h2>
          <p className="text-zinc-500 text-sm mt-2">Managing the collective creative and technical output</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-zinc-100 text-black px-8 py-3 rounded-full text-sm font-bold hover:bg-white transition-all shadow-lg"
        >
          + New Project
        </button>
      </header>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-zinc-500" />
        </div>
        <input
          type="text"
          placeholder="Filter workspace projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-12 pr-6 py-4 bg-[#0F0F11] border border-[#27272A] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#3F3F46] focus:ring-1 focus:ring-[#3F3F46] transition-all"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-56 bg-[#0F0F11] border border-[#27272A] rounded-2xl animate-pulse"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="group"
            >
              <Link to={`/projects/${project.id}`}>
                <div className="bg-[#18181B] p-8 rounded-2xl border border-[#27272A] transition-all duration-300 group-hover:border-[#3F3F46] hover:bg-[#1C1C1F] h-full flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                        <Briefcase className="h-5 w-5 text-zinc-100" />
                      </div>
                      <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Active</span>
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-100 group-hover:text-white transition-colors serif mb-3">
                      {project.name}
                    </h3>
                    <p className="text-zinc-500 text-sm line-clamp-2 leading-relaxed mb-4">
                      {project.description || 'System container for workspace tasks and project collaborative efforts.'}
                    </p>
                    {/* Progress Indicator */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between text-[8px] uppercase tracking-tighter text-zinc-600 mb-1.5 font-bold">
                        <span>Development Progress</span>
                        <span>
                          {project.taskCount && project.taskCount > 0 
                            ? Math.round((project.completedCount || 0) / project.taskCount * 100) 
                            : 0}%
                        </span>
                      </div>
                      <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-zinc-500 rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${project.taskCount && project.taskCount > 0 
                              ? (project.completedCount || 0) / project.taskCount * 100 
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-[#27272A]">
                    <div className="flex -space-x-1.5">
                       {[1, 2, 3].map(i => (
                         <div key={i} className="h-6 w-6 rounded-full border-2 border-[#18181B] bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-500">
                           {i === 3 ? '+4' : 'U'}
                         </div>
                       ))}
                    </div>
                    <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest group-hover:text-zinc-100 transition-colors">
                      Enter Space →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
          {filteredProjects.length === 0 && (
            <div className="col-span-full py-24 text-center">
              <div className="inline-block">
                <Briefcase className="h-10 w-10 text-zinc-800 mx-auto mb-6 opacity-30" />
                <h3 className="text-xl font-medium text-zinc-400 serif">Workspace is quiet</h3>
                <p className="text-zinc-600 mt-2 text-sm">Initiate a new project to start collaborating.</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-8 text-xs font-bold uppercase tracking-widest text-zinc-100 border-b border-zinc-800 pb-1 hover:border-zinc-400 transition-all"
                >
                  Create Project
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0F0F11] border border-[#27272A] rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-light text-white serif mb-8 italic">New Project Initiative</h2>
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">Project Identity</label>
                <input
                  type="text"
                  required
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#18181B] border border-[#27272A] rounded-lg focus:outline-none focus:border-[#3F3F46] text-white"
                  placeholder="e.g. Project Apollo"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">Technical Description</label>
                <textarea
                  rows={3}
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-4 py-3 bg-[#18181B] border border-[#27272A] rounded-lg focus:outline-none focus:border-[#3F3F46] text-white resize-none"
                  placeholder="Define the project scope..."
                ></textarea>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 text-xs font-bold uppercase tracking-widest text-black bg-white rounded-full hover:bg-zinc-200 transition-all"
                >
                  Create Project
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
