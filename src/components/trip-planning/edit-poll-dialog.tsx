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
import { Plus, Trash2, Loader2, Pencil } from 'lucide-react';

interface PollOption {
  id: string;
  pollId: string;
  label: string;
  url: string | null;
  order: number;
  votes?: { id: string }[];
}

interface TripPoll {
  id: string;
  tripId: string;
  context: string;
  question: string;
  status: string;
  createdById: string;
  createdAt: Date;
  closedAt: Date | null;
  options?: PollOption[];
}

interface EditPollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  poll: TripPoll;
  onPollUpdated?: () => void;
}

export function EditPollDialog({
  open,
  onOpenChange,
  tripId,
  poll,
  onPollUpdated,
}: EditPollDialogProps) {
  const [question, setQuestion] = useState(poll.question);
  const [existingOptions, setExistingOptions] = useState<PollOption[]>(poll.options || []);
  const [newOptions, setNewOptions] = useState<{ label: string; url: string }[]>([]);
  const [optionsToRemove, setOptionsToRemove] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens with new poll data
  useEffect(() => {
    if (open) {
      setQuestion(poll.question);
      setExistingOptions(poll.options || []);
      setNewOptions([]);
      setOptionsToRemove([]);
      setError(null);
    }
  }, [open, poll]);

  const handleAddNewOption = () => {
    setNewOptions([...newOptions, { label: '', url: '' }]);
  };

  const handleRemoveNewOption = (index: number) => {
    setNewOptions(newOptions.filter((_, i) => i !== index));
  };

  const handleNewOptionChange = (
    index: number,
    field: 'label' | 'url',
    value: string
  ) => {
    const updated = [...newOptions];
    updated[index][field] = value;
    setNewOptions(updated);
  };

  const handleMarkForRemoval = (optionId: string) => {
    if (optionsToRemove.includes(optionId)) {
      setOptionsToRemove(optionsToRemove.filter((id) => id !== optionId));
    } else {
      setOptionsToRemove([...optionsToRemove, optionId]);
    }
  };

  const remainingOptionsCount = existingOptions.length - optionsToRemove.length + newOptions.filter(o => o.label.trim()).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validNewOptions = newOptions.filter((o) => o.label.trim());

    // Ensure at least 2 options remain after removal
    if (remainingOptionsCount < 2) {
      setError('Poll must have at least 2 options');
      return;
    }

    const hasQuestionChange = question.trim() !== poll.question;
    const hasNewOptions = validNewOptions.length > 0;
    const hasRemovals = optionsToRemove.length > 0;

    if (!hasQuestionChange && !hasNewOptions && !hasRemovals) {
      setError('No changes to save');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/trips/${tripId}/polls`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: poll.id,
          question: hasQuestionChange ? question.trim() : undefined,
          addOptions: hasNewOptions
            ? validNewOptions.map((o) => ({
                label: o.label.trim(),
                url: o.url.trim() || undefined,
              }))
            : undefined,
          removeOptionIds: hasRemovals ? optionsToRemove : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update poll');
      }

      onPollUpdated?.();
      onOpenChange(false);
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
            <Pencil className="w-5 h-5 text-[#A8C5A8]" />
            Edit Poll
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
            <label className="text-sm font-medium">Existing Options</label>
            {existingOptions.map((option) => {
              const isMarkedForRemoval = optionsToRemove.includes(option.id);
              const voteCount = option.votes?.length || 0;
              return (
                <div
                  key={option.id}
                  className={`flex gap-2 items-center ${isMarkedForRemoval ? 'opacity-50' : ''}`}
                >
                  <div className="flex-1">
                    <Input
                      value={option.label}
                      disabled
                      className={isMarkedForRemoval ? 'line-through' : ''}
                    />
                  </div>
                  {option.url && (
                    <div className="w-1/4">
                      <Input value={option.url} disabled className="text-xs" />
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    {voteCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {voteCount} vote{voteCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    <Button
                      type="button"
                      variant={isMarkedForRemoval ? 'outline' : 'ghost'}
                      size="sm"
                      onClick={() => handleMarkForRemoval(option.id)}
                      disabled={saving || (!isMarkedForRemoval && remainingOptionsCount <= 2)}
                      title={isMarkedForRemoval ? 'Undo removal' : 'Remove option'}
                    >
                      <Trash2 className={`w-4 h-4 ${isMarkedForRemoval ? 'text-gray-400' : 'text-red-500'}`} />
                    </Button>
                  </div>
                </div>
              );
            })}
            {optionsToRemove.length > 0 && (
              <p className="text-xs text-amber-600">
                {optionsToRemove.length} option{optionsToRemove.length !== 1 ? 's' : ''} will be removed along with their votes
              </p>
            )}
          </div>

          {newOptions.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">New Options</label>
              {newOptions.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder={`New option ${index + 1}`}
                      value={option.label}
                      onChange={(e) =>
                        handleNewOptionChange(index, 'label', e.target.value)
                      }
                      disabled={saving}
                    />
                  </div>
                  <div className="w-1/3">
                    <Input
                      placeholder="URL (optional)"
                      value={option.url}
                      onChange={(e) =>
                        handleNewOptionChange(index, 'url', e.target.value)
                      }
                      disabled={saving}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveNewOption(index)}
                    disabled={saving}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddNewOption}
            disabled={saving || existingOptions.length + newOptions.length >= 10}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add New Option
          </Button>

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
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
