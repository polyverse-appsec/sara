import { clearChats, getChats } from "@/app/actions"

import TaskTree from "./task-tree"

import Link from "next/link"

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

import { IconPlus } from '@/components/ui/icons'

import { ThemeToggle } from '@/components/theme-toggle'
import { ClearHistory } from '@/components/clear-history'


// TODO: Comments
type TaskDataLoaderProps = {
    userId: string
}

// TODO: Start here - I got the task titles rendered but now I need to make it so if I click on any of them I can navigate to the past threads

// TODO: Comments
export default async function TaskDataLoader({ userId }: TaskDataLoaderProps) {
    // TODO: This pattern was originally implemented in <SidebarList> and used React 'cache()' - Do I want to as well?
    // See: https://react.dev/reference/react/cache#usage

    console.log(`<TaskDataLoader> render before getChats`)

    // TODO: Discuss how tasks is really a chat
    const tasks = await getChats(userId)
    console.log(`<TaskDataLoader> render after getChats`)
    console.log(`TaskDataLoader fetched tasks length: ${JSON.stringify(tasks?.length)}`)

    // TODO: Uncomment the ThemeToggle and ClearHistory

    // If the user hasn't provided any of their tasks yet then state that
    // otherwise render the task tree.
    return (
        <div className="flex flex-col h-full">
            <div className="px-2 my-4">
                <Link
                    href="/"
                    className={cn(
                        buttonVariants({ variant: 'outline' }),
                        'h-10 w-full justify-start bg-zinc-50 px-4 shadow-none transition-colors hover:bg-zinc-200/40 dark:bg-zinc-900 dark:hover:bg-zinc-300/10'
                    )}
                >
                    <IconPlus className="-translate-x-2 stroke-2" />
                    New Chat
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