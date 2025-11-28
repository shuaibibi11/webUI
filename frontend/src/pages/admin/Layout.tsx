import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { authService } from '@/services/auth';

export default function AdminLayout() {
  const token = authService.getToken();
  let role = '' as string;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      role = payload?.role || '';
    } catch {}
  }
  const isAdmin = Boolean(token && role === 'ADMIN');
  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="min-h-screen flex bg-secondary-50">
      <aside className="w-64 bg-white border-r border-secondary-200 p-4">
        <h1 className="text-lg font-semibold text-secondary-900 mb-4">管理后台</h1>
        <nav className="space-y-2">
          <NavLink
            to="/admin/models"
            className={({ isActive }) => cn(
              'block px-3 py-2 rounded-md text-sm',
              isActive ? 'bg-secondary-100 text-secondary-900' : 'text-secondary-700 hover:bg-secondary-100'
            )}
          >模型配置</NavLink>
          <NavLink
            to="/admin/users"
            className={({ isActive }) => cn(
              'block px-3 py-2 rounded-md text-sm',
              isActive ? 'bg-secondary-100 text-secondary-900' : 'text-secondary-700 hover:bg-secondary-100'
            )}
          >账号管理</NavLink>
          <NavLink
            to="/admin/logs"
            className={({ isActive }) => cn(
              'block px-3 py-2 rounded-md text-sm',
              isActive ? 'bg-secondary-100 text-secondary-900' : 'text-secondary-700 hover:bg-secondary-100'
            )}
          >审计日志</NavLink>
          <NavLink
            to="/admin/feedbacks"
            className={({ isActive }) => cn(
              'block px-3 py-2 rounded-md text-sm',
              isActive ? 'bg-secondary-100 text-secondary-900' : 'text-secondary-700 hover:bg-secondary-100'
            )}
          >反馈管理</NavLink>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
