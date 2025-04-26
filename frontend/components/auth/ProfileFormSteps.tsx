"use client";

import React from "react";
import { Button } from "@/components/common/button";
import { InteractiveHoverButton } from "@/components/common/interactive-hover-button";
import { Input } from "@/components/common/input";
import { Label } from "@/components/common/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/common/card";
import { Textarea } from "@/components/common/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/select";
import { isValidGitHubUrl } from "@/lib/utils/commonUtils";
import { Player } from "@/lib/utils/interfaces";

interface ProfileFormStepsProps {
  step: 1 | 2;
  formData: Partial<Player>;
  error: string;
  isLoading: boolean;
  onChange: (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => void;
  onMentorChange: (value: string) => void;
  onBack: () => void;
  onNext?: () => void;
  onSubmit?: (e: React.FormEvent) => Promise<void>;
  submitButtonText?: string;
}

const ProfileFormSteps = ({
  step,
  formData,
  error,
  isLoading,
  onChange,
  onMentorChange,
  onBack,
  onNext,
  onSubmit,
  submitButtonText = "Submit Profile",
}: ProfileFormStepsProps) => {
  const mentorString = process.env.NEXT_PUBLIC_MENTORS || "";
  const mentorOptions = mentorString
    .split(",")
    .map((mentor) => mentor.trim())
    .filter((mentor) => mentor);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Complete Your Profile ({step}/2)
        </CardTitle>
        <p className="text-sm text-muted-foreground text-center pt-2">
          {step === 1
            ? "Tell us about your aspirations and challenges."
            : "A few more details to understand you better."}
        </p>
      </CardHeader>
      <>
        <CardContent>
          {error && (
            <p className="text-sm text-destructive text-center mb-4">{error}</p>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_problems">Current Problems</Label>
                <Textarea
                  id="current_problems"
                  placeholder="Describe the main challenges you are facing right now."
                  value={formData.current_problems || ""}
                  onChange={onChange}
                  required
                  className="text-foreground"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ideal_future">Ideal Future</Label>
                <Textarea
                  id="ideal_future"
                  placeholder="Describe what your perfect future looks like."
                  value={formData.ideal_future || ""}
                  onChange={onChange}
                  required
                  className="text-foreground"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="biggest_fears">Biggest Fears</Label>
                <Textarea
                  id="biggest_fears"
                  placeholder="What are the things that scare you the most?"
                  value={formData.biggest_fears || ""}
                  onChange={onChange}
                  required
                  className="text-foreground"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="past_issues">Any Past Issues (Optional)</Label>
                <Textarea
                  id="past_issues"
                  placeholder="Optionally, describe any past events or issues that still affect you."
                  value={formData.past_issues || ""}
                  onChange={onChange}
                  className="text-foreground"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="obsidian_notes">
                  Obsidian Notes (GitHub Link - Optional)
                </Label>
                <Input
                  id="obsidian_notes"
                  type="url"
                  placeholder="https://github.com/your-username/your-repo"
                  value={formData.obsidian_notes || ""}
                  onChange={onChange}
                  className="text-foreground"
                  disabled={isLoading}
                />
                {formData.obsidian_notes &&
                  !isValidGitHubUrl(formData.obsidian_notes) && (
                    <p className="text-xs text-destructive">
                      Invalid GitHub URL format.
                    </p>
                  )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mentor">Choose a Mentor</Label>
                <Select
                  value={formData.mentor || ""}
                  onValueChange={onMentorChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="mentor">
                    <SelectValue placeholder="Select a mentor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentorOptions.length > 0 ? (
                      mentorOptions.map((mentor) => (
                        <SelectItem key={mentor} value={mentor}>
                          {mentor}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No mentors configured
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
          >
            Back
          </Button>
          {step === 1 && onNext && (
            <Button type="button" onClick={onNext} disabled={isLoading}>
              Next
            </Button>
          )}
          {step === 2 && onSubmit && (
            <InteractiveHoverButton
              type="button"
              onClick={onSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : submitButtonText}
            </InteractiveHoverButton>
          )}
        </CardFooter>
      </>
    </Card>
  );
};

export default ProfileFormSteps;
