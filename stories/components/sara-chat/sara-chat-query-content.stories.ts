import type { Meta, StoryObj } from '@storybook/react'

import SaraChatQueryContent from 'components/sara-chat/sara-chat-query-content'

const meta = {
    title: 'SaraChatQueryComponent',
    component: SaraChatQueryContent,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
} satisfies Meta<typeof SaraChatQueryContent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        content: 'Some content',
        contentType: 'QUERY',
    }
}