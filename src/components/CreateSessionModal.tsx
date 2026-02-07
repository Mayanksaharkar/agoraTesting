import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { astrologerApi } from '@/services/api';
import { TOPICS } from '@/config';

interface CreateSessionModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateSessionModal({ onClose, onCreated }: CreateSessionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    topic: 'General',
    scheduledStartTime: '',
    allowChat: true,
    isPublic: true,
    maxViewers: 1000,
    isMonetized: false,
    entryFee: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setIsLoading(true);
    try {
      await astrologerApi.createSession({
        ...form,
        scheduledStartTime: form.scheduledStartTime ? new Date(form.scheduledStartTime).toISOString() : new Date().toISOString(),
      });
      onCreated();
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-foreground">Schedule New Session</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-secondary-foreground">Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Daily Tarot Reading"
              className="bg-secondary border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-secondary-foreground">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What will this session be about?"
              className="bg-secondary border-border resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-secondary-foreground">Topic</Label>
              <Select value={form.topic} onValueChange={(v) => setForm({ ...form, topic: v })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOPICS.filter((t) => t !== 'All').map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-secondary-foreground">Start Time</Label>
              <Input
                type="datetime-local"
                value={form.scheduledStartTime}
                onChange={(e) => setForm({ ...form, scheduledStartTime: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-secondary-foreground">Max Viewers</Label>
            <Input
              type="number"
              value={form.maxViewers}
              onChange={(e) => setForm({ ...form, maxViewers: parseInt(e.target.value) || 1000 })}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label className="text-secondary-foreground">Allow Chat</Label>
            <Switch checked={form.allowChat} onCheckedChange={(v) => setForm({ ...form, allowChat: v })} />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label className="text-secondary-foreground">Public Session</Label>
            <Switch checked={form.isPublic} onCheckedChange={(v) => setForm({ ...form, isPublic: v })} />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label className="text-secondary-foreground">Monetized</Label>
            <Switch checked={form.isMonetized} onCheckedChange={(v) => setForm({ ...form, isMonetized: v })} />
          </div>

          {form.isMonetized && (
            <div className="space-y-2">
              <Label className="text-secondary-foreground">Entry Fee</Label>
              <Input
                type="number"
                value={form.entryFee}
                onChange={(e) => setForm({ ...form, entryFee: parseFloat(e.target.value) || 0 })}
                className="bg-secondary border-border"
                min={0}
              />
            </div>
          )}

          <Button type="submit" disabled={isLoading || !form.title.trim()} className="w-full gold-gradient text-primary-foreground h-11 font-semibold">
            {isLoading ? 'Scheduling...' : 'Schedule Session'}
          </Button>
        </form>
      </div>
    </div>
  );
}
