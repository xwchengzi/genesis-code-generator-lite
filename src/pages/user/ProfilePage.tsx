
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';

const ProfilePage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: profile?.phone_number || '',
    school: profile?.school || '',
    college: profile?.college || '',
    major: profile?.major || '',
    grade_year: profile?.grade_year || '',
  });

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone_number: formData.phone_number,
          school: formData.school || null,
          college: formData.college || null,
          major: formData.major || null,
          grade_year: formData.grade_year || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      await refreshProfile();
      
      toast({
        title: '更新成功',
        description: '您的个人信息已成功更新',
      });
    } catch (error: any) {
      toast({
        title: '更新失败',
        description: error.message || '发生错误，请稍后再试',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate access status
  const isExpired = profile ? new Date(profile.access_expiry_date) < new Date() : false;
  const daysLeft = profile 
    ? Math.max(0, Math.ceil((new Date(profile.access_expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))) 
    : 0;

  if (!profile) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">个人信息</h1>
      
      {/* Account Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>账户信息</CardTitle>
          <CardDescription>查看您的账户基本信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">用户名</p>
              <p className="mt-1">{profile.username}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">用户类型</p>
              <p className="mt-1 capitalize">{profile.user_type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">账户创建时间</p>
              <p className="mt-1">{formatDate(profile.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">最后更新时间</p>
              <p className="mt-1">{formatDate(profile.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Access Status Card */}
      <Card className={isExpired ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}>
        <CardHeader>
          <CardTitle className={isExpired ? "text-red-700" : "text-green-700"}>
            访问状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">访问权限截止日期</p>
              <p className="mt-1 font-medium">
                {formatDate(profile.access_expiry_date)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">当前状态</p>
              <p className={`mt-1 font-medium ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                {isExpired ? '已过期' : `有效 (剩余 ${daysLeft} 天)`}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-600">
            {isExpired 
              ? '您的访问权限已过期，请联系管理员续期。' 
              : '访问权限到期后，您将无法观看课程视频。'}
          </p>
        </CardFooter>
      </Card>
      
      {/* Edit Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>编辑个人信息</CardTitle>
          <CardDescription>更新您的联系方式和学校信息</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone_number" className="text-sm font-medium">
                手机号码 *
              </label>
              <Input
                id="phone_number"
                name="phone_number"
                placeholder="请输入手机号码"
                value={formData.phone_number}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="school" className="text-sm font-medium">
                学校
              </label>
              <Input
                id="school"
                name="school"
                placeholder="请输入学校名称"
                value={formData.school}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="college" className="text-sm font-medium">
                学院
              </label>
              <Input
                id="college"
                name="college"
                placeholder="请输入学院名称"
                value={formData.college}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="major" className="text-sm font-medium">
                专业
              </label>
              <Input
                id="major"
                name="major"
                placeholder="请输入专业名称"
                value={formData.major}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="grade_year" className="text-sm font-medium">
                年级/届
              </label>
              <Input
                id="grade_year"
                name="grade_year"
                placeholder="请输入年级或届数"
                value={formData.grade_year}
                onChange={handleChange}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Spinner size="sm" className="mr-2" />}
              保存更改
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ProfilePage;
