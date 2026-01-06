'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { INTEREST_CATEGORIES, getInterestLabel } from '@/lib/interests';

interface InterestSelectorProps {
  selectedInterests: string[];
  onInterestsChange: (interests: string[]) => void;
  editing?: boolean;
}

export function InterestSelector({
  selectedInterests,
  onInterestsChange,
  editing = false,
}: InterestSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [tempSelectedInterests, setTempSelectedInterests] = useState<string[]>([]);

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryKey)
        ? prev.filter((key) => key !== categoryKey)
        : [...prev, categoryKey]
    );
  };

  const toggleInterest = (interestId: string) => {
    setTempSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleOpenDialog = () => {
    setTempSelectedInterests([...selectedInterests]);
    setDialogOpen(true);
  };

  const handleSave = () => {
    onInterestsChange(tempSelectedInterests);
    setDialogOpen(false);
  };

  const handleRemoveInterest = (interestId: string) => {
    onInterestsChange(selectedInterests.filter((id) => id !== interestId));
  };

  return (
    <div>
      {/* Display selected interests as badges */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedInterests.length === 0 ? (
          <span className="text-sm text-gray-500">No interests selected</span>
        ) : (
          selectedInterests.map((interestId) => (
            <span
              key={interestId}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#A8C5A8]/20 text-[#6B8E6B] border border-[#A8C5A8]/30"
            >
              {getInterestLabel(interestId)}
              {editing && (
                <button
                  type="button"
                  onClick={() => handleRemoveInterest(interestId)}
                  className="ml-1 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))
        )}
      </div>

      {/* Add interests button */}
      {editing && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpenDialog}
          className="border-[#A8C5A8]/60 text-[#A8C5A8] hover:bg-[#A8C5A8]/10"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Interests
        </Button>
      )}

      {/* Interest selection dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Interests</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-2 pr-2">
            <p className="text-sm text-gray-500 mb-4">
              Choose interests to help find activities you both enjoy.
            </p>

            <div className="space-y-2">
              {Object.entries(INTEREST_CATEGORIES).map(([categoryKey, category]) => {
                const isExpanded = expandedCategories.includes(categoryKey);
                const selectedInCategory = category.interests.filter((i) =>
                  tempSelectedInterests.includes(i.id)
                ).length;

                return (
                  <div
                    key={categoryKey}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {/* Category header */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(categoryKey)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{category.icon}</span>
                        <span className="font-medium text-gray-900">
                          {category.label}
                        </span>
                        {selectedInCategory > 0 && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-[#A8C5A8] text-white rounded-full">
                            {selectedInCategory}
                          </span>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    {/* Category interests */}
                    {isExpanded && (
                      <div className="p-3 bg-white">
                        <div className="flex flex-wrap gap-2">
                          {category.interests.map((interest) => {
                            const isSelected = tempSelectedInterests.includes(
                              interest.id
                            );
                            return (
                              <button
                                key={interest.id}
                                type="button"
                                onClick={() => toggleInterest(interest.id)}
                                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                                  isSelected
                                    ? 'bg-[#A8C5A8] text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {interest.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected count and actions */}
          <DialogFooter className="flex items-center justify-between border-t pt-4">
            <span className="text-sm text-gray-500">
              {tempSelectedInterests.length} selected
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="bg-[#A8C5A8] hover:bg-[#A8C5A8]/90 text-white"
              >
                Save Interests
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
