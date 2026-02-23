import { useState, useEffect } from 'react';
import { Award, Calendar, CheckCircle, TrendingUp, BookOpen } from 'lucide-react';

// Mock data removed.
// Achievements will be implemented in future.
// Recent activity is fetched from feed.

export function Profile() {
  const [user, setUser] = useState({ display_name: 'Loading...', email: '...', major: 'Undeclared', year: 'Student', gpa: '...' });
  const [stats, setStats] = useState({ completed: 0, upcoming: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Fetch Profile
        const profileRes = await fetch('/api/users/profile', { headers });
        const profileData = await profileRes.json();
        if (profileData.success) {
          setUser({
            display_name: profileData.user.display_name || 'Student',
            email: profileData.user.email,
            major: profileData.user.major || 'Undeclared',
            year: profileData.user.year || 'Student',
            gpa: profileData.user.gpa || 'N/A'
          });
        }

        // 2. Fetch Feed for Stats
        const feedRes = await fetch('/api/integration/feed', { headers });
        const feedData = await feedRes.json();
        if (feedData.success) {
          const items = feedData.data;

          // Calculate Stats
          const completed = items.filter((i: any) => i.status === 'submitted').length;
          const upcoming = items.length - completed;
          setStats({ completed, upcoming });

          // Get Real Recent Activity (Completed items sorted by date)
          const activity = items
            .filter((i: any) => i.status === 'submitted') // Take submitted items
            .sort((a: any, b: any) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime()) // Newest first
            .slice(0, 5) // Last 5
            .map((i: any) => ({
              id: i.id,
              action: 'Submitted',
              course: i.course,
              item: i.title,
              time: new Date(i.due_date).toLocaleDateString()
            }));
          setRecentActivity(activity);
        }

      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white">
            <span className="text-4xl text-white font-bold">
              {user.display_name !== 'Loading...' ? user.display_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '👤'}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-gray-900 mb-1">{user.display_name}</h2>
            <p className="text-gray-600 mb-4">{user.email}</p>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg">
                  <p className="text-gray-600">Year</p>
                  <p>{user.year}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg">
                  <p className="text-gray-600">Major</p>
                  <p>{user.major}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg">
                  <p className="text-gray-600">GPA</p>
                  <p>{user.gpa}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600">Completed</p>
              <h3 className="text-gray-900">{stats.completed}</h3>
            </div>
          </div>
          <p className="text-gray-500">Assignments this semester</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Calendar className="text-amber-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600">Upcoming</p>
              <h3 className="text-gray-900">{stats.upcoming}</h3>
            </div>
          </div>
          <p className="text-gray-500">Events & Assignments</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600">On-Time Rate</p>
              <h3 className="text-gray-900">100%</h3>
            </div>
          </div>
          <p className="text-gray-500">Submission punctuality</p>
        </div>
      </div>

      {/* Achievements Section - HIDDEN until implemented */
      /* <div className="bg-white rounded-xl shadow-sm p-6"> ... </div> */}

      {/* Recent Activity Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="text-amber-600" size={24} />
          <h3 className="text-gray-900">Recent Activity</h3>
        </div>
        <div className="space-y-4">
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent activity found.</p>
          ) : (
            recentActivity.map((activity, index) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={20} />
                </div>
                <div className="flex-1 pb-4 border-b border-gray-100 last:border-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-900">{activity.action}</p>
                      <p className="text-gray-600">{activity.item}</p>
                      <p className="text-gray-500">{activity.course}</p>
                    </div>
                    <span className="text-gray-500">{activity.time}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
