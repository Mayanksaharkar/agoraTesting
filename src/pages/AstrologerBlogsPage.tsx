import { useEffect, useState } from 'react';
import { astrologerApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function AstrologerBlogsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await astrologerApi.getMyBlogs(1, 20);
      const data = 'data' in res ? (res as any).data : res;
      const list = Array.isArray((data as any)?.data)
        ? (data as any).data
        : Array.isArray(data)
        ? (data as any)
        : [];
      setItems(list);
    } catch (e: any) {
      toast({ title: 'Failed to load blogs', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await astrologerApi.deleteBlog(id);
      toast({ title: 'Deleted', description: 'Blog removed' });
      load();
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="font-display font-bold text-foreground">My Blogs</h1>
        <Button className="gold-gradient text-primary-foreground" onClick={() => navigate('/astrologer/blogs/new')}>
          New Blog
        </Button>
      </div>
      {loading ? (
        <div className="h-24 rounded-xl animate-shimmer" />
      ) : (
        <div className="space-y-3">
          {items.map((b) => (
            <div key={b._id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-foreground font-medium">{b.title}</div>
                <div className="text-xs text-muted-foreground">{b.status}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate(`/astrologer/blogs/${b._id}/edit`)}>Edit</Button>
                <Button variant="destructive" onClick={() => handleDelete(b._id)}>Delete</Button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-muted-foreground">No blogs yet</div>}
        </div>
      )}
    </div>
  );
}
