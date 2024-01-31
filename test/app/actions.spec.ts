import * as chaiImport from 'chai'

import { createChat } from '../../app/actions'

import { nanoid } from 'nanoid'

// TODO: If I see the following error I can `.js` to our local imports in the compiled spec files
// Error: Cannot find module '/Users/gine/workspace/sara/dist/esm/app/actions' imported from /Users/gine/workspace/sara/dist/esm/test/app/actions.spec.js
//     at finalizeResolution (/Users/gine/workspace/sara/node_modules/.pnpm/ts-node@10.9.2_@types+node@20.10.5_typescript@5.3.3/node_modules/ts-node/dist-raw/node-internal-modules-esm-resolve.js:366:11)
//     at moduleResolve (/Users/gine/workspace/sara/node_modules/.pnpm/ts-node@10.9.2_@types+node@20.10.5_typescript@5.3.3/node_modules/ts-node/dist-raw/node-internal-modules-esm-resolve.js:801:10)
//     at Object.defaultResolve (/Users/gine/workspace/sara/node_modules/.pnpm/ts-node@10.9.2_@types+node@20.10.5_typescript@5.3.3/node_modules/ts-node/dist-raw/node-internal-modules-esm-resolve.js:912:11)
//     at /Users/gine/workspace/sara/node_modules/.pnpm/ts-node@10.9.2_@types+node@20.10.5_typescript@5.3.3/node_modules/ts-node/src/esm.ts:218:35
//     at entrypointFallback (/Users/gine/workspace/sara/node_modules/.pnpm/ts-node@10.9.2_@types+node@20.10.5_typescript@5.3.3/node_modules/ts-node/src/esm.ts:168:34)
//     at /Users/gine/workspace/sara/node_modules/.pnpm/ts-node@10.9.2_@types+node@20.10.5_typescript@5.3.3/node_modules/ts-node/src/esm.ts:217:14
//     at addShortCircuitFlag (/Users/gine/workspace/sara/node_modules/.pnpm/ts-node@10.9.2_@types+node@20.10.5_typescript@5.3.3/node_modules/ts-node/src/esm.ts:409:21)
//     at resolve (/Users/gine/workspace/sara/node_modules/.pnpm/ts-node@10.9.2_@types+node@20.10.5_typescript@5.3.3/node_modules/ts-node/src/esm.ts:197:12)
//     at nextResolve (node:internal/modules/esm/hooks:833:28)
//     at Hooks.resolve (node:internal/modules/esm/hooks:278:30)

// TODO: If I see the following error I can `.js` to package imports in the compiled spec files it looks like I can do the same as above
// Error: Cannot find module '/Users/gine/workspace/sara/node_modules/next/cache' imported from /Users/gine/workspace/sara/dist/esm/app/actions.js
//     at finalizeResolution (/Users/gine/workspace/sara/node_modules/.pnpm/ts-node@10.9.2_@types+node@20.10.5_typescript@5.3.3/node_modules/ts-node/dist-raw/node-internal-modules-esm-resolve.js:366:11)
//     at moduleResolve (/Users/gine/workspace/sara/node_modules/.pnpm/ts-node@10.9.2_@types+node@20.10.5_typescript@5.3.3/node_modules/ts-node/dist-raw/node-internal-modules-esm-resolve.js:801:10)
//     at Object.defaultResolve (/Users/gine/workspace/sara/node_modules/.pnpm/ts-node@10.9.2_@types+node@20.10.5_typescript@5.3.3/node_modules/ts-node/dist-raw/node-internal-modules-esm-resolve.js:912:11)
//     at /Users/gine/workspace/sara/node_modules/.pnpm/ts-node@10.9.2_@types+node@20.10.5_typescript@5.3.3/node_modules/ts-node/src/esm.ts:218:35
//     at entrypointFallback (/Users/gine/workspace/sara/node_modules/.pnpm/ts-node@10.9.2_@types+node@20.10.5_typescript@5.3.3/node_modules/ts-node/src/esm.ts:168:34)
//     at /Users/gine/workspace/sara/node_modules/.pnpm/ts-node@10.9.2_@types+node@20.10.5_typescript@5.3.3/node_modules/ts-node/src/esm.ts:217:14
//     at addShortCircuitFlag (/Users/gine/workspace/sara/node_modules/.pnpm/ts-node@10.9.2_@types+node@20.10.5_typescript@5.3.3/node_modules/ts-node/src/esm.ts:409:21)
//     at resolve (/Users/gine/workspace/sara/node_modules/.pnpm/ts-node@10.9.2_@types+node@20.10.5_typescript@5.3.3/node_modules/ts-node/src/esm.ts:197:12)
//     at nextResolve (node:internal/modules/esm/hooks:833:28)
//     at Hooks.resolve (node:internal/modules/esm/hooks:278:30)


// TODO: If I see errors on importing our files from @ then I can give the whole path to them I believe
// import { stripUndefinedObjectProperties, tickleRepository, } from '@/lib/polyverse/backend/backend';



describe('Actions - Chat', function() {
    // TODO: Setup a before making sure we are only using test enviornment - i.e. not prod and fail if we are
    it(`Should successfully create a Chat`, async function() {
        const expectedChatID = nanoid();
        const expectedUserID = nanoid();

        // TODO: What about testing all of the other properties from route.ts
        const expectedChat = {
            id: expectedChatID,
            title: 'Some Title',
            userId: expectedUserID,
            createdAt: Date.now(),
            path: `/chat/${expectedChatID}`,
            messages: []
        }

        // TODO: This isn't the actual method signature
        // const actualChat = createChat(expectedUserID, expectedChatID, expectedChat, null)
        const actualChat = await createChat()
    })
})