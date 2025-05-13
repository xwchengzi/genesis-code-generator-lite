import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Course, Subject } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/use-toast';
import { Edit, Plus, Search, Trash, ListFilter } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const CourseManagementPage: React.FC = () => {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectMap, setSubjectMap] = useState<{[key: number]: string}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const itemsPerPage = 10;
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  // Form states
  const [addFormData, setAddFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
    keywords: '',
  });
  
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
    keywords: '',
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [currentPage, subjectFilter]);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setSubjects(data || []);
      
      // Create a map of subject IDs to names for easy lookup
      const map: {[key: number]: string} = {};
      data?.forEach(subject => {
        map[subject.id] = subject.name;
      });
      setSubjectMap(map);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast({
        title: '获取科目失败',
        description: '加载科目数据时出错',
        variant: 'destructive',
      });
    }
  };

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('courses')
        .select('*')
        .order('title');
      
      if (subjectFilter !== 'all') {
        query = query.eq('subject_id', parseInt(subjectFilter));
      }
      
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,keywords.ilike.%${searchTerm}%`);
      }
      
      // Get total count first
      const { count } = await query.select('id', { count: 'exact' });
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
      
      // Then get paginated results
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data, error } = await query
        .range(from, to);
      
      if (error) throw error;
      
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: '获取课程失败',
        description: '加载课程数据时出错',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCourses();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const handleAddCourse = async () => {
    if (!addFormData.subject_id) {
      toast({
        title: '请选择科目',
        description: '课程必须属于一个科目',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .insert({
          title: addFormData.title,
          description: addFormData.description || null,
          subject_id: parseInt(addFormData.subject_id),
          keywords: addFormData.keywords || null,
          created_by_admin_id: profile?.id,
        });
      
      if (error) throw error;
      
      toast({
        title: '添加成功',
        description: `课程 "${addFormData.title}" 已成功添加`,
      });
      
      setIsAddDialogOpen(false);
      setAddFormData({
        title: '',
        description: '',
        subject_id: '',
        keywords: '',
      });
      
      fetchCourses();
    } catch (error: any) {
      toast({
        title: '添加失败',
        description: error.message || '添加课程时出错',
        variant: 'destructive',
      });
    }
  };

  const handleEditCourse = async () => {
    if (!selectedCourse || !editFormData.subject_id) return;
    
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          title: editFormData.title,
          description: editFormData.description || null,
          subject_id: parseInt(editFormData.subject_id),
          keywords: editFormData.keywords || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedCourse.id);
      
      if (error) throw error;
      
      toast({
        title: '更新成功',
        description: `课程 "${editFormData.title}" 已更新`,
      });
      
      setIsEditDialogOpen(false);
      fetchCourses();
    } catch (error: any) {
      toast({
        title: '更新失败',
        description: error.message || '更新课程时出错',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    
    try {
      // Check if there are chapters associated with this course
      const { count, error: countError } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', selectedCourse.id);
      
      if (countError) throw countError;
      
      if (count && count > 0) {
        toast({
          title: '无法删除',
          description: `课程 "${selectedCourse.title}" 下有 ${count} 个章节，请先删除这些章节`,
          variant: 'destructive',
        });
        setIsDeleteDialogOpen(false);
        return;
      }
      
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', selectedCourse.id);
      
      if (error) throw error;
      
      toast({
        title: '删除成功',
        description: `课程 "${selectedCourse.title}" 已被删除`,
      });
      
      setIsDeleteDialogOpen(false);
      fetchCourses();
    } catch (error: any) {
      toast({
        title: '删除失败',
        description: error.message || '删除课程时出错',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (course: Course) => {
    setSelectedCourse(course);
    setEditFormData({
      title: course.title,
      description: course.description || '',
      subject_id: course.subject_id.toString(),
      keywords: course.keywords || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (course: Course) => {
    setSelectedCourse(course);
    setIsDeleteDialogOpen(true);
  };

  // Fix the Pagination rendering
  const renderPagination = () => {
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => setCurrentPage(page)}
                isActive={page === currentPage}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">课程管理</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          添加课程
        </Button>
      </div>
      
      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex w-full sm:w-auto gap-2">
          <Input
            placeholder="搜索课程标题、描述或关键词..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm: w-64"
          />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-gray-500" />
          <Select
            value={subjectFilter}
            onValueChange={(value) => {
              setSubjectFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="筛选科目" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部科目</SelectItem>
              {subjects.map(subject => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Courses Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>科目</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>关键词</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>{course.id}</TableCell>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell>{subjectMap[course.subject_id] || course.subject_id}</TableCell>
                      <TableCell className="max-w-xs truncate">{course.description || '-'}</TableCell>
                      <TableCell>{course.keywords || '-'}</TableCell>
                      <TableCell>{formatDate(course.created_at)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(course)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(course)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      未找到课程
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-2 border-t">
              {renderPagination()}
            </div>
          )}
        </div>
      )}
      
      {/* Add Course Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>添加新课程</DialogTitle>
            <DialogDescription>
              填写以下信息创建新课程
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="add_subject_id" className="text-right text-sm font-medium">
                所属科目 *
              </label>
              <Select
                value={addFormData.subject_id}
                onValueChange={(value) => setAddFormData({ ...addFormData, subject_id: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择科目" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="add_title" className="text-right text-sm font-medium">
                标题 *
              </label>
              <Input
                id="add_title"
                value={addFormData.title}
                onChange={(e) => setAddFormData({ ...addFormData, title: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="add_description" className="text-right text-sm font-medium">
                描述
              </label>
              <Textarea
                id="add_description"
                value={addFormData.description}
                onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                className="col-span-3"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="add_keywords" className="text-right text-sm font-medium">
                关键词
              </label>
              <Input
                id="add_keywords"
                placeholder="用英文逗号分隔, 例如: 考研,数学,基础"
                value={addFormData.keywords}
                onChange={(e) => setAddFormData({ ...addFormData, keywords: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleAddCourse} 
              disabled={!addFormData.title || !addFormData.subject_id}
            >
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Course Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>编辑课程</DialogTitle>
            <DialogDescription>
              修改课程信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_subject_id" className="text-right text-sm font-medium">
                所属科目 *
              </label>
              <Select
                value={editFormData.subject_id}
                onValueChange={(value) => setEditFormData({ ...editFormData, subject_id: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择科目" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_title" className="text-right text-sm font-medium">
                标题 *
              </label>
              <Input
                id="edit_title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_description" className="text-right text-sm font-medium">
                描述
              </label>
              <Textarea
                id="edit_description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="col-span-3"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_keywords" className="text-right text-sm font-medium">
                关键词
              </label>
              <Input
                id="edit_keywords"
                placeholder="用英文逗号分隔, 例如: 考研,数学,基础"
                value={editFormData.keywords}
                onChange={(e) => setEditFormData({ ...editFormData, keywords: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleEditCourse} 
              disabled={!editFormData.title || !editFormData.subject_id}
            >
              保存更改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Course Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>删除课程</DialogTitle>
            <DialogDescription>
              您确定要删除课程 "{selectedCourse?.title}" 吗？如果此课程下有章节，则无法删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteCourse}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseManagementPage;
