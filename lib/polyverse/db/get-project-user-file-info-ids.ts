import { kv } from '@vercel/kv'

import { projectUserFileInfoIdsSetKey } from "./keys"

const TEN_MINS_IN_MILLIS = 600000

export const getProjectUserFileInfoIds = async (projectName: string, userId: string): Promise<string[]> => {
    // @ts-ignore: Argument of type 'TemplateStringsArray' is not assignable to parameter of type 'string[]'.
    // Ignoring template strings shenanigans: https://github.com/microsoft/TypeScript/issues/33304
    const fileInfoIdsSetKey = projectUserFileInfoIdsSetKey`${projectName}${userId}`

    const dateScoreInMillis = Date.now() + TEN_MINS_IN_MILLIS
    // The original implementation of this based on
    // https://github.com/vercel/ai-chatbot had a call of `zrange` with the
    // `rev` option set to true and the indexes of (0, -1). For some reason
    // this wouldn't return results for us. I believe that it may have to be
    // with the score we assign which is millis since epoch. Something to look
    // into in the future.
    //
    // Either way we don't reverse anymore and we query for all elements of the
    // `task:chats:{taskId}` and we do a reverse of the results ourselves. This
    // ought to return similar results as if we used the `rev` option with the
    // indexes of (0, -1) since it is unlikely there will be collisions of the
    // scores since we are in milliseconds.
    //
    // Note this depends on NTP being correctly configured on the host as well.
    return kv.zrange(fileInfoIdsSetKey, 0, dateScoreInMillis)
}