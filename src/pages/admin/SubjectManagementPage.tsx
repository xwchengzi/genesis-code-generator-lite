import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Subject } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/use-toast';
import { Edit, Plus, Search, Trash } from 'lucide-react';
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

const SubjectManagementPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  
  // Form states
  const [addFormData, setAddFormData] = useState({
    name: '',
    description: '',
  });
  
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchSubjects();
  }, [currentPage]);

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('subjects')
        .select('*')
        .order('name');
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
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
      
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast({
        title: '获取科目失败',
        description: '加载科目数据时出错',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSubjects();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const handleAddSubject = async () => {
    try {
      // Check if name exists
      const { data: existingSubject } = await supabase
        .from('subjects')
        .select('name')
        .eq('name', addFormData.name)
        .single();
      
      if (existingSubject) {
        toast({
          title: '科目名称已存在',
          description: '请选择其他名称',
          variant: 'destructive',
        });
        return;
      }
      
      const { error } = await supabase
        .from('subjects')
        .insert({
          name: addFormData.name,
          description: addFormData.description || null,
        });
      
      if (error) throw error;
      
      toast({
        title: '添加成功',
        description: `科目 "${addFormData.name}" 已成功添加`,
      });
      
      setIsAddDialogOpen(false);
      setAddFormData({
        name: '',
        description: '',
      });
      
      fetchSubjects();
    } catch (error: any) {
      toast({
        title: '添加失败',
        description: error.message || '添加科目时出错',
        variant: 'destructive',
      });
    }
  };

  const handleEditSubject = async () => {
    if (!selectedSubject) return;
    
    try {
      // Check if name exists and it's not the current subject
      if (editFormData.name !== selectedSubject.name) {
        const { data: existingSubject } = await supabase
          .from('subjects')
          .select('name')
          .eq('name', editFormData.name)
          .single();
        
        if (existingSubject) {
          toast({
            title: '科目名称已存在',
            description: '请选择其他名称',
            variant: 'destructive',
          });
          return;
        }
      }
      
      const { error } = await supabase
        .from('subjects')
        .update({
          name: editFormData.name,
          description: editFormData.description || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedSubject.id);
      
      if (error) throw error;
      
      toast({
        title: '更新成功',
        description: `科目 "${editFormData.name}" 已更新`,
      });
      
      setIsEditDialogOpen(false);
      fetchSubjects();
    } catch (error: any) {
      toast({
        title: '更新失败',
        description: error.message || '更新科目时出错',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSubject = async () => {
    if (!selectedSubject) return;
    
    try {
      // Check if there are courses associated with this subject
      const { count, error: countError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('subject_id', selectedSubject.id);
      
      if (countError) throw countError;
      
      if (count && count > 0) {
        toast({
          title: '无法删除',
          description: `科目 "${selectedSubject.name}" 下有 ${count} 个课程，请先删除这些课程`,
          variant: 'destructive',
        });
        setIsDeleteDialogOpen(false);
        return;
      }
      
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', selectedSubject.id);
      
      if (error) throw error;
      
      toast({
        title: '删除成功',
        description: `科目 "${selectedSubject.name}" 已被删除`,
      });
      
      setIsDeleteDialogOpen(false);
      fetchSubjects();
    } catch (error: any) {
      toast({
        title: '删除失败',
        description: error.message || '删除科目时出错',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (subject: Subject) => {
    setSelectedSubject(subject);
    setEditFormData({
      name: subject.name,
      description: subject.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDeleteDialogOpen(true);
  };

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
        <h1 className="text-2xl font-bold">科目管理</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          添加科目
        </Button>
      </div>
      
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="搜索科目名称或描述..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64"
        />
        <Button type="submit" variant="secondary">
          <Search className="h-4 w-4" />
        </Button>
      </form>
      
      {/* Subjects Table */}
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
                  <TableHead>名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.length > 0 ? (
                  subjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell>{subject.id}</TableCell>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{subject.description || '-'}</TableCell>
                      <TableCell>{formatDate(subject.created_at)}</TableCell>
                      <TableCell>{formatDate(subject.updated_at)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(subject)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(subject)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      未找到科目
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && renderPagination()}
        </div>
      )}
      
      {/* Add Subject Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>添加新科目</DialogTitle>
            <DialogDescription>
              填写以下信息创建新科目
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right text-sm font-medium">
                名称 *
              </label>
              <Input
                id="name"
                value={addFormData.name}
                onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="description" className="text-right text-sm font-medium">
                描述
              </label>
              <Textarea
                id="description"
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
            <Button onClick={handleAddSubject} disabled={!addFormData.name}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Subject Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>编辑科目</DialogTitle>
            <DialogDescription>
              修改科目信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_name" className="text-right text-sm font-medium">
                名称 *
              </label>
              <Input
                id="edit_name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditSubject} disabled={!editFormData.name}>
              保存更改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Subject Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>删除科目</DialogTitle>
            <DialogDescription>
              您确定要删除科目 "{selectedSubject?.name}" 吗？如果此科目下有课程，则无法删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubject}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubjectManagementPage;
