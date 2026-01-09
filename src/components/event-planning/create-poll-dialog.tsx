'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { BarChart2, Plus, Minus, Loader2, Link2 } from 'lucide-react';

interface CreatePollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventPlanId: string;
  context: 'date' | 'event';
  onPollCreated?: () => void;
}

export function CreatePollDialog({
  open,
  onOpenChange,
  eventPlanId,
  context,
  onPollCreated,
}: CreatePollDialogProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([
    { label: '', url: '' },
    { label: '', url: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQuestion('');
      setOptions([
        { label: '', url: '' },
        { label: '', url: '' },
      ]);
      setError(null);
    }
  }, [open]);

  const addOption = () => {
    setOptions([...options, { label: '', url: '' }]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, field: 'label' | 'url', value: string) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    const validOptions = options.filter((opt) => opt.label.trim());
    if (validOptions.length < 2) {
      setError('Please add at least 2 options');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/event-plans/${eventPlanId}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          question: question.trim(),
          options: validOptions.map((opt) => ({
            label: opt.label.trim(),
            url: opt.url.trim() || undefined,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create poll');
      }

      onPollCreated?.();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const contextLabel = context === 'date' ? 'date' : 'event';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#A8C5A8]" />
            Create a {contextLabel} Poll
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Question *</label>
            <Input
              placeholder={`e.g., ${context === 'date' ? 'What day works best?' : 'Which event should we go to?'}`}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Options *</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addOption}
                disabled={saving}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Option
              </Button>
            </div>

            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option.label}
                      onChange={(e) => updateOption(index, 'label', e.target.value)}
                      disabled={saving}
                    />
                    <div className="flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-muted-foreground" />
                      <Input
                        placeholder="URL (optional)"
                        value={option.url}
                        onChange={(e) => updateOption(index, 'url', e.target.value)}
                        disabled={saving}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      disabled={saving}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#A8C5A8] hover:bg-[#97b497] text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <BarChart2 className="w-4 h-4 mr-2" />
                  Create Poll
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
