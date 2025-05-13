
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Book, User, Video } from 'lucide-react';

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    userCount: 0,
    adminCount: 0,
    expiredUserCount: 0,
    subjectCount: 0,
    courseCount: 0,
    chapterCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setIsLoading(true);
      try {
        // Count users by type
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('user_type, access_expiry_date');
        
        if (userError) throw userError;
        
        const now = new Date();
        const users = userData || [];
        const userCount = users.filter(u => u.user_type === 'user').length;
        const adminCount = users.filter(u => u.user_type === 'admin').length;
        const expiredUserCount = users.filter(u => 
          u.user_type === 'user' && new Date(u.access_expiry_date) < now
        ).length;
        
        // Count subjects
        const { count: subjectCount, error: subjectError } = await supabase
          .from('subjects')
          .select('*', { count: 'exact', head: true });
        
        if (subjectError) throw subjectError;
        
        // Count courses
        const { count: courseCount, error: courseError } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true });
        
        if (courseError) throw courseError;
        
        // Count chapters
        const { count: chapterCount, error: chapterError } = await supabase
          .from('chapters')
          .select('*', { count: 'exact', head: true });
        
        if (chapterError) throw chapterError;
        
        setStats({
          userCount,
          adminCount,
          expiredUserCount,
          subjectCount: subjectCount || 0,
          courseCount: courseCount || 0,
          chapterCount: chapterCount || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">管理员控制台</h1>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">用户数量</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.userCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  其中 {stats.expiredUserCount} 个已过期
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">管理员数量</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.adminCount}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">科目数量</CardTitle>
                <Book className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.subjectCount}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">课程数量</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.courseCount}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">章节数量</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.chapterCount}</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Actions */}
          <h2 className="text-xl font-semibold mt-8 mb-4">快捷操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>用户管理</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-500 mb-4">
                  管理用户账户、重置密码、调整有效期
                </p>
                <Button asChild>
                  <Link to="/admin/users" className="flex items-center">
                    进入 <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>科目管理</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-500 mb-4">
                  添加、编辑或删除科目
                </p>
                <Button asChild>
                  <Link to="/admin/subjects" className="flex items-center">
                    进入 <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>课程管理</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-500 mb-4">
                  添加、编辑或删除课程内容
                </p>
                <Button asChild>
                  <Link to="/admin/courses" className="flex items-center">
                    进入 <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>章节管理</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-500 mb-4">
                  管理章节内容和视频
                </p>
                <Button asChild>
                  <Link to="/admin/chapters" className="flex items-center">
                    进入 <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
