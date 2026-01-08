'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Check, X, ExternalLink, Lock, Trash2 } from 'lucide-react';

interface PollVote {
  id: string;
  optionId: string;
  visitorId: string | null;
  friendId: string | null;
  votedAt: Date;
  voterName?: string;
  voterProfileImage?: string;
}

interface PollOption {
  id: string;
  pollId: string;
  label: string;
  url: string | null;
  order: number;
  votes?: PollVote[];
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

interface TripPollComponentProps {
  poll: TripPoll;
  tripId: string;
  currentUserId?: string;
  onVote?: () => void;
  onClose?: () => void;
  onDelete?: () => void;
}

export function TripPollComponent({
  poll,
  tripId,
  currentUserId,
  onVote,
  onClose,
  onDelete,
}: TripPollComponentProps) {
  const [voting, setVoting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Track optimistic votes: Map of optionId -> true (voted) or false (unvoted)
  const [optimisticVotes, setOptimisticVotes] = useState<Map<string, boolean>>(new Map());

  const totalVotes = poll.options?.reduce(
    (sum, opt) => sum + (opt.votes?.length || 0),
    0
  ) || 0;

  // Get all option IDs the user voted for from server state
  const serverVotedOptionIds = new Set(
    poll.options
      ?.filter((opt) => opt.votes?.some((v) => v.visitorId === currentUserId))
      .map((opt) => opt.id) || []
  );

  // Compute effective voted options: apply optimistic updates to server state
  const userVotedOptionIds = new Set(serverVotedOptionIds);
  optimisticVotes.forEach((voted, optionId) => {
    if (voted) {
      userVotedOptionIds.add(optionId);
    } else {
      userVotedOptionIds.delete(optionId);
    }
  });

  // Reset optimistic state when server data catches up
  useEffect(() => {
    if (optimisticVotes.size > 0) {
      const newOptimistic = new Map(optimisticVotes);
      let changed = false;
      optimisticVotes.forEach((voted, optionId) => {
        const serverHasVote = serverVotedOptionIds.has(optionId);
        if (voted === serverHasVote) {
          newOptimistic.delete(optionId);
          changed = true;
        }
      });
      if (changed) {
        setOptimisticVotes(newOptimistic);
      }
    }
  }, [optimisticVotes, serverVotedOptionIds]);

  const handleVote = async (optionId: string) => {
    if (poll.status !== 'active' || voting) return;

    // Check if user is clicking on already voted option (toggle off)
    const isUnvoting = userVotedOptionIds.has(optionId);

    // Optimistically update the UI immediately
    setOptimisticVotes((prev) => {
      const next = new Map(prev);
      next.set(optionId, !isUnvoting);
      return next;
    });
    setVoting(true);

    try {
      if (isUnvoting) {
        // Remove the vote
        const response = await fetch(
          `/api/trips/${tripId}/polls/${poll.id}/vote?optionId=${optionId}`,
          {
            method: 'DELETE',
          }
        );

        if (response.ok) {
          onVote?.();
        } else {
          // Revert optimistic update on failure
          setOptimisticVotes((prev) => {
            const next = new Map(prev);
            next.delete(optionId);
            return next;
          });
        }
      } else {
        // Cast a vote
        const response = await fetch(
          `/api/trips/${tripId}/polls/${poll.id}/vote`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ optionId }),
          }
        );

        if (response.ok) {
          onVote?.();
        } else {
          // Revert optimistic update on failure
          setOptimisticVotes((prev) => {
            const next = new Map(prev);
            next.delete(optionId);
            return next;
          });
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
      // Revert optimistic update on error
      setOptimisticVotes((prev) => {
        const next = new Map(prev);
        next.delete(optionId);
        return next;
      });
    } finally {
      setVoting(false);
    }
  };

  const handleClosePoll = async () => {
    if (closing) return;

    setClosing(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/polls`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId: poll.id }),
      });

      if (response.ok) {
        onClose?.();
      }
    } catch (error) {
      console.error('Error closing poll:', error);
    } finally {
      setClosing(false);
    }
  };

  const handleDeletePoll = async () => {
    if (deleting) return;

    if (!confirm('Are you sure you want to delete this poll? This cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/polls?pollId=${poll.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete?.();
      }
    } catch (error) {
      console.error('Error deleting poll:', error);
    } finally {
      setDeleting(false);
    }
  };

  const isActive = poll.status === 'active';

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium">{poll.question}</h4>
          <p className="text-xs text-muted-foreground">
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
            {!isActive && (
              <Badge variant="secondary" className="ml-2">
                <Lock className="w-3 h-3 mr-1" />
                Closed
              </Badge>
            )}
          </p>
        </div>
        {poll.createdById === currentUserId && (
          <div className="flex items-center gap-1">
            {isActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClosePoll}
                disabled={closing}
              >
                <X className="w-4 h-4 mr-1" />
                Close
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeletePoll}
              disabled={deleting}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {poll.options?.map((option) => {
          const voteCount = option.votes?.length || 0;
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
          const isVoted = userVotedOptionIds.has(option.id);

          return (
            <button
              key={option.id}
              onClick={() => isActive && handleVote(option.id)}
              disabled={!isActive || voting}
              className={`w-full p-3 rounded-lg border text-left transition-colors relative overflow-hidden ${
                isVoted
                  ? 'border-[#A8C5A8] bg-[#A8C5A8]/10'
                  : 'border-gray-200 hover:border-gray-300'
              } ${!isActive ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {/* Background percentage bar */}
              <div
                className="absolute inset-y-0 left-0 bg-[#A8C5A8]/20 transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isVoted && <Check className="w-4 h-4 text-[#A8C5A8]" />}
                  <span className="font-medium">{option.label}</span>
                  {option.url && (
                    <a
                      href={option.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {voteCount} ({Math.round(percentage)}%)
                  </span>
                  {/* Mini voter avatars with profile pictures */}
                  <div className="flex -space-x-1">
                    {option.votes?.slice(0, 3).map((vote) => (
                      <Avatar key={vote.id} className="h-5 w-5 border border-white" title={vote.voterName || 'Voter'}>
                        {vote.voterProfileImage && (
                          <AvatarImage src={vote.voterProfileImage} alt={vote.voterName || 'Voter'} />
                        )}
                        <AvatarFallback className="bg-[#D4A5A5] text-white text-[10px]">
                          {vote.voterName ? vote.voterName.charAt(0).toUpperCase() : '?'}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
