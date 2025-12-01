import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Chat from './pages/chat/Chat';
import ModelsAdmin from './pages/admin/Models';
import UsersAdmin from './pages/admin/Users';
import LogsAdmin from './pages/admin/Logs';
import AdminLayout from './pages/admin/Layout';
import ConversationDetail from './pages/admin/ConversationDetail';
import AdminLogin from './pages/admin/AdminLogin';
import FeedbacksAdmin from './pages/admin/Feedbacks';
import Feedback from './pages/feedback/Feedback';
import PasswordReset from './pages/auth/PasswordReset';
import Terms from './pages/static/Terms';
import Privacy from './pages/static/Privacy';
import { Toaster } from './components/ui/Toaster';

function App() {
  const isAdminPort = typeof window !== 'undefined' && window.location.port === '11010';
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = isAdminPort ? '和元智擎政易大模型管理后台' : '和元智擎';
    }
  }, [isAdminPort]);
  return (
    <Router>
      <div className="min-h-screen bg-secondary-50">
        <Routes>
          <Route path="/" element={<Navigate to={isAdminPort ? '/admin/login' : '/login'} replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="models" element={<ModelsAdmin />} />
            <Route path="users" element={<UsersAdmin />} />
            <Route path="conversations/:id" element={<ConversationDetail />} />
            <Route path="logs" element={<LogsAdmin />} />
            <Route path="feedbacks" element={<FeedbacksAdmin />} />
            <Route index element={<Navigate to="/admin/models" replace />} />
          </Route>
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/password-reset" element={<PasswordReset />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
        {!isAdminPort && (
          <div className="fixed bottom-6 right-6 z-50">
            <Link to="/feedback" className="btn btn-secondary shadow-md">
              提交投诉/反馈/建议
            </Link>
          </div>
        )}
        <div className="fixed bottom-2 left-1/2 -translate-x-1/2 text-xs text-secondary-600 z-50 bg-white border border-secondary-200 rounded px-3 py-1 shadow-sm">
          内容由AI生成，仅供参考
        </div>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
