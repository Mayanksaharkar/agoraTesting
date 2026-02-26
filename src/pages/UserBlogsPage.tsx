import { useEffect, useState } from 'react';
import { userApi } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function UserBlogsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await userApi.getBlogs({ search, page: 1, limit: 20 });
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

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <h1 className="font-display font-bold text-foreground">Blogs</h1>
      <div className="flex gap-2">
        <Input placeholder="Search blogs" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button onClick={load}>Search</Button>
      </div>
      {loading ? (
        <div className="h-24 rounded-xl animate-shimmer" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((b) => (
            <div key={b._id} className="bg-card border border-border rounded-xl p-4">
              <div className="text-foreground font-medium">{b.title}</div>
              <div className="text-xs text-muted-foreground">{b.author?.personalDetails?.name || ''}</div>
              <div className="mt-2">
                <Button variant="outline" onClick={() => navigate(`/user/blogs/${b._id}`)}>Read</Button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-muted-foreground">No blogs found</div>}
        </div>
      )}
    </div>
  );
}
