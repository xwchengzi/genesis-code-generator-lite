
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Subject, Course } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { BookOpen, ChevronRight } from 'lucide-react';

const CoursesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const subjectIdParam = searchParams.get('subject');
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('*')
          .order('name');
        
        if (error) throw error;
        
        setSubjects(data || []);
        
        // If a subject ID is provided in the URL, select that subject
        if (subjectIdParam && data) {
          const subject = data.find(s => s.id === parseInt(subjectIdParam));
          if (subject) {
            setSelectedSubject(subject);
          }
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    };
    
    fetchSubjects();
  }, [subjectIdParam]);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('courses')
          .select('*')
          .order('title');
        
        if (selectedSubject) {
          query = query.eq('subject_id', selectedSubject.id);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        setCourses(data || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourses();
  }, [selectedSubject]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">课程中心</h1>
      
      {/* Subjects List */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="p-4 flex items-center space-x-2">
          <Button
            variant={!selectedSubject ? "default" : "outline"}
            onClick={() => setSelectedSubject(null)}
            className="whitespace-nowrap"
          >
            全部科目
          </Button>
          
          {subjects.map((subject) => (
            <Button
              key={subject.id}
              variant={selectedSubject?.id === subject.id ? "default" : "outline"}
              onClick={() => setSelectedSubject(subject)}
              className="whitespace-nowrap"
            >
              {subject.name}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Courses Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {selectedSubject ? `${selectedSubject.name} 课程` : '全部课程'}
          </h2>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.length > 0 ? (
              courses.map((course) => (
                <Card key={course.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="mr-2 h-5 w-5 text-blue-500" />
                      {course.title}
                    </CardTitle>
                    <CardDescription>
                      科目 ID: {course.subject_id}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-gray-600 line-clamp-3">
                      {course.description || "暂无描述"}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild>
                      <Link to={`/courses/${course.id}`} className="flex items-center">
                        查看章节
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex items-center justify-center bg-gray-50 rounded-lg p-12">
                <p className="text-gray-500">
                  {selectedSubject ? `${selectedSubject.name} 暂无课程` : '暂无课程'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
