'use client'

import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { MemoizedReactMarkdown } from '../markdown'
import { CodeBlock } from '../ui/codeblock'

export const ChatContentTypeQuery = 'QUERY'

// p({ children }) {
//   if (contentType === ChatQueryContentTypeQuery) {
//     return <p className="mb-2 last:mb-0 font-semimedium">{children}</p>
//   } else {
//     return <p className="mb-2 last:mb-0">{children}</p>
//   }
// },

const testQueryContentWithoutCode =
  "It seems there was no match for Storybook story code within the provided source files. This implies that the existing project may not yet include any Storybook stories, or such stories were not captured in the scanned codebase.\\n\\nHowever, I can provide you with a general example of what a Storybook story code snippet looks like. It would generally follow this structure:\\n\\n\\`\\`\\`jsx\\nimport React from 'react';\\nimport { YourComponent } from './YourComponent';\\n\\n// This default export determines where your story goes in the story list\\nexport default {\\n  title: 'YourComponent',\\n  component: YourComponent,\\n};\\n\\n// Here we create a \\xe2\\x80\\x9ctemplate\\xe2\\x80\\x9d of how args map to rendering\\nconst Template = (args) => <YourComponent {...args} />;\\n\\n// Each story then reuses that template\\nexport const FirstStory = Template.bind({});\\nFirstStory.args = {\\n  /* the args you need here will depend on your component */\\n};\\n\\nexport const SecondStory = Template.bind({});\\nSecondStory.args = {\\n  /* different args for another state of your component */\\n};\\n\\`\\`\\`\\n\\nIn the above snippet:\\n\\n- The default export includes metadata about your component, such as its title (which is used to organize the stories in the Storybook navigation) and the component itself.\\n- `Template` is a functional component that takes `args` and renders your component with those `args`. This allows you to easily create different \"stories\" or states for your component just by changing the `args`.\\n- The `FirstStory` and `SecondStory` are specific instances of the `Template` that include props (`args`) to demonstrate different states or variations of your component.\\n\\nPlease note that in an actual project, you'd replace `YourComponent` with your actual component, and the `args` with the real props that your component expects.\\n\\nIf you want specifics on Storybook stories within the context of your project, we may need to search the source code for typical filenames or patterns used in Storybook configurations and story files, like `.stories.js` or `.stories.tsx`. If this is the case, please let me know, and I can perform those searches accordingly."

const testQueryContentWithCode =
  "It seems there was no match for Storybook story code within the provided source files. This implies that the existing project may not yet include any Storybook stories, or such stories were not captured in the scanned codebase.\\n\\nHowever, I can provide you with a general example of what a Storybook story code snippet looks like. It would generally follow this structure:\\n\\n\\`\\`\\`jsx\\nimport React from 'react';\\nimport { YourComponent } from './YourComponent';\\n\\n// This default export determines where your story goes in the story list\\nexport default {\\n  title: 'YourComponent',\\n  component: YourComponent,\\n};\\n\\n// Here we create a \\xe2\\x80\\x9ctemplate\\xe2\\x80\\x9d of how args map to rendering\\nconst Template = (args) => <YourComponent {...args} />;\\n\\n// Each story then reuses that template\\nexport const FirstStory = Template.bind({});\\nFirstStory.args = {\\n  /* the args you need here will depend on your component */\\n};\\n\\nexport const SecondStory = Template.bind({});\\nSecondStory.args = {\\n  /* different args for another state of your component */\\n};\\n\\`\\`\\`\\n\\nIn the above snippet:\\n\\n- The default export includes metadata about your component, such as its title (which is used to organize the stories in the Storybook navigation) and the component itself.\\n- `Template` is a functional component that takes `args` and renders your component with those `args`. This allows you to easily create different \"stories\" or states for your component just by changing the `args`.\\n- The `FirstStory` and `SecondStory` are specific instances of the `Template` that include props (`args`) to demonstrate different states or variations of your component.\\n\\nPlease note that in an actual project, you'd replace `YourComponent` with your actual component, and the `args` with the real props that your component expects.\\n\\nIf you want specifics on Storybook stories within the context of your project, we may need to search the source code for typical filenames or patterns used in Storybook configurations and story files, like `.stories.js` or `.stories.tsx`. If this is the case, please let me know, and I can perform those searches accordingly."

const ChatQueryContent = () => {
  return (
    <MemoizedReactMarkdown
      className="markdownDisplay"
      remarkPlugins={[remarkGfm, remarkMath]}
      components={{
        p({ children }) {
          return <p className="mb-2 last:mb-0">{children}</p>
        },
        code({ node, inline, className, children, ...props }) {
          if (children.length) {
            if (children[0] == '▍') {
              return (
                <span className="mt-1 cursor-default animate-pulse">▍</span>
              )
            }

            children[0] = (children[0] as string).replace('`▍`', '▍')
          }

          const match = /language-(\w+)/.exec(className || '')

          if (inline) {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          }

          return (
            <CodeBlock
              key={Math.random()}
              language={(match && match[1]) || ''}
              value={String(children).replace(/\n$/, '')}
              {...props}
            />
          )
        },
      }}
    >
      {testQueryContentWithoutCode}
    </MemoizedReactMarkdown>
  )
}

export default ChatQueryContent
