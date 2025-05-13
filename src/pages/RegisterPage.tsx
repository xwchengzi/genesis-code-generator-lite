
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Spinner } from '@/components/ui/spinner';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [school, setSchool] = useState('');
  const [college, setCollege] = useState('');
  const [major, setMajor] = useState('');
  const [gradeYear, setGradeYear] = useState('');
  const { signUp, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    
    if (username.trim() && password && phoneNumber) {
      const additionalData: Record<string, string> = {};
      
      if (school) additionalData.school = school;
      if (college) additionalData.college = college;
      if (major) additionalData.major = major;
      if (gradeYear) additionalData.grade_year = gradeYear;
      
      await signUp(username, password, phoneNumber, additionalData);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">注册账号</CardTitle>
          <CardDescription className="text-center">
            创建一个新的显然考研账号
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                用户名 <span className="text-red-500">*</span>
              </label>
              <Input
                id="username"
                placeholder="请设置用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                密码 <span className="text-red-500">*</span>
              </label>
              <Input
                id="password"
                type="password"
                placeholder="请设置密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                确认密码 <span className="text-red-500">*</span>
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="text-sm font-medium">
                手机号 <span className="text-red-500">*</span>
              </label>
              <Input
                id="phoneNumber"
                placeholder="请输入手机号"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="school" className="text-sm font-medium">
                学校
              </label>
              <Input
                id="school"
                placeholder="请输入学校名称"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="college" className="text-sm font-medium">
                学院
              </label>
              <Input
                id="college"
                placeholder="请输入学院名称"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="major" className="text-sm font-medium">
                专业
              </label>
              <Input
                id="major"
                placeholder="请输入专业名称"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="gradeYear" className="text-sm font-medium">
                年级/届
              </label>
              <Input
                id="gradeYear"
                placeholder="请输入年级或届数"
                value={gradeYear}
                onChange={(e) => setGradeYear(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
              注册
            </Button>
            <div className="mt-4 text-center text-sm">
              已有账号？{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                立即登录
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RegisterPage;
