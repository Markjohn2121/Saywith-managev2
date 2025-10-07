
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ref as dbRef, get, update } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import { FileUploader } from "./FileUploader";
import { Textarea } from "@/components/ui/textarea";
import templates from '@/lib/templates.json';
import type { StorageProvider } from "@/app/page";


const formSchema = z.object({
  name: z.string().optional(),
  template: z.string().optional(),
  enabled: z.boolean().optional(),
  mute: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface DbData extends FormData {
    mediaUrl: string;
    audioUrl: string;
    srtContent: string;
    name: string;
    template: string;
    enabled: boolean;
    mute: boolean;
    storageProvider: StorageProvider;
    R2mediaPath?: string;
    R2audioPath?: string;
    R2mediaEXP?: string;
    R2audioEXP?: string;
    createdAt?: string;
    updatedAt?: string;
}

const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
};

const getFileExtension = (filename: string) => {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

const GITHUB_UPLOAD_URL = "https://giit-upload.onrender.com/upload";
const R2_UPLOAD_URL = "https://cloud-flare-r2-uploader.onrender.com/upload";

export function EditForm() {
  const [id, setId] = useState("");
  const [loadedData, setLoadedData] = useState<DbData | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [srtContent, setSrtContent] = useState("");
  const [manualTemplate, setManualTemplate] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", template: "", enabled: false, mute: false },
  });

  useEffect(() => {
    if (loadedData) {
      form.reset({
        name: loadedData.name,
        template: loadedData.template,
        enabled: loadedData.enabled,
        mute: loadedData.mute,
      });
      setSrtContent(loadedData.srtContent);
      setManualTemplate(loadedData.template || "");
    } else {
        form.reset({ name: "", template: "", enabled: false, mute: false });
        setSrtContent("");
        setManualTemplate("");
    }
  }, [loadedData, form]);

  const handleIdInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    try {
      if (value.includes('/')) {
        const parts = value.split('/');
        const extractedId = parts.filter(Boolean).pop();
        if (extractedId) {
          setId(extractedId);
          return;
        }
      }
    } catch (error) {
      // Ignore parsing errors and just set the raw value
    }
    setId(value);
  };

  const handleFetchData = async () => {
    if (!id) {
      toast({ variant: "destructive", title: "Please enter an ID." });
      return;
    }
    setIsFetching(true);
    setLoadedData(null);
    setMediaFile(null);
    setAudioFile(null);
    setSrtFile(null);
    try {
      const snapshot = await get(dbRef(db, `Saywith/${id}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        setLoadedData(data);
        toast({ title: "Success", description: "Data loaded successfully." });
      } else {
        toast({ variant: "destructive", title: "Not Found", description: "No data found for this ID." });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch data." });
    } finally {
      setIsFetching(false);
    }
  };

  const onUpdate = async (values: FormData) => {
    if (!id || !loadedData) return;
    setIsUpdating(true);

    try {
        const updates: any = {};
        
        const dirtyFields = form.formState.dirtyFields;
        const finalTemplate = manualTemplate || values.template;

        if (dirtyFields.name) updates.name = values.name;
        if (finalTemplate !== loadedData.template) updates.template = finalTemplate;
        if (dirtyFields.enabled !== undefined) updates.enabled = values.enabled;
        if (dirtyFields.mute !== undefined) updates.mute = values.mute;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        const currentStorageProvider = loadedData.storageProvider || 'firebase';

        if (currentStorageProvider === 'firebase') {
          if (mediaFile) {
              const mediaExtension = getFileExtension(mediaFile.name);
              const fileRef = storageRef(storage, `messages/${id}/media_${timestamp}.${mediaExtension}`);
              await uploadBytes(fileRef, mediaFile);
              updates.mediaUrl = await getDownloadURL(fileRef);
          }

          if (audioFile) {
              const audioExtension = getFileExtension(audioFile.name);
              const fileRef = storageRef(storage, `messages/${id}/audio_${timestamp}.${audioExtension}`);
              await uploadBytes(fileRef, audioFile);
              updates.audioUrl = await getDownloadURL(fileRef);
          }
        } else { // github or r2
            const uploadUrl = currentStorageProvider === 'github' ? GITHUB_UPLOAD_URL : R2_UPLOAD_URL;

            const formData = new FormData();
            formData.append('folder', id);
            if (mediaFile) {
              const mediaExtension = getFileExtension(mediaFile.name);
              const newMediaFile = new File([mediaFile], `media_${timestamp}.${mediaExtension}`, { type: mediaFile.type });
              formData.append('file1', newMediaFile);
            }
            if (audioFile) {
              const audioExtension = getFileExtension(audioFile.name);
              const newAudioFile = new File([audioFile], `audio_${timestamp}.${audioExtension}`, { type: audioFile.type });
              formData.append('file2', newAudioFile);
            }

            if (mediaFile || audioFile) {
                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Upload failed');
                }

                const responseData = await response.json();
                if (responseData.file1URL) updates.mediaUrl = responseData.file1URL;
                if (responseData.file2URL) updates.audioUrl = responseData.file2URL;
                if (responseData.R2mediaPath) updates.R2mediaPath = responseData.R2mediaPath;
                if (responseData.R2audioPath) updates.R2audioPath = responseData.R2audioPath;
                if (responseData.R2mediaEXP) updates.R2mediaEXP = responseData.R2mediaEXP;
                if (responseData.R2audioEXP) updates.R2audioEXP = responseData.R2audioEXP;
            }
        }
        
        let finalSrtContent = srtContent;
        if (srtFile) {
            finalSrtContent = await readFileAsText(srtFile);
        }

        if (finalSrtContent.trim() === "") {
          finalSrtContent = "1\n00:00:00,000 --> 00:00:05,000\nSayWith";
        }

        finalSrtContent = finalSrtContent.replace(/Transcribed by TurboScribe\.ai\. Go Unlimited to remove this message/g, "made by SayWith");
        if(finalSrtContent !== loadedData.srtContent) {
          updates.srtContent = finalSrtContent;
        }
        
        if (Object.keys(updates).length > 0) {
            updates.updatedAt = new Date().toISOString();
            await update(dbRef(db, `Saywith/${id}`), updates);
            toast({ title: "✅ Update Successful!", description: "Your content has been updated successfully.", className: "bg-green-500 text-white border-green-600" });
            setLoadedData(prev => prev ? {...prev, ...updates} : null);
        } else {
            toast({ title: "No Changes", description: "No changes were detected to update." });
        }

      setMediaFile(null);
      setAudioFile(null);
      setSrtFile(null);
      form.reset(form.getValues());

    } catch (error) {
      console.error("Error updating entry:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update content." });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Edit Existing Content</CardTitle>
        <CardDescription>Enter an ID to load and edit its data.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex w-full items-center space-x-2 mb-6">
          <Input type="text" placeholder="Enter Unique ID or URL" value={id} onChange={handleIdInputChange} onKeyDown={(e) => e.key === 'Enter' && handleFetchData()} />
          <Button type="button" onClick={handleFetchData} disabled={isFetching}>
            {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Load
          </Button>
        </div>

        {isFetching && <div className="text-center p-8"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>}

        {loadedData && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-6 animate-in fade-in-50">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="template"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templates.map(template => (
                              <SelectItem key={template.value} value={template.value}>
                                {template.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormItem>
                    <FormLabel>Manual Template (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Or enter a template value manually" 
                        value={manualTemplate}
                        onChange={(e) => setManualTemplate(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>
                
                <div className="space-y-4">
                  <FileUploader id="edit-media-file" label="Replace Media File" accept="image/*,video/*" file={mediaFile} onFileSelect={setMediaFile} />
                  {loadedData.mediaUrl && !mediaFile && <p className="text-sm text-muted-foreground">Current: <a href={loadedData.mediaUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">View Media</a></p>}
                  
                  <FileUploader id="edit-audio-file" label="Replace Audio File" accept="audio/mpeg" file={audioFile} onFileSelect={setAudioFile} />
                  {loadedData.audioUrl && !audioFile && <p className="text-sm text-muted-foreground">Current: <a href={loadedData.audioUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Listen to Audio</a></p>}

                  <FileUploader id="edit-srt-file" label="Replace SRT/Text File" accept=".srt,.txt" file={srtFile} onFileSelect={setSrtFile} />
                  <FormItem>
                      <FormLabel>SRT/Text Content</FormLabel>
                      <FormControl>
                          <Textarea placeholder="SRT/Text content will be displayed here." value={srtContent} onChange={(e) => setSrtContent(e.target.value)} rows={8} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Enable Status</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mute"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Mute</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={isUpdating} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Update Content
                </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}

    
