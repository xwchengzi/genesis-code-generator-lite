
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Course, Chapter } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/use-toast';
import { Edit, Plus, Search, Trash, ArrowDown, ArrowUp, ArrowLeft } from 'lucide-react';
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";

const ChapterManagementPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  
  // Form and upload states
  const [addFormData, setAddFormData] = useState({
    title: '',
    description: '',
    order_in_course: 0,
  });
  
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    order_in_course: 0,
  });
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!courseId) {
      navigate('/admin/courses');
      return;
    }
    
    fetchCourseDetails();
  }, [courseId, navigate]);
  
  useEffect(() => {
    if (course) {
      fetchChapters();
    }
  }, [course, currentPage]);

  const fetchCourseDetails = async () => {
    if (!courseId) return;
    
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', parseInt(courseId))
        .single();
      
      if (error) throw error;
      setCourse(data);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast({
        title: '获取课程失败',
        description: '加载课程数据时出错',
        variant: 'destructive',
      });
      navigate('/admin/courses');
    }
  };

  const fetchChapters = async () => {
    if (!courseId) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('chapters')
        .select('*')
        .eq('course_id', parseInt(courseId))
        .order('order_in_course');
      
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      // Get total count first - FIX: Use correct count syntax
      const { count, error: countError } = await query.select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
      
      // Then get paginated results
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data, error } = await query
        .range(from, to);
      
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
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleAddChapter = async () => {
    if (!courseId || !videoFile) {
      toast({
        title: '请上传视频文件',
        description: '章节必须包含一个视频文件',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Upload video file first
      const videoFileName = `${Date.now()}_${videoFile.name.replace(/\s+/g, '_')}`;
      const videoStoragePath = `${courseId}/${videoFileName}`;
      
      // Create a custom upload handler to track progress
      const { error: uploadError } = await supabase.storage
        .from('course_videos')
        .upload(videoStoragePath, videoFile, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (uploadError) throw uploadError;
      
      // Then insert chapter record
      const { error: insertError } = await supabase
        .from('chapters')
        .insert({
          course_id: parseInt(courseId),
          title: addFormData.title,
          description: addFormData.description || null,
          video_storage_path: videoStoragePath,
          order_in_course: addFormData.order_in_course,
        });
      
      if (insertError) throw insertError;
      
      toast({
        title: '添加成功',
        description: `章节 "${addFormData.title}" 已成功添加`,
      });
      
      setIsAddDialogOpen(false);
      setAddFormData({
        title: '',
        description: '',
        order_in_course: chapters.length,
      });
      setVideoFile(null);
      fetchChapters();
    } catch (error: any) {
      toast({
        title: '添加失败',
        description: error.message || '添加章节时出错',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditChapter = async () => {
    if (!selectedChapter) return;
    
    try {
      let videoStoragePath = selectedChapter.video_storage_path;
      
      // If a new video file is provided, upload it
      if (videoFile) {
        setIsUploading(true);
        setUploadProgress(0);
        
        const videoFileName = `${Date.now()}_${videoFile.name.replace(/\s+/g, '_')}`;
        videoStoragePath = `${selectedChapter.course_id}/${videoFileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('course_videos')
          .upload(videoStoragePath, videoFile, {
            cacheControl: '3600',
            upsert: false,
          });
        
        if (uploadError) throw uploadError;
        
        // Delete old video file
        await supabase.storage
          .from('course_videos')
          .remove([selectedChapter.video_storage_path]);
          
        setIsUploading(false);
      }
      
      // Update chapter record
      const { error: updateError } = await supabase
        .from('chapters')
        .update({
          title: editFormData.title,
          description: editFormData.description || null,
          video_storage_path: videoStoragePath,
          order_in_course: editFormData.order_in_course,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedChapter.id);
      
      if (updateError) throw updateError;
      
      toast({
        title: '更新成功',
        description: `章节 "${editFormData.title}" 已更新`,
      });
      
      setIsEditDialogOpen(false);
      setVideoFile(null);
      fetchChapters();
    } catch (error: any) {
      toast({
        title: '更新失败',
        description: error.message || '更新章节时出错',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteChapter = async () => {
    if (!selectedChapter) return;
    
    try {
      // Delete video file first
      const { error: storageError } = await supabase.storage
        .from('course_videos')
        .remove([selectedChapter.video_storage_path]);
      
      if (storageError) throw storageError;
      
      // Then delete chapter record
      const { error: deleteError } = await supabase
        .from('chapters')
        .delete()
        .eq('id', selectedChapter.id);
      
      if (deleteError) throw deleteError;
      
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
    const currentIndex = chapters.findIndex(c => c.id === chapter.id);
    let targetIndex: number;
    let targetChapter: Chapter;
    
    if (direction === 'up') {
      if (currentIndex <= 0) return;
      targetIndex = currentIndex - 1;
    } else {
      if (currentIndex >= chapters.length - 1) return;
      targetIndex = currentIndex + 1;
    }
    
    targetChapter = chapters[targetIndex];
    
    try {
      // Swap order_in_course values
      const tempOrder = chapter.order_in_course;
      
      // Update current chapter
      await supabase
        .from('chapters')
        .update({
          order_in_course: targetChapter.order_in_course,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chapter.id);
      
      // Update target chapter
      await supabase
        .from('chapters')
        .update({
          order_in_course: tempOrder,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetChapter.id);
      
      fetchChapters();
    } catch (error) {
      console.error('Error moving chapter:', error);
      toast({
        title: '操作失败',
        description: '调整章节顺序时出错',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setEditFormData({
      title: chapter.title,
      description: chapter.description || '',
      order_in_course: chapter.order_in_course,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (chapter: Chapter) => {
    setSelectedChapter(chapter);
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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <h1 className="text-2xl font-bold">章节管理</h1>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          添加章节
        </Button>
      </div>
      
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="搜索章节标题或描述..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64"
        />
        <Button type="submit" variant="secondary">
          <Search className="h-4 w-4" />
        </Button>
      </form>
      
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
                  <TableHead>排序</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chapters.length > 0 ? (
                  chapters.map((chapter) => (
                    <TableRow key={chapter.id}>
                      <TableCell>{chapter.id}</TableCell>
                      <TableCell className="font-medium">{chapter.title}</TableCell>
                      <TableCell>{chapter.order_in_course}</TableCell>
                      <TableCell className="max-w-xs truncate">{chapter.description || '-'}</TableCell>
                      <TableCell>{formatDate(chapter.created_at)}</TableCell>
                      <TableCell>{formatDate(chapter.updated_at)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => handleMoveChapter(chapter, 'up')}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleMoveChapter(chapter, 'down')}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(chapter)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(chapter)}>
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
              {renderPagination()}
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
              <label htmlFor="add_order_in_course" className="text-right text-sm font-medium">
                排序
              </label>
              <Input
                id="add_order_in_course"
                type="number"
                value={addFormData.order_in_course}
                onChange={(e) => setAddFormData({ ...addFormData, order_in_course: parseInt(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="add_video" className="text-right text-sm font-medium">
                视频文件 *
              </label>
              <Input
                id="add_video"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="col-span-3"
                required
              />
            </div>
            {isUploading && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">
                  上传进度
                </label>
                <Progress value={uploadProgress} className="col-span-3" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddChapter} disabled={!addFormData.title || !videoFile || isUploading}>
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
              <label htmlFor="edit_order_in_course" className="text-right text-sm font-medium">
                排序
              </label>
              <Input
                id="edit_order_in_course"
                type="number"
                value={editFormData.order_in_course}
                onChange={(e) => setEditFormData({ ...editFormData, order_in_course: parseInt(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_video" className="text-right text-sm font-medium">
                视频文件
              </label>
              <Input
                id="edit_video"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="col-span-3"
              />
            </div>
            {isUploading && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">
                  上传进度
                </label>
                <Progress value={uploadProgress} className="col-span-3" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditChapter} disabled={!editFormData.title || isUploading}>
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
    </div>
  );
};

export default ChapterManagementPage;
