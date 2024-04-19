import type { Meta, StoryObj } from '@storybook/react'

import ChatQuery from 'components/chat/chat-query'

const meta = {
    title: 'ChatQuery',
    component: ChatQuery,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
} satisfies Meta<typeof ChatQuery>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    // args: {
    //     content: 'Some content',
    //     contentType: ChatContentTypeQuery,
    //     timestamp: new Date(),
    //     shouldRenderLoadingSpinner: true,
    // }
}