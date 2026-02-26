import { ReactNode } from 'react';
import AstrologerSidebar from './AstrologerSidebar';

interface AstrologerLayoutProps {
  children: ReactNode;
}

export default function AstrologerLayout({ children }: AstrologerLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <AstrologerSidebar />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
