import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';

const feedbackSchema = z.object({
  type: z.enum(['complaint', 'report', 'suggestion']),
  content: z.string().min(10, '请详细描述您的问题或建议，至少10字'),
  contact: z.string().optional(),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

export default function Feedback() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
  });

  const onSubmit = async (data: FeedbackFormData) => {
    try {
      const res = await api.post<{ message?: string; feedback?: any }>(
        '/feedbacks',
        data
      );
      toast({
        title: '提交成功',
        description: res?.message || '感谢您的反馈，我们将尽快处理。',
      });
      navigate(-1);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: '提交失败',
        description: err?.message || '请稍后重试',
      });
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <button onClick={() => navigate(-1)} className="btn btn-outline absolute left-6 top-6">返回</button>
      <div className="w-full max-w-2xl">
        <div className="card">
          <h1 className="text-2xl font-bold text-secondary-900 mb-6">投诉 / 反馈 / 建议</h1>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label className="form-label">反馈类型</label>
              <select
                className={cn("input", errors.type && "border-red-300 focus:border-red-500 focus:ring-red-500")}
                {...register('type')}
              >
                <option value="complaint">投诉</option>
                <option value="report">问题上报</option>
                <option value="suggestion">建议</option>
              </select>
              {errors.type && <p className="form-error">{errors.type.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">内容</label>
              <textarea
                rows={6}
                className={cn("input", errors.content && "border-red-300 focus:border-red-500 focus:ring-red-500")}
                placeholder="请详细描述您的问题或建议..."
                {...register('content')}
              />
              {errors.content && <p className="form-error">{errors.content.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">联系方式（选填）</label>
              <input
                type="text"
                className={cn("input", errors.contact && "border-red-300 focus:border-red-500 focus:ring-red-500")}
                placeholder="邮箱 / 手机 / 微信"
                {...register('contact')}
              />
              {errors.contact && <p className="form-error">{errors.contact.message}</p>}
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                提交
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
