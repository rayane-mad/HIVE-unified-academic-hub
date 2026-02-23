import { useState, useEffect } from 'react';
import { Search, Filter, AlertCircle, Calendar, FileText } from 'lucide-react';
import { TaskCard } from './TaskCard';

interface DashboardProps {
  onSelectAssignment: (assignment: any) => void;
}

export function Dashboard({ onSelectAssignment }: DashboardProps) {
  // 1. Change mockTasks to state
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // 2. Fetch data from Backend
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const token = localStorage.getItem('token'); // <--- Retrieve token stored during Login

        if (!token) {
          console.error("No token found, user might not be logged in.");
          setLoading(false);
          return;
        }

        const response = await fetch('/api/integration/feed', {
          headers: {
            'Authorization': `Bearer ${token}` // <--- CRITICAL: Send token to backend
          }
        });

        if (response.status === 401 || response.status === 403) {
          // Token expired or invalid
          console.error("Session expired or invalid token");
          // Ideally, redirect to login here (e.g., window.location.reload())
          return;
        }

        const data = await response.json();

        if (data.success) {
          // Normalize backend data to frontend format
          const formattedTasks = data.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            course: item.course,
            course_id: item.course_id,  // Add course_id for assignment submission
            type: item.type,
            priority: item.priority.toLowerCase(), // Backend sends "High", frontend expects "high"
            dueDate: item.due_date || item.start_time,
            description: item.description,
            hasFiles: false,
            status: item.status
          }));
          setTasks(formattedTasks);
        }
      } catch (error) {
        console.error("Failed to fetch feed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  // Filter logic 
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = (task.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.course || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || task.type === filterType;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesSearch && matchesType && matchesPriority;
  });

  const highPriorityTasks = filteredTasks.filter(t => t.priority === 'high');
  const mediumPriorityTasks = filteredTasks.filter(t => t.priority === 'medium');
  const lowPriorityTasks = filteredTasks.filter(t => t.priority === 'low');

  if (loading) return <div className="p-10 text-center">Loading your Hive...</div>;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
        <h2 className="mb-2">Welcome back! 👋</h2>
        <p>You have {highPriorityTasks.length} high priority items and {filteredTasks.filter(t => t.type === 'event').length} upcoming events</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tasks, events, or courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter size={20} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Types</option>
                <option value="assignment">Assignments</option>
                <option value="event">Events</option>
                <option value="announcement">Announcements</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* High Priority Section */}
      {highPriorityTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="text-red-500" size={24} />
            <h3 className="text-red-600">High Priority</h3>
          </div>
          <div className="space-y-3">
            {highPriorityTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onSelectAssignment(task)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Medium Priority Section */}
      {mediumPriorityTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-amber-500" size={24} />
            <h3 className="text-amber-600">Medium Priority</h3>
          </div>
          <div className="space-y-3">
            {mediumPriorityTasks.map(task => (
              <TaskCard key={task.id} task={task} onClick={() => onSelectAssignment(task)} />
            ))}
          </div>
        </div>
      )}

      {/* Low Priority Section */}
      {lowPriorityTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="text-gray-500" size={24} />
            <h3 className="text-gray-600">Low Priority</h3>
          </div>
          <div className="space-y-3">
            {lowPriorityTasks.map(task => (
              <TaskCard key={task.id} task={task} onClick={() => onSelectAssignment(task)} />
            ))}
          </div>
        </div>
      )}

      {filteredTasks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No tasks found matching your filters</p>
        </div>
      )}
    </div>
  );
}