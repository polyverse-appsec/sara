import { kv } from '@vercel/kv'

import { FineTuningTags } from '../../data-model-types'
import { globalFineTuningTagFavoriteChatQueryIdsSetKey, globalFineTuningTagInsightfulChatQueryIdsSetKey, globalFineTuningTagProductiveChatQueryIdsSetKey, globalFineTuningTagUnhelpfulChatQueryIdsSetKey, globalUserEmailsSetKey, relatedFavoriteChatQueriesToUserEmailsSetKey, relatedInsightfulChatQueriesToUserEmailsSetKey, relatedProductiveChatQueriesToUserEmailsSetKey, relatedUnhelpfulChatQueriesToUserEmailsSetKey, userKey } from './keys'

const fineTuningSetKeysByFineTuningTags: Record<FineTuningTags, string> = {
    'FAVORITE': globalFineTuningTagFavoriteChatQueryIdsSetKey(),
    'INSIGHTFUL': globalFineTuningTagInsightfulChatQueryIdsSetKey(),
    'PRODUCTIVE': globalFineTuningTagProductiveChatQueryIdsSetKey(),
    'UNHELPFUL': globalFineTuningTagUnhelpfulChatQueryIdsSetKey()
}

const removeFineTuningTagToChatQuery = async (fineTuningTag: FineTuningTags, chatQueryId: string, email: string): Promise<void> => {
    const globalSetKey = fineTuningSetKeysByFineTuningTags[fineTuningTag]
    let userSetKey = null

    if (fineTuningTag === 'FAVORITE') {
        userSetKey = relatedFavoriteChatQueriesToUserEmailsSetKey(email)
    } else if (fineTuningTag === 'INSIGHTFUL') {
        userSetKey = relatedInsightfulChatQueriesToUserEmailsSetKey(email)
    } else if (fineTuningTag === 'PRODUCTIVE') {
        userSetKey = relatedProductiveChatQueriesToUserEmailsSetKey(email)
    } else if (fineTuningTag === 'UNHELPFUL') {
        userSetKey = relatedUnhelpfulChatQueriesToUserEmailsSetKey(email)
    }

    await kv.srem(globalSetKey, chatQueryId)

    if (userSetKey) {
        await kv.srem(userSetKey, chatQueryId)
    }
}

export default removeFineTuningTagToChatQuery
