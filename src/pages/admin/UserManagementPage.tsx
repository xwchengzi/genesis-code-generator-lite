
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/use-toast';
import { Edit, Search, Trash, UserPlus } from 'lucide-react';
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

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const itemsPerPage = 10;
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  
  // Form states
  const [addFormData, setAddFormData] = useState({
    username: '',
    password: '',
    phone_number: '',
    user_type: 'user' as 'user' | 'admin',
    access_expiry_date: '',
  });
  
  const [editFormData, setEditFormData] = useState({
    phone_number: '',
    school: '',
    college: '',
    major: '',
    grade_year: '',
    user_type: 'user' as 'user' | 'admin',
    access_expiry_date: '',
  });
  
  const [resetPasswordData, setResetPasswordData] = useState({
    new_password: '',
  });

  useEffect(() => {
    fetchUsers();
  }, [currentPage, userTypeFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (userTypeFilter !== 'all') {
        query = query.eq('user_type', userTypeFilter);
      }
      
      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,school.ilike.%${searchTerm}%`);
      }
      
      // Get total count first
      const { count } = await query.select('id', { count: 'exact', head: true });
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
      
      // Then get paginated results
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data, error } = await query
        .range(from, to);
      
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: '获取用户失败',
        description: '加载用户数据时出错',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const handleAddUser = async () => {
    try {
      // Check if username exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', addFormData.username)
        .single();
      
      if (existingUser) {
        toast({
          title: '用户名已存在',
          description: '请选择其他用户名',
          variant: 'destructive',
        });
        return;
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: `${addFormData.username}@example.com`,
        password: addFormData.password,
        options: {
          data: {
            username: addFormData.username,
            phone_number: addFormData.phone_number,
            user_type: addFormData.user_type,
          }
        }
      });
      
      if (error) throw error;
      
      // After user is created, update the access_expiry_date
      if (data.user) {
        const expiry = addFormData.access_expiry_date 
          ? new Date(addFormData.access_expiry_date).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default to 30 days
          
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ access_expiry_date: expiry })
          .eq('id', data.user.id);
          
        if (updateError) throw updateError;
      }
      
      toast({
        title: '添加成功',
        description: `${addFormData.user_type === 'admin' ? '管理员' : '用户'} ${addFormData.username} 已成功添加`,
      });
      
      setIsAddDialogOpen(false);
      setAddFormData({
        username: '',
        password: '',
        phone_number: '',
        user_type: 'user',
        access_expiry_date: '',
      });
      
      fetchUsers();
    } catch (error: any) {
      toast({
        title: '添加失败',
        description: error.message || '添加用户时出错',
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone_number: editFormData.phone_number,
          school: editFormData.school || null,
          college: editFormData.college || null,
          major: editFormData.major || null,
          grade_year: editFormData.grade_year || null,
          user_type: editFormData.user_type,
          access_expiry_date: editFormData.access_expiry_date 
            ? new Date(editFormData.access_expiry_date).toISOString()
            : selectedUser.access_expiry_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      toast({
        title: '更新成功',
        description: `用户 ${selectedUser.username} 信息已更新`,
      });
      
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: '更新失败',
        description: error.message || '更新用户信息时出错',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const { error } = await supabase.auth.admin.deleteUser(
        selectedUser.id
      );
      
      if (error) throw error;
      
      toast({
        title: '删除成功',
        description: `用户 ${selectedUser.username} 已被删除`,
      });
      
      setIsDeleteDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: '删除失败',
        description: error.message || '删除用户时出错',
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !resetPasswordData.new_password) return;
    
    try {
      const { error } = await supabase.auth.admin.updateUserById(
        selectedUser.id,
        { password: resetPasswordData.new_password }
      );
      
      if (error) throw error;
      
      toast({
        title: '密码重置成功',
        description: `用户 ${selectedUser.username} 的密码已重置`,
      });
      
      setIsResetPasswordDialogOpen(false);
      setResetPasswordData({ new_password: '' });
    } catch (error: any) {
      toast({
        title: '密码重置失败',
        description: error.message || '重置密码时出错',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (user: Profile) => {
    setSelectedUser(user);
    setEditFormData({
      phone_number: user.phone_number,
      school: user.school || '',
      college: user.college || '',
      major: user.major || '',
      grade_year: user.grade_year || '',
      user_type: user.user_type as 'user' | 'admin',
      access_expiry_date: user.access_expiry_date.split('T')[0], // Format as YYYY-MM-DD
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: Profile) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const openResetPasswordDialog = (user: Profile) => {
    setSelectedUser(user);
    setResetPasswordData({ new_password: '' });
    setIsResetPasswordDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          添加用户
        </Button>
      </div>
      
      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex w-full sm:w-auto gap-2">
          <Input
            placeholder="搜索用户名、手机号或学校..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        
        <Select
          value={userTypeFilter}
          onValueChange={(value) => {
            setUserTypeFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="筛选用户类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部用户</SelectItem>
            <SelectItem value="user">普通用户</SelectItem>
            <SelectItem value="admin">管理员</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Users Table */}
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
                  <TableHead>用户名</TableHead>
                  <TableHead>手机号</TableHead>
                  <TableHead>学校</TableHead>
                  <TableHead>用户类型</TableHead>
                  <TableHead>访问截止日期</TableHead>
                  <TableHead>注册时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => {
                    const isExpired = new Date(user.access_expiry_date) < new Date();
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.phone_number}</TableCell>
                        <TableCell>{user.school || '-'}</TableCell>
                        <TableCell>
                          <span className={user.user_type === 'admin' ? 'text-purple-600 font-medium' : ''}>
                            {user.user_type === 'admin' ? '管理员' : '普通用户'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={isExpired ? 'text-red-600' : 'text-green-600'}>
                            {formatDate(user.access_expiry_date)}
                            {isExpired ? ' (已过期)' : ''}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openResetPasswordDialog(user)}>
                            重置密码
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(user)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      未找到用户
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
      
      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>添加新用户</DialogTitle>
            <DialogDescription>
              填写以下信息创建新用户账户
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="username" className="text-right text-sm font-medium">
                用户名 *
              </label>
              <Input
                id="username"
                value={addFormData.username}
                onChange={(e) => setAddFormData({ ...addFormData, username: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="password" className="text-right text-sm font-medium">
                密码 *
              </label>
              <Input
                id="password"
                type="password"
                value={addFormData.password}
                onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="phone_number" className="text-right text-sm font-medium">
                手机号 *
              </label>
              <Input
                id="phone_number"
                value={addFormData.phone_number}
                onChange={(e) => setAddFormData({ ...addFormData, phone_number: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="user_type" className="text-right text-sm font-medium">
                用户类型
              </label>
              <Select
                value={addFormData.user_type}
                onValueChange={(value: 'user' | 'admin') => setAddFormData({ ...addFormData, user_type: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择用户类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">普通用户</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="access_expiry_date" className="text-right text-sm font-medium">
                访问截止日期
              </label>
              <Input
                id="access_expiry_date"
                type="date"
                value={addFormData.access_expiry_date}
                onChange={(e) => setAddFormData({ ...addFormData, access_expiry_date: e.target.value })}
                className="col-span-3"
                min={new Date().toISOString().split('T')[0]}
                placeholder="默认30天"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddUser} disabled={!addFormData.username || !addFormData.password || !addFormData.phone_number}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>
              修改 {selectedUser?.username} 的信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_phone_number" className="text-right text-sm font-medium">
                手机号 *
              </label>
              <Input
                id="edit_phone_number"
                value={editFormData.phone_number}
                onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_school" className="text-right text-sm font-medium">
                学校
              </label>
              <Input
                id="edit_school"
                value={editFormData.school}
                onChange={(e) => setEditFormData({ ...editFormData, school: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_college" className="text-right text-sm font-medium">
                学院
              </label>
              <Input
                id="edit_college"
                value={editFormData.college}
                onChange={(e) => setEditFormData({ ...editFormData, college: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_major" className="text-right text-sm font-medium">
                专业
              </label>
              <Input
                id="edit_major"
                value={editFormData.major}
                onChange={(e) => setEditFormData({ ...editFormData, major: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_grade_year" className="text-right text-sm font-medium">
                年级/届
              </label>
              <Input
                id="edit_grade_year"
                value={editFormData.grade_year}
                onChange={(e) => setEditFormData({ ...editFormData, grade_year: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_user_type" className="text-right text-sm font-medium">
                用户类型
              </label>
              <Select
                value={editFormData.user_type}
                onValueChange={(value: 'user' | 'admin') => setEditFormData({ ...editFormData, user_type: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择用户类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">普通用户</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_access_expiry_date" className="text-right text-sm font-medium">
                访问截止日期
              </label>
              <Input
                id="edit_access_expiry_date"
                type="date"
                value={editFormData.access_expiry_date}
                onChange={(e) => setEditFormData({ ...editFormData, access_expiry_date: e.target.value })}
                className="col-span-3"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditUser} disabled={!editFormData.phone_number}>
              保存更改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>删除用户</DialogTitle>
            <DialogDescription>
              您确定要删除用户 {selectedUser?.username} 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>
              为用户 {selectedUser?.username} 设置新密码
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="new_password" className="text-right text-sm font-medium">
                新密码
              </label>
              <Input
                id="new_password"
                type="password"
                value={resetPasswordData.new_password}
                onChange={(e) => setResetPasswordData({ new_password: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleResetPassword} disabled={!resetPasswordData.new_password}>
              重置密码
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPage;
