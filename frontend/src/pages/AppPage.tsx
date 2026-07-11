import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ChatPanel } from '../components/chat/ChatPanel';
import { BrandPanel } from '../components/sources/BrandPanel';
import { PostList } from '../components/sources/PostList';
import { ProfileCard } from '../components/sources/ProfileCard';
import { StudioPanel } from '../components/studio/StudioPanel';
import { getBrand, getPosts, type BrandOut, type PostOut } from '../lib/content';
import { getProfileUserId } from '../lib/storage';

export function AppPage() {
  const { token, authUserId, logout } = useAuth();
  const navigate = useNavigate();
  const [brand, setBrand] = useState<BrandOut | null>(null);
  const [posts, setPosts] = useState<PostOut[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);

  useEffect(() => {
    if (!token || !authUserId) return;

    let active = true;

    getBrand(authUserId, token)
      .then((response) => {
        if (active) setBrand(response);
      })
      .catch((error) => {
        if (!(error instanceof ApiError && error.status === 404)) {
          console.error(error);
        }
      });

    getPosts(authUserId, token)
      .then((response) => {
        if (active) setPosts(response);
      })
      .catch((error) => console.error(error));

    return () => {
      active = false;
    };
  }, [token, authUserId]);

  function handleSignOut() {
    logout();
    navigate('/login');
  }

  function handlePostSaved(post: PostOut) {
    setPosts((previous) => [post, ...previous]);
  }

  function handlePostDeleted(postId: string) {
    setPosts((previous) => previous.filter((post) => post.postId !== postId));
    setSelectedPostIds((previous) => previous.filter((selectedId) => selectedId !== postId));
  }

  function toggleSelected(postId: string) {
    setSelectedPostIds((previous) =>
      previous.includes(postId) ? previous.filter((selectedId) => selectedId !== postId) : [...previous, postId],
    );
  }

  const selectedPosts = posts.filter((post) => selectedPostIds.includes(post.postId));
  const profileUserId = getProfileUserId();

  return (
    <div className="flex h-screen flex-col bg-stone-50">
      <header className="flex h-14 items-center justify-between border-b border-stone-200 bg-white px-4">
        <span className="text-lg font-semibold text-stone-900">Hackiwha</span>
        <button onClick={handleSignOut} className="text-sm font-medium text-stone-500 hover:text-stone-900">
          Sign out
        </button>
      </header>

      <div className="grid flex-1 grid-cols-[300px_1fr_340px] overflow-hidden">
        <aside className="overflow-y-auto border-r border-stone-200 bg-white p-4">
          <ProfileCard />
          <BrandPanel brand={brand} authUserId={authUserId} token={token} onSaved={setBrand} />
          <PostList
            posts={posts}
            selectedPostIds={selectedPostIds}
            token={token}
            onToggleSelected={toggleSelected}
            onDeleted={handlePostDeleted}
          />
        </aside>

        <main className="flex flex-col overflow-hidden">
          <ChatPanel
            profileUserId={profileUserId}
            authUserId={authUserId}
            brand={brand}
            selectedPosts={selectedPosts}
            token={token}
            onPostSaved={handlePostSaved}
          />
        </main>

        <aside className="overflow-y-auto border-l border-stone-200 bg-white p-4">
          <StudioPanel
            brand={brand}
            profileUserId={profileUserId}
            authUserId={authUserId}
            selectedPosts={selectedPosts}
            token={token}
          />
        </aside>
      </div>
    </div>
  );
}
