
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Subject, Course, ChapterProgress } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ArrowRight, Calendar, Clock } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const [recentSubjects, setRecentSubjects] = useState<Subject[]>([]);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<ChapterProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch recent subjects
        const { data: subjects } = await supabase
          .from('subjects')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (subjects) {
          setRecentSubjects(subjects);
        }
        
        // Fetch recent courses
        const { data: courses } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(4);
        
        if (courses) {
          setRecentCourses(courses);
        }
        
        // Fetch user progress
        if (profile) {
          const { data: userProgress } = await supabase
            .from('user_chapter_progress')
            .select('*')
            .eq('user_id', profile.id)
            .order('watched_at', { ascending: false })
            .limit(5);
          
          if (userProgress) {
            setProgress(userProgress);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [profile]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };
  
  // Calculate access status
  const isExpired = profile ? new Date(profile.access_expiry_date) < new Date() : false;
  const daysLeft = profile ? Math.max(0, Math.ceil((new Date(profile.access_expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-bold">欢迎回来，{profile?.username}</h1>
        <div className="flex items-center mt-2 sm:mt-0 space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-600">
            {isExpired ? (
              <span className="text-red-600 font-medium">账户已过期</span>
            ) : (
              <span>
                访问期限: <span className="font-medium text-green-600">还剩 {daysLeft} 天</span>
              </span>
            )}
          </span>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Account status card */}
          <Card className={isExpired ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}>
            <CardHeader>
              <CardTitle className={isExpired ? "text-red-700" : "text-green-700"}>
                {isExpired ? "账户状态: 已过期" : "账户状态: 有效"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {isExpired ? (
                  "您的账户已过期，无法观看视频课程。请联系管理员延长有效期。"
                ) : (
                  `您的账户有效期至 ${formatDate(profile?.access_expiry_date || '')}`
                )}
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant={isExpired ? "destructive" : "default"}>
                <Link to="/profile">查看账户详情</Link>
              </Button>
            </CardFooter>
          </Card>
          
          {/* Recent Subjects */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">最新科目</h2>
              <Button variant="link" asChild>
                <Link to="/courses" className="flex items-center">
                  查看全部 <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentSubjects.map((subject) => (
                <Card key={subject.id}>
                  <CardHeader>
                    <CardTitle>{subject.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 line-clamp-2">{subject.description || "暂无描述"}</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline">
                      <Link to={`/courses?subject=${subject.id}`}>查看课程</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              {recentSubjects.length === 0 && (
                <Card className="col-span-3">
                  <CardContent className="flex items-center justify-center py-8">
                    <p className="text-gray-500">暂无科目</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          
          {/* Recent Courses */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">最新课程</h2>
              <Button variant="link" asChild>
                <Link to="/courses" className="flex items-center">
                  查看全部 <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentCourses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>科目ID: {course.subject_id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 line-clamp-2">{course.description || "暂无描述"}</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild>
                      <Link to={`/courses/${course.id}`}>立即学习</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              {recentCourses.length === 0 && (
                <Card className="col-span-2">
                  <CardContent className="flex items-center justify-center py-8">
                    <p className="text-gray-500">暂无课程</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          
          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">最近学习记录</h2>
            </div>
            <Card>
              <CardContent className="p-0">
                {progress.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {progress.map((item) => (
                      <li key={`${item.user_id}-${item.chapter_id}`} className="p-4 flex items-center">
                        <Clock className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium">观看了章节 #{item.chapter_id}</p>
                          <p className="text-sm text-gray-500">{formatDate(item.watched_at)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-gray-500">暂无学习记录</p>
                  </div>
                )}
              </CardContent>
              {progress.length > 0 && (
                <CardFooter className="border-t">
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/courses">继续学习</Link>
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
