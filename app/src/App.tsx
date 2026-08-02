import { useAuth0 } from '@auth0/auth0-react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthGate from './components/AuthGate';
import Layout from './components/Layout';
import ChatView from './pages/ChatView';
import FeedView from './pages/FeedView';
import ProfileView from './pages/ProfileView';
import UserProfileView from './pages/UserProfileView';
import FriendsPage from './pages/FriendsPage';
import OnlineUsersPage from './pages/OnlineUsersPage';
import DMConversationList from './pages/DMConversationList';

function Shell() {
  return (
    <BrowserRouter>
      <AuthGate>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DMConversationList />} />
            <Route path="/channel/:channelName" element={<ChatView />} />
            <Route path="/dm/:userId" element={<ChatView />} />
            <Route path="/group/:groupId" element={<ChatView />} />
            <Route path="/feed" element={<FeedView />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/user/:userId" element={<UserProfileView />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/online" element={<OnlineUsersPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthGate>
    </BrowserRouter>
  );
}

function AppInner() {
  const { isLoading, error } = useAuth0();
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-destructive text-sm">
        Auth error: {error.message}
      </div>
    );
  }
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted text-sm">Loading…</div>;
  }
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}

export default function App() {
  return <AppInner />;
}
