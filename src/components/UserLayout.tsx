import { ReactNode } from 'react';
import UserSidebar from './UserSidebar';

interface UserLayoutProps {
  children: ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <UserSidebar />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
