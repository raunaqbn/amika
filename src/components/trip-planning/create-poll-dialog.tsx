'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Trash2, Loader2, BarChart2 } from 'lucide-react';

interface CreatePollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  context: string;
  onPollCreated?: () => void;
}

export function CreatePollDialog({
  open,
  onOpenChange,
  tripId,
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

  const handleAddOption = () => {
    setOptions([...options, { label: '', url: '' }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (
    index: number,
    field: 'label' | 'url',
    value: string
  ) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validOptions = options.filter((o) => o.label.trim());
    if (!question.trim() || validOptions.length < 2) {
      setError('Please enter a question and at least 2 options');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/trips/${tripId}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          question: question.trim(),
          options: validOptions.map((o) => ({
            label: o.label.trim(),
            url: o.url.trim() || undefined,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create poll');
      }

      onPollCreated?.();
      onOpenChange(false);
      setQuestion('');
      setOptions([{ label: '', url: '' }, { label: '', url: '' }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#A8C5A8]" />
            Create Poll
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Question</label>
            <Input
              placeholder="What would you like to decide?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Options</label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option.label}
                    onChange={(e) =>
                      handleOptionChange(index, 'label', e.target.value)
                    }
                    disabled={saving}
                  />
                </div>
                <div className="w-1/3">
                  <Input
                    placeholder="URL (optional)"
                    value={option.url}
                    onChange={(e) =>
                      handleOptionChange(index, 'url', e.target.value)
                    }
                    disabled={saving}
                  />
                </div>
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveOption(index)}
                    disabled={saving}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddOption}
              disabled={saving || options.length >= 10}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Option
            </Button>
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
              disabled={saving || !question.trim()}
              className="bg-[#A8C5A8] hover:bg-[#97b497]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Poll'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
