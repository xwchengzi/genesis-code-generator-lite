
import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Home, BookOpen, Search } from 'lucide-react';

const UserLayout: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Calculate remaining days
  const calculateRemainingDays = () => {
    if (!profile?.access_expiry_date) return 0;
    
    const expiryDate = new Date(profile.access_expiry_date);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const remainingDays = calculateRemainingDays();
  const isExpired = remainingDays <= 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="text-2xl font-bold text-blue-600">显然考研</Link>
          
          <div className="flex items-center gap-4">
            {profile && (
              <div className="text-sm">
                <span className="font-medium">{profile.username}</span>
                {isExpired ? (
                  <span className="ml-2 text-red-600 font-medium">已过期</span>
                ) : (
                  <span className="ml-2 text-green-600 font-medium">剩余 {remainingDays} 天</span>
                )}
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
              to="/dashboard" 
              className={({ isActive }) => 
                `flex items-center gap-2 p-2 rounded-md ${isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`
              }
              end
            >
              <Home size={18} />
              首页
            </NavLink>
            <NavLink 
              to="/courses" 
              className={({ isActive }) => 
                `flex items-center gap-2 p-2 rounded-md ${isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`
              }
            >
              <BookOpen size={18} />
              课程
            </NavLink>
            <NavLink 
              to="/search" 
              className={({ isActive }) => 
                `flex items-center gap-2 p-2 rounded-md ${isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`
              }
            >
              <Search size={18} />
              搜索
            </NavLink>
            <NavLink 
              to="/profile" 
              className={({ isActive }) => 
                `flex items-center gap-2 p-2 rounded-md ${isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`
              }
            >
              <User size={18} />
              个人信息
            </NavLink>
          </nav>
        </aside>
        
        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
          <div className="flex justify-around">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => 
                `flex flex-col items-center py-2 px-4 ${isActive ? 'text-blue-700' : 'text-gray-600'}`
              }
              end
            >
              <Home size={20} />
              <span className="text-xs mt-1">首页</span>
            </NavLink>
            <NavLink 
              to="/courses" 
              className={({ isActive }) => 
                `flex flex-col items-center py-2 px-4 ${isActive ? 'text-blue-700' : 'text-gray-600'}`
              }
            >
              <BookOpen size={20} />
              <span className="text-xs mt-1">课程</span>
            </NavLink>
            <NavLink 
              to="/search" 
              className={({ isActive }) => 
                `flex flex-col items-center py-2 px-4 ${isActive ? 'text-blue-700' : 'text-gray-600'}`
              }
            >
              <Search size={20} />
              <span className="text-xs mt-1">搜索</span>
            </NavLink>
            <NavLink 
              to="/profile" 
              className={({ isActive }) => 
                `flex flex-col items-center py-2 px-4 ${isActive ? 'text-blue-700' : 'text-gray-600'}`
              }
            >
              <User size={20} />
              <span className="text-xs mt-1">我的</span>
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

export default UserLayout;
