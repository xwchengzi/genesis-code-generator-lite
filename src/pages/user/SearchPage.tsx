
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Course } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { BookOpen, Search as SearchIcon } from 'lucide-react';

const SearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,keywords.ilike.%${searchTerm}%`);
      
      if (error) throw error;
      
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching courses:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">搜索课程</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>关键词搜索</CardTitle>
          <CardDescription>
            搜索课程标题、描述或关键词
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSearch}>
          <CardContent>
            <div className="flex space-x-2">
              <Input
                placeholder="输入搜索关键词..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isSearching || !searchTerm.trim()}>
                {isSearching ? <Spinner size="sm" className="mr-2" /> : <SearchIcon className="mr-2 h-4 w-4" />}
                搜索
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
      
      {/* Search Results */}
      {hasSearched && (
        <div>
          <h2 className="text-xl font-semibold mb-4">搜索结果</h2>
          
          {isSearching ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((course) => (
                    <Card key={course.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <BookOpen className="mr-2 h-5 w-5 text-blue-500" />
                          {course.title}
                        </CardTitle>
                        <CardDescription>
                          科目 ID: {course.subject_id}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 line-clamp-2">
                          {course.description || "暂无描述"}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button asChild>
                          <Link to={`/courses/${course.id}`}>
                            查看课程
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-12 flex flex-col items-center justify-center">
                  <p className="text-gray-500 mb-2">未找到与 "{searchTerm}" 相关的课程</p>
                  <p className="text-sm text-gray-400">尝试其他关键词或浏览所有课程</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
