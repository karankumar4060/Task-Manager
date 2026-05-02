import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Task, Project } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { CheckCircle2, Clock, AlertCircle, Layers, LayoutDashboard, Briefcase, Users, Search, LayoutGrid } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectsCount, setProjectsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [workspaceTip, setWorkspaceTip] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Tip from API
    fetch('/api/workspace/tips')
      .then(res => res.json())
      .then(data => setWorkspaceTip(data.tip))
      .catch(err => console.error("API error:", err));
  }, []);

  useEffect(() => {
    if (!user) return;

    // In a real app, we'd query tasks across projects the user is a member of.
    // We use the 'members' array for secure listing.
    const projectsRef = collection(db, 'projects');
    const qProjects = query(projectsRef, where('members', 'array-contains', user.uid));
    
    const unsubscribeProjects = onSnapshot(qProjects, (snapshot) => {
      setProjectsCount(snapshot.size);
      
      const allTasks: Task[] = [];
      let projectsProcessed = 0;
      
      if (snapshot.empty) {
        setTasks([]);
        setLoading(false);
        return;
      }

      snapshot.docs.forEach(projectDoc => {
        const tasksRef = collection(db, 'projects', projectDoc.id, 'tasks');
        onSnapshot(tasksRef, (taskSnapshot) => {
          const projectTasks = taskSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task));
          
          setTasks(prev => {
            const filtered = prev.filter(t => t.projectId !== projectDoc.id);
            return [...filtered, ...projectTasks];
          });
          
          projectsProcessed++;
          if (projectsProcessed === snapshot.size) {
            setLoading(false);
          }
        }, (error) => {
          console.error("Task list error:", error);
          setLoading(false);
        });
      });
    }, (error) => {
      console.error("Project list error:", error);
      setLoading(false);
    });

    return () => unsubscribeProjects();
  }, [user]);

  const stats = [
    { name: 'Active Tasks', value: tasks.filter(t => t.status !== 'completed').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Overdue', value: tasks.filter(t => t.dueDate && new Date(t.dueDate.seconds * 1000) < new Date() && t.status !== 'completed').length, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { name: 'Total Projects', value: projectsCount, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const statusData = [
    { name: 'Todo', value: tasks.filter(t => t.status === 'todo').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length },
    { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length },
  ];

  const priorityData = [
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length, fill: '#E11D48' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, fill: '#F59E0B' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, fill: '#10B981' },
  ];

  const workloadData = tasks.reduce((acc: any[], task) => {
    const assignee = task.assignedTo || 'Unassigned';
    const existing = acc.find(item => item.name === assignee);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: assignee.length > 10 ? assignee.slice(0, 8) + '...' : assignee, value: 1 });
    }
    return acc;
  }, []).sort((a,b) => b.value - a.value).slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-zinc-800 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-zinc-800 rounded-2xl animate-pulse"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-light text-white serif italic">Executive Overview</h2>
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-zinc-500 text-sm">Monitoring {projectsCount} active projects across the workspace</p>
            {workspaceTip && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-500/80 bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10 w-fit"
              >
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                System Intelligence: {workspaceTip}
              </motion.div>
            )}
          </div>
        </div>
        <Link 
          to="/projects"
          className="bg-zinc-100 text-black px-8 py-3 rounded-full text-sm font-bold hover:bg-white transition-all shadow-lg"
        >
          + New Project
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#18181B] border border-[#27272A] rounded-xl p-6 transition-hover hover:border-[#3F3F46]"
          >
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-2">{stat.name}</span>
              <div className="flex items-center justify-between">
                <span className={cn("text-3xl font-semibold", stat.name === 'Overdue' && stat.value > 0 ? "text-red-400" : "text-white")}>
                  {stat.value}
                </span>
                <stat.icon className={cn("h-5 w-5 opacity-20", stat.color)} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0F0F11] border border-[#27272A] p-8 rounded-2xl"
        >
          <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-8 font-bold">Task Status Distribution</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181B" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 10 }} />
                <Tooltip 
                  cursor={{ fill: '#18181B' }}
                  contentStyle={{ backgroundColor: '#0F0F11', borderRadius: '8px', border: '1px solid #27272A', color: '#fff' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 2 ? '#10B981' : index === 1 ? '#6366F1' : '#3F3F46'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Priority Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0F0F11] border border-[#27272A] p-8 rounded-2xl"
        >
          <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-8 font-bold">Priority Breakdown</h3>
          <div className="h-[280px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F0F11', borderRadius: '8px', border: '1px solid #27272A', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-1/3 space-y-4 pr-4">
              {priorityData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: item.fill }}></div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-sans">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Workload Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0F0F11] border border-[#27272A] p-8 rounded-2xl"
        >
          <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-8 font-bold">Team Workload Distribution</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#18181B" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 10 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 10 }} width={80} />
                <Tooltip 
                  cursor={{ fill: '#18181B' }}
                  contentStyle={{ backgroundColor: '#0F0F11', borderRadius: '8px', border: '1px solid #27272A', color: '#fff' }}
                />
                <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Critical Tasks Table (Moved inside grid or kept below) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0F0F11] border border-[#27272A] rounded-2xl overflow-hidden"
        >
          <div className="px-8 py-5 border-b border-[#18181B] bg-zinc-900/30 flex justify-between items-center">
            <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Priority Pipeline</h3>
            <Link to="/projects" className="text-[10px] uppercase font-bold text-zinc-400 hover:text-white transition-colors">Workspace →</Link>
          </div>
          <div className="max-h-[280px] overflow-y-auto">
             <table className="w-full text-left border-collapse">
               <tbody className="divide-y divide-[#18181B]">
                 {tasks.filter(t => t.priority === 'high').slice(0, 5).map((task) => (
                   <tr key={task.id} className="hover:bg-[#18181B] transition-all cursor-pointer" onClick={() => navigate(`/projects/${task.projectId}`)}>
                     <td className="px-8 py-4">
                       <p className="text-[11px] font-medium text-zinc-100">{task.title}</p>
                       <p className="text-[8px] text-zinc-600 uppercase tracking-tighter mt-1">{task.status}</p>
                     </td>
                     <td className="px-8 py-4 text-right">
                       <span className="text-[8px] text-zinc-500 italic serif">{task.dueDate?.seconds ? new Date(task.dueDate.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </motion.div>
      </div>

      {/* Full Critical Tasks Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0F0F11] border border-[#27272A] rounded-2xl overflow-hidden"
      >
        <div className="px-8 py-5 border-b border-[#18181B] bg-zinc-900/30 flex justify-between items-center">
          <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Critical Tasks</h3>
          <Link to="/projects" className="text-[10px] uppercase font-bold text-zinc-400 hover:text-white transition-colors">See all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/50">
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Task Description</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Assignee</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Priority</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#18181B]">
              {tasks.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)).slice(0, 8).map((task) => (
                <tr 
                  key={task.id} 
                  className="hover:bg-[#18181B] transition-all group cursor-pointer"
                  onClick={() => navigate(`/projects/${task.projectId}`)}
                >
                  <td className="px-8 py-5">
                    <p className="text-sm font-medium text-zinc-100 group-hover:text-white">{task.title}</p>
                    <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-tight font-bold">Project ID: {task.projectId.slice(0, 8)}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-zinc-800 text-[8px] flex items-center justify-center border border-zinc-700">?</div>
                      <span className="text-xs text-zinc-400">Team</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "role-badge text-[8px]",
                      task.priority === 'high' ? "text-red-400 border-red-900/30 bg-red-950/20" :
                      task.priority === 'medium' ? "text-amber-400 border-amber-900/30 bg-amber-950/20" :
                      "text-emerald-400 border-emerald-900/30 bg-emerald-950/20"
                    )}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right text-zinc-400 text-xs italic serif">
                    {task.dueDate?.seconds ? new Date(task.dueDate.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Flexible'}
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center text-zinc-600 serif italic">
                    No active tasks monitored at this time.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
