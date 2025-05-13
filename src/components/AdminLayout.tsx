
import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Users, Book, BookOpen, LayoutDashboard, Video } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/admin" className="text-2xl font-bold text-blue-600">
            显然考研 <span className="text-gray-500 text-sm ml-2">管理后台</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {profile && (
              <div className="text-sm">
                <span className="font-medium">{profile.username}</span>
                <span className="ml-2 text-purple-600 font-medium">管理员</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut size={18} className="mr-2" />
              退出
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-50 border-r border-gray-200 hidden md:block">
          <nav className="p-4 space-y-2">
            <NavLink 
              to="/admin" 
              className={({ isActive }) => 
                `flex items-center gap-2 p-2 rounded-md ${isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`
              }
              end
            >
              <LayoutDashboard size={18} />
              控制台
            </NavLink>
            <NavLink 
              to="/admin/users" 
              className={({ isActive }) => 
                `flex items-center gap-2 p-2 rounded-md ${isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`
              }
            >
              <Users size={18} />
              用户管理
            </NavLink>
            <NavLink 
              to="/admin/subjects" 
              className={({ isActive }) => 
                `flex items-center gap-2 p-2 rounded-md ${isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`
              }
            >
              <Book size={18} />
              科目管理
            </NavLink>
            <NavLink 
              to="/admin/courses" 
              className={({ isActive }) => 
                `flex items-center gap-2 p-2 rounded-md ${isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`
              }
            >
              <BookOpen size={18} />
              课程管理
            </NavLink>
            <NavLink 
              to="/admin/chapters" 
              className={({ isActive }) => 
                `flex items-center gap-2 p-2 rounded-md ${isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`
              }
            >
              <Video size={18} />
              章节管理
            </NavLink>
          </nav>
        </aside>
        
        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
          <div className="flex justify-around">
            <NavLink 
              to="/admin" 
              className={({ isActive }) => 
                `flex flex-col items-center py-2 px-4 ${isActive ? 'text-blue-700' : 'text-gray-600'}`
              }
              end
            >
              <LayoutDashboard size={20} />
              <span className="text-xs mt-1">控制台</span>
            </NavLink>
            <NavLink 
              to="/admin/users" 
              className={({ isActive }) => 
                `flex flex-col items-center py-2 px-4 ${isActive ? 'text-blue-700' : 'text-gray-600'}`
              }
            >
              <Users size={20} />
              <span className="text-xs mt-1">用户</span>
            </NavLink>
            <NavLink 
              to="/admin/subjects" 
              className={({ isActive }) => 
                `flex flex-col items-center py-2 px-4 ${isActive ? 'text-blue-700' : 'text-gray-600'}`
              }
            >
              <Book size={20} />
              <span className="text-xs mt-1">科目</span>
            </NavLink>
            <NavLink 
              to="/admin/courses" 
              className={({ isActive }) => 
                `flex flex-col items-center py-2 px-4 ${isActive ? 'text-blue-700' : 'text-gray-600'}`
              }
            >
              <BookOpen size={20} />
              <span className="text-xs mt-1">课程</span>
            </NavLink>
          </div>
        </div>
        
        {/* Content Area */}
        <main className="flex-1 p-4 pb-16 md:pb-4 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
