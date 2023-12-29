'use client'

import { useState } from 'react'

import { Treeview } from './ui/treeview'

import { data } from './ui/treeview-data-test'

// TODO: I want to wrap this with a <div> and try to put in the following to make it fit: flex flex-col h-full
// Note that I tried this and it didn't work - made things arguably worse. Look at the elements in the developer tools
// to sus out more of what is going on

export default function TaskTree() {
    const [selected, select] = useState<string | null>(null)

    // className="w-72 h-full border-[1.5px] border-slate-200 m-4"

    // Our tree is a controlled component. We use 'value' as the selected item
    // in the tree and 'onChange' is how we select it. For more on controlled
    // components see: https://www.joshwcomeau.com/react/data-binding/
    return (
        <Treeview.Root
            value={selected}
            onChange={select}
        >
            {data.map(node => (
                <Treeview.Node node={node} key={node.id} />
            ))}
        </Treeview.Root>
    )
}