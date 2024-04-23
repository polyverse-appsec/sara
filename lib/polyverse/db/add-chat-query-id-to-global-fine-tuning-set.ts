import { kv } from '@vercel/kv'

import { FineTuningTags } from '../../data-model-types'
import { globalFineTuningTagFavoriteChatQueryIdsSetKey, globalFineTuningTagInsightfulChatQueryIdsSetKey, globalFineTuningTagProductiveChatQueryIdsSetKey, globalFineTuningTagUnhelpfulChatQueryIdsSetKey, globalUserEmailsSetKey, userKey } from './keys'

const fineTuningSetKeysByFineTuningTags: Record<FineTuningTags, string> = {
    'FAVORITE': globalFineTuningTagFavoriteChatQueryIdsSetKey(),
    'INSIGHTFUL': globalFineTuningTagInsightfulChatQueryIdsSetKey(),
    'PRODUCTIVE': globalFineTuningTagProductiveChatQueryIdsSetKey(),
    'UNHELPFUL': globalFineTuningTagUnhelpfulChatQueryIdsSetKey()
}

const addChatQueryIdToGlobalFineTuningSet = async (fineTuningTag: FineTuningTags, chatQueryId: string): Promise<void> => {
    const setKey = fineTuningSetKeysByFineTuningTags[fineTuningTag]

    await kv.sadd(setKey, chatQueryId)
}

export default addChatQueryIdToGlobalFineTuningSet
