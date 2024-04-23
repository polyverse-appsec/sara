import React, { useState, useEffect } from 'react'
import { MemoizedReactMarkdown } from 'components/markdown';
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { Skeleton } from '@radix-ui/themes';

const changeLogCutoffPoint = "## Version 0.20.8: April 10th, 2024"

const ProductChangelog = () => {
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    const loadChangelog = async () => {
      const response = await fetch('/api/changelog');
      const text = await response.text()
      const versionIndex = text.indexOf(changeLogCutoffPoint)
      let rawMarkdown = text
      if (versionIndex !== -1) {
        // Truncate the text to exclude everything at and after the specified version
        rawMarkdown = text.substring(0, versionIndex);
      }
      setMarkdown(rawMarkdown);
    };

    loadChangelog()
  }, [markdown]);

  return (
    <div className="flex flex-col items-center sticky top-0 z-10 p-4 mx-5 mt-5 border-4 border-blue-500">
      <h1>Sara&apos;s History of Change</h1>
      { /* place a blue line below the title */ }
      <div className="w-full border-t rounded-xl border-blue-600 my-2"></div>
      <div/>
        <Skeleton loading={!markdown}>
          {!markdown?(<div className="italic">Sara is full of exciting changes to Boost your Productivity!</div>):
          (
            <div className="overflow-auto h-1/4" style={{ maxHeight: '30vh' }}>
              <MemoizedReactMarkdown
              className="markdownDisplay"
              remarkPlugins={[remarkGfm, remarkMath]}
              components={{
              p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>
              },
              }}
            >
              {markdown?
                markdown
                : 'Sara is full of exciting changes to Boost your Productivity!'
              }
            </MemoizedReactMarkdown>
          </div>
          )}
      </Skeleton>
    </div>
  );
};

export default ProductChangelog
