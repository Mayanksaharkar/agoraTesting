import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { userApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function UserBlogDetailsPage() {
  const { blogId } = useParams();
  const { toast } = useToast();
  const [blog, setBlog] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await userApi.getBlogById(blogId as string);
        const data = 'data' in res ? (res as any).data : res;
        setBlog(data?.data || data?.blog || data || null);
      } catch (e: any) {
        toast({ title: 'Failed to load blog', description: e.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    if (blogId) load();
  }, [blogId]);

  if (loading) return <div className="container mx-auto px-4 py-6"><div className="h-24 rounded-xl animate-shimmer" /></div>;
  if (!blog) return <div className="container mx-auto px-4 py-6 text-muted-foreground">Blog not found</div>;

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <h1 className="font-display font-bold text-foreground">{blog.title}</h1>
      {blog.image && <img src={(typeof blog.image === 'string' ? blog.image.replace(/`/g, '').trim() : blog.image)} alt={blog.title} className="max-h-64 rounded-lg border border-border" />}
      <div className="prose prose-sm text-foreground">{blog.content}</div>
    </div>
  );
}
