
'use client'
import { clearChats, getChats } from "@/app/actions"

import TaskTree from "./task-tree"

import Link from "next/link"

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

import { IconPlus } from '@/components/ui/icons'

import { ThemeToggle } from '@/components/theme-toggle'
import { ClearHistory } from '@/components/clear-history'
import { useAppContext } from '@/lib/hooks/app-context';
import { Task, Chat } from '@/lib/types';
import { use, useState, useEffect} from "react"


type TaskDataLoaderProps = {
    userId: string
}

export  function TaskDataLoader({ userId }: TaskDataLoaderProps) {
    //const tasks = await getChats(userId)
    const [tasks , setTasks] = useState<Task[]>([]);
   
    // BUGBUG: this is not working.  for some reason TaskDataLoader is running on the server side
    const { selectedRepository } = useAppContext();
    
    //TODO this is temporary until we hook into the real task db
    function convertChatToTask(chat: Chat): Task {
        return {
            id: chat.id,
            title: chat.title,
            description: chat.title,
            createdAt: chat.createdAt,
            userId: chat.userId,
            repositoryId: "temporary repository id"
        }
    }
    function fetchTasks() {
        console.log('Fetching tasks')
        getChats(userId).then(data => {
          if (Array.isArray(data)) {
            const tempTasks = data.map(convertChatToTask)
            console.log(tempTasks)
            setTasks(data.map(convertChatToTask));
          } else {
            console.error('Error fetching tasks:', data);
          }
        }).catch(error => {
          console.error('Error fetching tasks:', error);
        });
      }
    useEffect(() => {
        fetchTasks();
    })
    // If the user hasn't provided any of their tasks yet then state that
    // otherwise render the task tree.
    return (
        <div className="flex flex-col h-full">
            <h1 className="px-4 py-2 text-xl font-bold text-center text-muted-foreground">
                Tasks for {selectedRepository?.name ?? 'Selected Repository'}
            </h1>
            <div className="px-2 my-4">
                <Link
                    href="/"
                    className={cn(
                        buttonVariants({ variant: 'outline' }),
                        'h-10 w-full justify-start bg-zinc-50 px-4 shadow-none transition-colors hover:bg-zinc-200/40 dark:bg-zinc-900 dark:hover:bg-zinc-300/10'
                    )}
                >
                    <IconPlus className="-translate-x-2 stroke-2" />
                    New Task
                </Link>
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-auto">
                    {
                        tasks?.length ? (
                        <div className="space-y-2 px-2">
                            <TaskTree tasks={tasks} />
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-sm text-muted-foreground">No task history</p>
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-between p-4">
                    <ThemeToggle />
                    <ClearHistory clearChats={clearChats} isEnabled={tasks?.length > 0} />
                </div>
            </div>
        </div>
    )
}