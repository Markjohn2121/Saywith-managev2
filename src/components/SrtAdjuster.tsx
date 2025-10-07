
"use client";

import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { parseSrt, compileSrt, shiftSrtTime } from "@/lib/srt-utils";
import { Clock, TextCursorInput, Undo2 } from "lucide-react";

interface SrtAdjusterProps {
  originalSrt: string;
  currentSrt: string;
  onSrtChange: (newSrt: string) => void;
}

export function SrtAdjuster({ originalSrt, currentSrt, onSrtChange }: SrtAdjusterProps) {
  const [timeShift, setTimeShift] = useState("0");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const { toast } = useToast();

  const handleTimeShift = () => {
    const shift = parseFloat(timeShift);
    if (isNaN(shift)) {
      toast({ variant: "destructive", title: "Invalid time shift", description: "Please enter a valid number." });
      return;
    }
    try {
      const parsedSrt = parseSrt(currentSrt);
      const shiftedSrt = parsedSrt.map(cue => shiftSrtTime(cue, shift));
      const newSrtContent = compileSrt(shiftedSrt);
      onSrtChange(newSrtContent);
      toast({ title: "Success", description: `SRT time shifted by ${shift} seconds.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error processing SRT", description: "Please check the SRT format." });
      console.error(error);
    }
  };

  const handleReset = () => {
    onSrtChange(originalSrt);
    setTimeShift("0");
    toast({ title: "SRT Resetted", description: "SRT timings have been reset to their original values." });
  };
  
  const handleFindAndReplace = () => {
    if (!findText) {
      toast({ variant: "destructive", title: "Find text is empty", description: "Please enter text to find." });
      return;
    }
    const newSrtContent = currentSrt.replace(new RegExp(findText, 'g'), replaceText);
    onSrtChange(newSrtContent);
    toast({ title: "Success", description: "Text has been replaced." });
  };


  return (
    <Card className="border-border bg-muted/20">
      <CardHeader>
        <CardTitle className="text-lg">SRT Adjuster</CardTitle>
        <CardDescription>Adjust timings and text for the SRT content.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
            <Label htmlFor="time-shift" className="flex items-center"><Clock className="mr-2 h-4 w-4"/>Time Shift (seconds)</Label>
            <div className="flex items-center gap-2">
                <Input
                    id="time-shift"
                    type="number"
                    step="0.1"
                    value={timeShift}
                    onChange={(e) => setTimeShift(e.target.value)}
                    placeholder="e.g., 1.5 or -2.0"
                />
                <Button type="button" onClick={handleTimeShift}>Apply</Button>
                <Button type="button" variant="outline" onClick={handleReset}><Undo2 className="mr-2 h-4 w-4"/>Reset</Button>
            </div>
        </div>

        <div className="space-y-3">
            <Label htmlFor="find-text" className="flex items-center"><TextCursorInput className="mr-2 h-4 w-4"/>Find and Replace</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                    id="find-text"
                    value={findText}
                    onChange={(e) => setFindText(e.target.value)}
                    placeholder="Find text"
                />
                <Input
                    id="replace-text"
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    placeholder="Replace with"
                />
            </div>
             <Button type="button" onClick={handleFindAndReplace} className="w-full">Apply Replacement</Button>
        </div>
      </CardContent>
    </Card>
  );
}
