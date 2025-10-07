
"use client";

import { useRef, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Upload, FileText, Music, Video, Image as ImageIcon } from "lucide-react";

type FileUploaderProps = {
  onFileSelect: (file: File | null) => void;
  accept: string;
  label: string;
  file: File | null;
  className?: string;
  id: string;
};

const getIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-muted-foreground" />;
    if (type.startsWith("video/")) return <Video className="h-5 w-5 text-muted-foreground" />;
    if (type.startsWith("audio/")) return <Music className="h-5 w-5 text-muted-foreground" />;
    return <FileText className="h-5 w-5 text-muted-foreground" />;
}

export function FileUploader({ onFileSelect, accept, label, file, className, id }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    onFileSelect(selectedFile || null);
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Button type="button" variant="outline" onClick={handleButtonClick} className="shrink-0">
          <Upload className="mr-2 h-4 w-4" />
          Choose File
        </Button>
        <div className="flex-1 p-2 border border-dashed border-border rounded-md min-h-[40px] flex items-center min-w-0">
            {file ? (
                <div className="flex items-center gap-2 text-sm text-foreground w-full">
                    {getIcon(file.type)}
                    <span className="truncate flex-1">{file.name}</span>
                    <span className="text-muted-foreground text-xs ml-auto whitespace-nowrap pl-2">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">No file selected</p>
            )}
        </div>
      </div>
      <Input
        id={id}
        type="file"
        ref={inputRef}
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
