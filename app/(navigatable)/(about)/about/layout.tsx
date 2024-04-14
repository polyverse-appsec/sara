import React, {ReactNode} from 'react';
import { Flex } from '@radix-ui/themes';

interface LayoutProps {
  children: ReactNode;
}
const Layout = ({ children }: LayoutProps) => (
  <Flex direction="column" gap="4">
    <div>
      <main>
        {children}
      </main>
    </div>
  </Flex>
);

export default Layout;
