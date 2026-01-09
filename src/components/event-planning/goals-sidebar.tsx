'use client';

import { Card } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { Check, Circle, Clock, Calendar, Sparkles, Users } from 'lucide-react';

interface GoalProgress {
  id: string;
  eventPlanId: string;
  goalType: string;
  status: string;
  completedAt: Date | null;
}

interface Collaborator {
  id: string;
  friendName: string;
  profileImage: string | null;
  linkedUserId: string | null;
  role: string;
}

interface GoalsSidebarProps {
  goalProgress: GoalProgress[];
  collaborators: Collaborator[];
  onGoalClick: (goalType: string) => void;
}

const goalConfig: Record<string, { icon: any; label: string }> = {
  date: { icon: Calendar, label: 'Event Date' },
  event: { icon: Sparkles, label: 'Event Selection' },
};

export function GoalsSidebar({
  goalProgress,
  collaborators,
  onGoalClick,
}: GoalsSidebarProps) {
  const completedCount = goalProgress.filter((g) => g.status === 'completed').length;
  const progressPercent = goalProgress.length > 0 ? (completedCount / goalProgress.length) * 100 : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Circle className="w-4 h-4 text-gray-300" />;
    }
  };

  return (
    <Card className="p-4 sticky top-20">
      <h3 className="font-semibold text-sm text-muted-foreground mb-3">
        PLANNING PROGRESS
      </h3>

      {/* Progress bar */}
      <div className="mb-4">
        <Progress value={progressPercent} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">
          {completedCount} of {goalProgress.length} completed
        </p>
      </div>

      {/* Goals checklist */}
      <div className="space-y-2 mb-6">
        {goalProgress.map((goal) => {
          const config = goalConfig[goal.goalType] || {
            icon: Circle,
            label: goal.goalType,
          };
          const Icon = config.icon;

          return (
            <button
              key={goal.id}
              onClick={() => onGoalClick(goal.goalType)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                goal.status === 'completed'
                  ? 'bg-green-50 hover:bg-green-100'
                  : goal.status === 'in_progress'
                  ? 'bg-yellow-50 hover:bg-yellow-100'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  goal.status === 'completed'
                    ? 'bg-green-100'
                    : goal.status === 'in_progress'
                    ? 'bg-yellow-100'
                    : 'bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="flex-1 text-sm font-medium">{config.label}</span>
              {getStatusIcon(goal.status)}
            </button>
          );
        })}
      </div>

      {/* Collaborators */}
      <div className="border-t pt-4">
        <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          COLLABORATORS
        </h3>
        <div className="space-y-2">
          {collaborators.map((collab) => (
            <div key={collab.id} className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={collab.profileImage || undefined} />
                <AvatarFallback className="bg-[#D4A5A5] text-white text-xs">
                  {collab.friendName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{collab.friendName}</p>
                {collab.linkedUserId && (
                  <p className="text-xs text-muted-foreground">Amika user</p>
                )}
              </div>
              {collab.role === 'owner' && (
                <span className="text-xs text-muted-foreground">
                  (Event Organizer)
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
