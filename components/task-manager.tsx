import { Suspense } from "react"

type TaskManagerProps = {
    userId: string
}

// TODO: I think I want a component that is called <TaskDataLoader> that actually does the loading of the data and passes it to <TaskTree> 
// and then <TaskManger> suspends the <TaskDataLoader>. That or I use this and suspend it in <SidebarDesktop>. Maybe dont suspend it in <SidebarDesktop>
// and leave that alone since it came from the original project we forked from and I wnat to use as much of that as a reference as possible.


// TODO: Comments
export default async function TaskManager({ userId }: TaskManagerProps) {
    // TODO: Provide some fallback
    // TODO: Need to 
    return (
        <Suspense>

        </Suspense>
    )
}