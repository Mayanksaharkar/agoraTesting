import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { astrologerApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function AstrologerBlogFormPage() {
  const { blogId } = useParams();
  const isEdit = !!blogId;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!isEdit) return;
      setLoading(true);
      try {
        const res = await astrologerApi.getMyBlogs(1, 50);
        const data = 'data' in res ? (res as any).data : res;
        const list = Array.isArray((data as any)?.data)
          ? (data as any).data
          : Array.isArray(data)
          ? (data as any)
          : [];
        const found = list.find((x: any) => x._id === blogId);
        if (found) {
          setTitle(found.title || '');
          setContent(found.content || '');
        }
      } catch (e: any) {
        toast({ title: 'Failed to load blog', description: e.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [blogId]);

  const handleSubmit = async () => {
    const form = new FormData();
    form.append('title', title);
    form.append('content', content);
    if (file) form.append('image', file);
    try {
      if (isEdit) {
        await astrologerApi.updateBlog(blogId as string, form);
        toast({ title: 'Updated', description: 'Blog updated and sent for approval' });
      } else {
        await astrologerApi.createBlog(form);
        toast({ title: 'Created', description: 'Blog submitted for approval' });
      }
      navigate('/astrologer/blogs');
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <h1 className="font-display font-bold text-foreground">{isEdit ? 'Edit Blog' : 'New Blog'}</h1>
      <div className="space-y-3 max-w-2xl">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={10} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="image">Image</Label>
          <Input id="image" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/astrologer/blogs')}>Cancel</Button>
          <Button className="gold-gradient text-primary-foreground" onClick={handleSubmit} disabled={loading}>
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}
