
"use client";

import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { parseSrt, compileSrt, shiftSrtTime, redistributeSrt } from "@/lib/srt-utils";
import { Clock, TextCursorInput, Undo2, Plus, Minus, Pilcrow } from "lucide-react";

interface SrtAdjusterProps {
  originalSrt: string;
  currentSrt: string;
  onSrtChange: (newSrt: string) => void;
}

export function SrtAdjuster({ originalSrt, currentSrt, onSrtChange }: SrtAdjusterProps) {
  const [timeShift, setTimeShift] = useState("0");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [wordsPerCue, setWordsPerCue] = useState("5");
  const { toast } = useToast();

  const applyTimeShift = (shiftDirection: 'add' | 'subtract') => {
    const shiftInMs = Math.abs(parseFloat(timeShift));
    if (isNaN(shiftInMs)) {
      toast({ variant: "destructive", title: "Invalid time shift", description: "Please enter a valid number for milliseconds." });
      return;
    }

    const shiftInSeconds = shiftDirection === 'add' ? shiftInMs / 1000 : -shiftInMs / 1000;
    const directionText = shiftDirection === 'add' ? 'Added' : 'Subtracted';

    try {
      const parsedSrt = parseSrt(currentSrt);
      const shiftedSrt = parsedSrt.map(cue => shiftSrtTime(cue, shiftInSeconds));
      const newSrtContent = compileSrt(shiftedSrt);
      onSrtChange(newSrtContent);
      toast({ title: "Success", description: `${directionText} ${shiftInMs} milliseconds.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error processing SRT", description: "Please check the SRT format." });
      console.error(error);
    }
  };

  const handleReset = () => {
    onSrtChange(originalSrt);
    setTimeShift("0");
    setFindText("");
    setReplaceText("");
    setWordsPerCue("5");
    toast({ title: "SRT Resetted", description: "SRT content has been reset to its original state." });
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
  
  const handleRedistribute = () => {
    const words = parseInt(wordsPerCue, 10);
    if (isNaN(words) || words <= 0) {
      toast({ variant: "destructive", title: "Invalid word count", description: "Please enter a positive number for words per cue." });
      return;
    }

    try {
      const newSrtContent = redistributeSrt(currentSrt, words);
      onSrtChange(newSrtContent);
      toast({ title: "Success", description: `SRT has been redistributed to a max of ${words} words per cue.` });
    } catch (error) {
        toast({ variant: "destructive", title: "Error processing SRT", description: "Could not redistribute SRT. Check format and content." });
        console.error(error);
    }
  };


  return (
    <Card className="border-border bg-muted/20">
      <CardHeader>
        <CardTitle className="text-lg">SRT Adjuster</CardTitle>
        <CardDescription>Adjust timings, text, and structure for the SRT content.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
            <Label htmlFor="time-shift" className="flex items-center"><Clock className="mr-2 h-4 w-4"/>Time Shift (milliseconds)</Label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Input
                    id="time-shift"
                    type="number"
                    value={timeShift}
                    onChange={(e) => setTimeShift(e.target.value)}
                    placeholder="e.g., 500"
                    className="flex-grow"
                />
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                    <Button type="button" onClick={() => applyTimeShift('add')} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4"/>Add</Button>
                    <Button type="button" onClick={() => applyTimeShift('subtract')} className="w-full sm:w-auto"><Minus className="mr-2 h-4 w-4"/>Subtract</Button>
                </div>
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

        <div className="space-y-3">
            <Label htmlFor="words-per-cue" className="flex items-center"><Pilcrow className="mr-2 h-4 w-4"/>Max Words per Cue</Label>
            <div className="flex items-center gap-2">
                <Input
                    id="words-per-cue"
                    type="number"
                    value={wordsPerCue}
                    onChange={(e) => setWordsPerCue(e.target.value)}
                    placeholder="e.g., 5"
                />
                <Button type="button" onClick={handleRedistribute} className="w-full sm:w-auto">Apply</Button>
            </div>
        </div>
        
        <Button type="button" variant="outline" onClick={handleReset} className="w-full"><Undo2 className="mr-2 h-4 w-4"/>Reset All Adjustments</Button>
      </CardContent>
    </Card>
  );
}
