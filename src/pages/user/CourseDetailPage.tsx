
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Course, Chapter, ChapterProgress } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, ChevronLeft, ChevronRight, Play, Video } from 'lucide-react';

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile, hasValidAccess } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<Record<number, ChapterProgress>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', parseInt(id)) // Convert string to number
          .single();
        
        if (courseError) throw courseError;
        setCourse(courseData);
        
        // Fetch chapters
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('*')
          .eq('course_id', parseInt(id)) // Convert string to number
          .order('order_in_course');
        
        if (chaptersError) throw chaptersError;
        setChapters(chaptersData || []);
        
        // Fetch user progress if authenticated
        if (profile) {
          const { data: progressData, error: progressError } = await supabase
            .from('user_chapter_progress')
            .select('*')
            .eq('user_id', profile.id)
            .in('chapter_id', chaptersData?.map(c => c.id) || []);
          
          if (progressError) throw progressError;
          
          // Convert to a map for easier lookup
          const progressMap: Record<number, ChapterProgress> = {};
          progressData?.forEach(p => {
            progressMap[p.chapter_id] = p;
          });
          
          setProgress(progressMap);
        }
      } catch (error) {
        console.error('Error fetching course details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourseDetails();
  }, [id, profile]);

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/courses" className="flex items-center">
            <ChevronLeft className="mr-1 h-4 w-4" />
            返回课程列表
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {course ? (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold">{course.title}</h1>
                {course.description && (
                  <p className="mt-2 text-gray-600">{course.description}</p>
                )}
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <span>科目 ID: {course.subject_id}</span>
                  <span className="mx-2">·</span>
                  <span>{chapters.length} 个章节</span>
                </div>
              </div>
              
              {/* Chapters List */}
              <div>
                <h2 className="text-xl font-semibold mb-4">课程章节</h2>
                
                {chapters.length > 0 ? (
                  <div className="space-y-3">
                    {chapters.map((chapter) => {
                      const isWatched = !!progress[chapter.id];
                      
                      return (
                        <Card key={chapter.id} className="overflow-hidden">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                            <CardHeader className="pb-2 sm:pb-0">
                              <CardTitle className="flex items-center text-lg">
                                {isWatched && (
                                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                                )}
                                <span>章节 {chapter.order_in_course + 1}: {chapter.title}</span>
                              </CardTitle>
                              {chapter.description && (
                                <CardDescription>{chapter.description}</CardDescription>
                              )}
                            </CardHeader>
                            <CardContent className="pt-0 pb-4 sm:py-4 sm:pr-4">
                              <Button asChild size="sm" disabled={!hasValidAccess}>
                                <Link 
                                  to={`/courses/${course.id}/chapters/${chapter.id}`}
                                  className="flex items-center"
                                >
                                  {hasValidAccess ? (
                                    <>
                                      <Play className="mr-1 h-4 w-4" />
                                      观看视频
                                    </>
                                  ) : (
                                    <>
                                      <Video className="mr-1 h-4 w-4" />
                                      需要有效权限
                                    </>
                                  )}
                                </Link>
                              </Button>
                            </CardContent>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-12 flex items-center justify-center">
                    <p className="text-gray-500">暂无章节</p>
                  </div>
                )}
              </div>
              
              {/* Navigation buttons */}
              {chapters.length > 0 && (
                <div className="flex justify-between pt-4">
                  <Button asChild variant="outline">
                    <Link to="/courses">
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      返回课程列表
                    </Link>
                  </Button>
                  
                  <Button asChild disabled={!hasValidAccess}>
                    <Link to={`/courses/${course.id}/chapters/${chapters[0].id}`}>
                      开始学习
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 flex flex-col items-center justify-center">
              <p className="text-gray-500 mb-4">未找到课程</p>
              <Button asChild>
                <Link to="/courses">返回课程列表</Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CourseDetailPage;
