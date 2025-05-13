
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ExpiredPage: React.FC = () => {
  const { profile } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-3xl font-bold text-red-600 mb-4">访问已过期</h1>
        <p className="text-gray-600 mb-6">
          很抱歉，您的账户访问权限已过期。您的试用期结束日期为：
          {profile?.access_expiry_date ? (
            <span className="block font-semibold mt-2">
              {new Date(profile.access_expiry_date).toLocaleDateString('zh-CN')}
            </span>
          ) : (
            <span className="block font-semibold mt-2">未知</span>
          )}
        </p>
        <p className="text-gray-600 mb-6">
          请联系管理员续期您的账户，以继续访问课程内容。
        </p>
        <div className="flex flex-col gap-3">
          <Button asChild variant="default">
            <Link to="/dashboard">返回个人中心</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/login">重新登录</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExpiredPage;
