
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Chapter, Course, Subject } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/use-toast';
import { Edit, Plus, Search, Trash, ListFilter, MoveUp, MoveDown, Upload, Video } from 'lucide-react';
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

const ChapterManagementPage: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courseMap, setCourseMap] = useState<{[key: number]: string}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const itemsPerPage = 10;
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  
  // Form states
  const [addFormData, setAddFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    order_in_course: 0,
    video_storage_path: '',
  });
  
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    order_in_course: 0,
    video_storage_path: '',
  });
  
  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchSubjects();
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchChapters();
  }, [currentPage, courseFilter, subjectFilter]);

  // Filter courses when subject filter changes
  useEffect(() => {
    if (subjectFilter !== 'all') {
      setCourseFilter('all');
    }
  }, [subjectFilter]);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      let query = supabase
        .from('courses')
        .select('*')
        .order('title');
      
      if (subjectFilter !== 'all') {
        query = query.eq('subject_id', subjectFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setCourses(data || []);
      
      // Create a map of course IDs to titles for easy lookup
      const map: {[key: number]: string} = {};
      data?.forEach(course => {
        map[course.id] = course.title;
      });
      setCourseMap(map);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchChapters = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('chapters')
        .select('*');
      
      if (courseFilter !== 'all') {
        query = query.eq('course_id', courseFilter);
      } else if (subjectFilter !== 'all') {
        // If a subject is selected but no specific course, we need to get all courses in that subject
        const { data: coursesInSubject } = await supabase
          .from('courses')
          .select('id')
          .eq('subject_id', subjectFilter);
        
        if (coursesInSubject && coursesInSubject.length > 0) {
          const courseIds = coursesInSubject.map(c => c.id);
          query = query.in('course_id', courseIds);
        }
      }
      
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      // Get total count first
      const { count } = await query.select('id', { count: 'exact', head: true });
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
      
      // Then get paginated results
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data, error } = await query
        .range(from, to)
        .order('course_id')
        .order('order_in_course');
      
      if (error) throw error;
      
      setChapters(data || []);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      toast({
        title: '获取章节失败',
        description: '加载章节数据时出错',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchChapters();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check if file is a video
      if (!file.type.startsWith('video/')) {
        toast({
          title: '文件类型错误',
          description: '请选择视频文件',
          variant: 'destructive',
        });
        return;
      }
      
      setUploadFile(file);
    }
  };

  const handleUploadVideo = async () => {
    if (!uploadFile || !selectedChapter) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Create storage path for the video
      const fileExtension = uploadFile.name.split('.').pop();
      const timestamp = Date.now();
      const filePath = `chapter_${selectedChapter.id}_${timestamp}.${fileExtension}`;
      
      // Upload the video to Supabase Storage
      const { data, error } = await supabase.storage
        .from('course_videos')
        .upload(filePath, uploadFile, {
          cacheControl: '3600',
          upsert: true,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(percent);
          }
        });
      
      if (error) throw error;
      
      // Update the chapter with the new video path
      const { error: updateError } = await supabase
        .from('chapters')
        .update({ video_storage_path: filePath })
        .eq('id', selectedChapter.id);
      
      if (updateError) throw updateError;
      
      toast({
        title: '上传成功',
        description: '视频已成功上传并关联到章节',
      });
      
      setIsUploadDialogOpen(false);
      setUploadFile(null);
      fetchChapters();
    } catch (error: any) {
      toast({
        title: '上传失败',
        description: error.message || '上传视频时出错',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddChapter = async () => {
    if (!addFormData.course_id) {
      toast({
        title: '请选择课程',
        description: '章节必须属于一个课程',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Check for the last order in the course
      const { data: lastChapter, error: lastChapterError } = await supabase
        .from('chapters')
        .select('order_in_course')
        .eq('course_id', addFormData.course_id)
        .order('order_in_course', { ascending: false })
        .limit(1)
        .single();
      
      // Default order is 0, or last + 1 if exists
      const orderInCourse = lastChapter ? lastChapter.order_in_course + 1 : 0;
      
      const { error } = await supabase
        .from('chapters')
        .insert({
          title: addFormData.title,
          description: addFormData.description || null,
          course_id: parseInt(addFormData.course_id),
          order_in_course: orderInCourse,
          video_storage_path: addFormData.video_storage_path || 'placeholder.mp4', // Default placeholder
        });
      
      if (error) throw error;
      
      toast({
        title: '添加成功',
        description: `章节 "${addFormData.title}" 已成功添加`,
      });
      
      setIsAddDialogOpen(false);
      setAddFormData({
        title: '',
        description: '',
        course_id: '',
        order_in_course: 0,
        video_storage_path: '',
      });
      
      fetchChapters();
    } catch (error: any) {
      toast({
        title: '添加失败',
        description: error.message || '添加章节时出错',
        variant: 'destructive',
      });
    }
  };

  const handleEditChapter = async () => {
    if (!selectedChapter || !editFormData.course_id) return;
    
    try {
      const { error } = await supabase
        .from('chapters')
        .update({
          title: editFormData.title,
          description: editFormData.description || null,
          course_id: parseInt(editFormData.course_id),
          order_in_course: editFormData.order_in_course,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedChapter.id);
      
      if (error) throw error;
      
      toast({
        title: '更新成功',
        description: `章节 "${editFormData.title}" 已更新`,
      });
      
      setIsEditDialogOpen(false);
      fetchChapters();
    } catch (error: any) {
      toast({
        title: '更新失败',
        description: error.message || '更新章节时出错',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteChapter = async () => {
    if (!selectedChapter) return;
    
    try {
      // Delete the chapter
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', selectedChapter.id);
      
      if (error) throw error;
      
      // Delete the video from storage if it exists
      if (selectedChapter.video_storage_path && selectedChapter.video_storage_path !== 'placeholder.mp4') {
        await supabase.storage
          .from('course_videos')
          .remove([selectedChapter.video_storage_path]);
      }
      
      toast({
        title: '删除成功',
        description: `章节 "${selectedChapter.title}" 已被删除`,
      });
      
      setIsDeleteDialogOpen(false);
      fetchChapters();
    } catch (error: any) {
      toast({
        title: '删除失败',
        description: error.message || '删除章节时出错',
        variant: 'destructive',
      });
    }
  };

  const handleMoveChapter = async (chapter: Chapter, direction: 'up' | 'down') => {
    // Find all chapters in the same course
    const { data: chaptersInCourse, error: fetchError } = await supabase
      .from('chapters')
      .select('*')
      .eq('course_id', chapter.course_id)
      .order('order_in_course');
    
    if (fetchError) {
      toast({
        title: '移动失败',
        description: '获取章节顺序时出错',
        variant: 'destructive',
      });
      return;
    }
    
    if (!chaptersInCourse || chaptersInCourse.length <= 1) return;
    
    const chapterIndex = chaptersInCourse.findIndex(c => c.id === chapter.id);
    if (chapterIndex === -1) return;
    
    let swapIndex: number;
    if (direction === 'up') {
      if (chapterIndex === 0) return; // Already at the top
      swapIndex = chapterIndex - 1;
    } else {
      if (chapterIndex === chaptersInCourse.length - 1) return; // Already at the bottom
      swapIndex = chapterIndex + 1;
    }
    
    const swapChapter = chaptersInCourse[swapIndex];
    
    // Swap the order_in_course values
    const { error: updateError1 } = await supabase
      .from('chapters')
      .update({ order_in_course: swapChapter.order_in_course })
      .eq('id', chapter.id);
    
    const { error: updateError2 } = await supabase
      .from('chapters')
      .update({ order_in_course: chapter.order_in_course })
      .eq('id', swapChapter.id);
    
    if (updateError1 || updateError2) {
      toast({
        title: '移动失败',
        description: '更新章节顺序时出错',
        variant: 'destructive',
      });
      return;
    }
    
    fetchChapters();
  };

  const openEditDialog = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setEditFormData({
      title: chapter.title,
      description: chapter.description || '',
      course_id: chapter.course_id.toString(),
      order_in_course: chapter.order_in_course,
      video_storage_path: chapter.video_storage_path,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setIsDeleteDialogOpen(true);
  };

  const openUploadDialog = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setUploadFile(null);
    setIsUploadDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">章节管理</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          添加章节
        </Button>
      </div>
      
      {/* Search and filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <form onSubmit={handleSearch} className="flex w-full gap-2">
          <Input
            placeholder="搜索章节标题或描述..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
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
              setCourseFilter('all');
              setCurrentPage(1);
              fetchCourses();
            }}
          >
            <SelectTrigger className="w-full">
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
        
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-gray-500" />
          <Select
            value={courseFilter}
            onValueChange={(value) => {
              setCourseFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="筛选课程" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部课程</SelectItem>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Chapters Table */}
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
                  <TableHead>所属课程</TableHead>
                  <TableHead>顺序</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>视频</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chapters.length > 0 ? (
                  chapters.map((chapter) => (
                    <TableRow key={chapter.id}>
                      <TableCell>{chapter.id}</TableCell>
                      <TableCell className="font-medium">{chapter.title}</TableCell>
                      <TableCell>{courseMap[chapter.course_id] || chapter.course_id}</TableCell>
                      <TableCell>{chapter.order_in_course}</TableCell>
                      <TableCell className="max-w-xs truncate">{chapter.description || '-'}</TableCell>
                      <TableCell>
                        {chapter.video_storage_path === 'placeholder.mp4' ? (
                          <span className="text-red-500">未上传</span>
                        ) : (
                          <span className="text-green-500">已上传</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleMoveChapter(chapter, 'up')}
                          title="上移"
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleMoveChapter(chapter, 'down')}
                          title="下移"
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openUploadDialog(chapter)}
                          title="上传视频"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEditDialog(chapter)}
                          title="编辑"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => openDeleteDialog(chapter)}
                          title="删除"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      未找到章节
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-2 border-t">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
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
                      disabled={currentPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}
      
      {/* Add Chapter Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>添加新章节</DialogTitle>
            <DialogDescription>
              填写以下信息创建新章节
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="add_course_id" className="text-right text-sm font-medium">
                所属课程 *
              </label>
              <Select
                value={addFormData.course_id}
                onValueChange={(value) => setAddFormData({ ...addFormData, course_id: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择课程" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.title}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleAddChapter} 
              disabled={!addFormData.title || !addFormData.course_id}
            >
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Chapter Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>编辑章节</DialogTitle>
            <DialogDescription>
              修改章节信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_course_id" className="text-right text-sm font-medium">
                所属课程 *
              </label>
              <Select
                value={editFormData.course_id}
                onValueChange={(value) => setEditFormData({ ...editFormData, course_id: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择课程" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.title}
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
              <label htmlFor="edit_order" className="text-right text-sm font-medium">
                顺序
              </label>
              <Input
                id="edit_order"
                type="number"
                min="0"
                value={editFormData.order_in_course}
                onChange={(e) => setEditFormData({ ...editFormData, order_in_course: parseInt(e.target.value) || 0 })}
                className="col-span-3"
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleEditChapter} 
              disabled={!editFormData.title || !editFormData.course_id}
            >
              保存更改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Chapter Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>删除章节</DialogTitle>
            <DialogDescription>
              您确定要删除章节 "{selectedChapter?.title}" 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteChapter}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Upload Video Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>上传视频</DialogTitle>
            <DialogDescription>
              为章节 "{selectedChapter?.title}" 上传视频文件
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
              {uploadFile ? (
                <div className="text-center">
                  <Video className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-2 text-sm font-medium">{uploadFile.name}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setUploadFile(null)}
                  >
                    更换
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="mx-auto h-10 w-10 text-gray-400" />
                  <span className="mt-2 text-sm font-medium">点击选择视频文件</span>
                  <span className="mt-1 text-xs text-gray-500">支持 MP4, WebM 等格式</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="video/*"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
            
            {isUploading && (
              <div className="mt-2">
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-center text-sm text-gray-500">
                  {uploadProgress}% 上传中...
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} disabled={isUploading}>
              取消
            </Button>
            <Button 
              onClick={handleUploadVideo} 
              disabled={!uploadFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  上传中
                </>
              ) : '上传视频'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChapterManagementPage;
