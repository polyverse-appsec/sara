import { getChats } from "@/app/actions"

import TaskTree from "./task-tree"

// TODO: Comments
type TaskDataLoaderProps = {
    userId: string
}

// TODO: Start here - I got the task titles rendered but now I need to make it so if I click on any of them I can navigate to the past threads

// TODO: Comments
export default async function TaskDataLoader({ userId }: TaskDataLoaderProps) {
    console.log(`In <TaskDataLoader>`)
    // TODO: This pattern was originally implemented in <SidebarList> and used React 'cache()' - Do I want to as well?
    // See: https://react.dev/reference/react/cache#usage

    // TODO: Discuss how tasks is really a chat
    const tasks = await getChats(userId)

    // TODO: Uncomment the ThemeToggle and ClearHistory

    // TODO: What was originally rendered was <SidebarItems>

    // TODO: If this renders do I want all of this <div className> shit?

    // If the user hasn't provided any of their tasks yet then state that
    // otherwise render the task tree.
    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
                {tasks?.length ? (
                    <div className="space-y-2 px-2">
                        <TaskTree tasks={tasks} />
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <p className="text-sm text-muted-foreground">No task history</p>
                    </div>
                )}
            </div>
            {/*<div className="flex items-center justify-between p-4">
                <ThemeToggle />
                <ClearHistory clearChats={clearChats} isEnabled={chats?.length > 0} />
            </div>*/}
        </div>
    )
}