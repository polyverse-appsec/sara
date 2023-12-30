import clsx from 'clsx'
import { Dispatch, ReactNode, createContext, useContext, useReducer } from 'react'
import { IconMessage, IconUsers } from './icons'

// This was put together using this tutorial: https://www.joshuawootonn.com/react-treeview-component

// Since our tree is collapsible we need a way of storing the open/closed state
// of each node. We don't want to store state locally on each node since a
// parent node can be collapsed which would cause all of its children to become
// unmounted and we lose their states. To do this we will define types and lift
// the state to the root node for preservation.

// This type describes our state. It contains keys of node IDs to their open
// states (true/false).
export type TreeViewState = Map<string, boolean>

// These are the action types we use in our reducer. This is really a way to not
// use magic strings throughout the reducer.
export enum TreeViewActionTypes {
    OPEN = 'OPEN',
    CLOSE = 'CLOSE',
}

// This is our union type of actions that a node can take in context of our
// reducer.
export type TreeViewActions =
    | {
        type: TreeViewActionTypes.OPEN,
        id: string
    }
    | {
        type: TreeViewActionTypes.CLOSE,
        id: string
    }

// This reducer updates our trees state based on the actions taken
export function treeviewReducer(
    state: TreeViewState,
    action: TreeViewActions
): TreeViewState {
    switch (action.type) {
        case TreeViewActionTypes.OPEN:
            return new Map(state).set(action.id, true)
        case TreeViewActionTypes.CLOSE:
            return new Map(state).set(action.id, false)
        default:
            throw new Error('Tree reducer received an unknown action')
    }
}

// Defined type for the type of Context our root node will pass to its children
export type TreeViewContextType = {
    open: TreeViewState,
    dispatch: Dispatch<TreeViewActions>,
    selectedID: string | null,
    selectID: (id: string) => void
}

// Create a React Context - Typically info is passed to child components from
// their parent component via props passed to them. But this can at times become
// cumbersome if having to pass info deep down a tree. Using a Context a parent
// component can make info available to any element within its tree no matter
// how deep.
export const TreeViewContext = createContext<TreeViewContextType>({
    open: new Map<string, boolean>(),
    dispatch: () => {},
    selectedID: null,
    selectID: () => {}
})

type RootProps = {
    children: ReactNode | ReactNode[]
    className?: string
    value: string | null
    onChange: (id: string) => void
}

export function Root({ children, className, value, onChange }: RootProps) {
    const [open, dispatch] = useReducer(treeviewReducer, new Map<string, boolean>())

    // 'clsx' is an alternative to 'classNames' and is useful for deriving a
    // list of classes from state
    //
    // 'overflow-auto' ensures that when this component has static widths it
    // overflows nicely

    // In the root node we wrap our child nodes with our 'TreeViewContext' so
    // that they may get access to the information anywhere in the tree.
    return (
        <TreeViewContext.Provider
            value={{
                open,
                dispatch,
                selectedID: value,
                selectID: onChange
            }}
        >
            <ul className={clsx('flex flex-col overflow-auto', className)}>
                {children}
            </ul>
        </TreeViewContext.Provider>
    )
}

// Each node in a treeview can have 'n' number of descendants, which means our
// data structure will be an n-ary tree. Use a recursive type in TypeScript to
// define this type.
//
// 
export type TreeNodeType = {
    id: string
    content: string
    children?: TreeNodeType[]
    icon?: ReactNode
}

type NodeProps = {
    node: TreeNodeType
}

type IconProps = { open?: boolean, className?: string }

export function Arrow({ open, className }: IconProps) {
    // Set 'origin-center' so that rotation revolves around the center instead
    // of top left
    //
    // Set 'stroke="currentColor"' so that our icon will inherit its color from
    // the surrounding text
    //
    // Rotate the icon ('rotate-$$$') based on whether the node is open or not
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={clsx(
                'origin-center',
                open ? 'rotate-90' : 'rotate-0',
                className,
            )}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
        </svg>
    )
}

// TODO: Start here on understanding this work: https://www.joshuawootonn.com/react-treeview-component#why-do-we-use-value-and-onchange
// I was able to get the tree to fit nicely last night after moving some <div> with className props around

export const Node = function TreeNode({
    node: { id, content, children }
}: NodeProps) {
    // Use the 'TreeViewContext' so we can consume open state
    const { open, dispatch, selectedID, selectID } = useContext(TreeViewContext)
    const isOpen = open.get(id)

    // TODO: Had to cut some the icon as I couldn't get it to work
    // <div className="absolute left-2 top-1 flex h-6 w-6 items-center justify-center"><IconMessage className="mr-2" /></div>

    // TODO: Look into changing the fonts being rendered in the 'className'

    // Render the current nodes name and recursively render descendant nodes
    // within a '<ul>'. We render a hierarchical structure by using padding on
    // our '<ul>'. For more info in Tailwind padding see:
    // https://tailwindcss.com/docs/padding
    //
    // We use 'flex flex-col' to remove the default bullet on our '<li>'
    // elements.
    //
    // To nicely handle text overflow with an ellipsis we use 'text-ellipsis
    // whitespace-nowrap overflow-hidden'.
    // 
    // Finally to indicate interactivity and prevent text selection 'onClick' we
    // use 'cursor-pointer select-none'
    //
    // We can add the following styling to help place content in a row and add
    // spacing: 'flex items-center space-x-2'
    //
    // We wrap '{name}' in a <span> so that overflow has ellipses
    //
    // Use 'shring-0' with our arrow to prevent it from shrinking in the case of
    // text overflow
    return (
        <div>
            <div className="relative h-8">
                <li className="flex flex-col cursor-pointer select-none">
                    <div
                        className={clsx(
                            'flex items-center space-x-2 rounded-sm px-1',
                            selectedID === id ? 'bg-slate-700' : 'bg-transparent'
                        )}
                        onClick={() => {
                            // Search all of the tree state - represented by 'open' -
                            // for the node ID and if it is already open then dispatch
                            // an action to close it. Otherwise open it.
                            isOpen
                                ? dispatch({
                                    id, type: TreeViewActionTypes.CLOSE
                                })
                                : dispatch({
                                    id, type: TreeViewActionTypes.OPEN
                                })
                            selectID(id)
                        }}
                    >
                        {children?.length ? (
                            <Arrow className="h-4 w-4 shrink-0" open={isOpen} />
                        ) : (
                            <span className="h-4 w-4 shrink-0" />
                        )}
                        <span className="text-ellipsis whitespace-nowrap overflow-hidden">{content}</span>
                    </div>
                    {
                    // Conditionally render based on if the parent is open
                    children?.length && open.get(id) && (
                        <ul className="pl-4">
                            {children.map(node => (
                                <Node node={node} key={node.id} />
                            ))}
                        </ul>
                    )}
                </li>
            </div>
        </div>
    )
}

export const Treeview = { Root, Node }