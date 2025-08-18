
"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateForm } from "@/components/CreateForm";
import { EditForm } from "@/components/EditForm";
import { SayWithLogo } from "@/components/SayWithLogo";
import { LockScreen } from "@/components/LockScreen";
import { FilePlus2, Edit, Settings, Server, Database, Cloud } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';

export type StorageProvider = "firebase" | "github" | "r2";

export default function Home() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [storageProvider, setStorageProvider] = useState<StorageProvider>("firebase");

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }

    const savedProvider = localStorage.getItem("storageProvider") as StorageProvider;
    if (savedProvider && ["firebase", "github", "r2"].includes(savedProvider)) {
      setStorageProvider(savedProvider);
    }
  }, []);

  const handleProviderChange = (provider: string) => {
    if (provider === "firebase" || provider === "github" || provider === "r2") {
        const newProvider = provider as StorageProvider;
        setStorageProvider(newProvider);
        localStorage.setItem("storageProvider", newProvider);
    }
  };
  
  if (!isUnlocked) {
    return <LockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background text-foreground">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center justify-start p-4 md:p-8">
        <header className="w-full mb-8 text-center relative">
            <SayWithLogo className="h-12 w-auto mx-auto mb-2" />
            <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-primary">
                Media Manager
            </h1>
            <p className="text-muted-foreground mt-2">Create, manage, and edit your media content with ease.</p>
            <div className="absolute top-0 right-0">
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Storage Provider</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={storageProvider} onValueChange={handleProviderChange}>
                    <DropdownMenuRadioItem value="firebase">
                      <Database className="mr-2 h-4 w-4" />
                      <span>Firebase Storage</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="github">
                      <Server className="mr-2 h-4 w-4" />
                      <span>GitHub Storage</span>
                    </DropdownMenuRadioItem>
                     <DropdownMenuRadioItem value="r2">
                      <Cloud className="mr-2 h-4 w-4" />
                      <span>R2 Storage</span>
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
        </header>
        
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="create">
              <FilePlus2 className="mr-2 h-4 w-4" />
              Create New
            </TabsTrigger>
            <TabsTrigger value="edit">
              <Edit className="mr-2 h-4 w-4" />
              Edit Existing
            </TabsTrigger>
          </TabsList>
          <TabsContent value="create" className="mt-6">
            <CreateForm storageProvider={storageProvider} />
          </TabsContent>
          <TabsContent value="edit" className="mt-6">
            <EditForm />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="w-full text-center p-4 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} SayWith Manager. All rights reserved.
      </footer>
    </div>
  );
}
