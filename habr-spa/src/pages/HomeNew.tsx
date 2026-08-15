import { useEffect, useState } from 'react';
import type { Post } from '../types/Post';
import { getAllPosts } from '../services/fiddApi';
import HeaderNew from '../components/HeaderNew';
import Sidebar from '../components/Sidebar';
import BlogRatings from '../components/BlogRatings';
import NewPostCard from '../components/NewPostCard';

const HomeNew = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    getAllPosts(10)
      .then((data) => {
        setPosts(data);
      })
      .catch((e) => {
        setError(e.message || 'Ошибка загрузки');
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredPosts = posts.filter((post) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'available') return !post.private;
    if (activeFilter === 'purchased') return post.private;
    return true;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#292B2F' }}>
      <HeaderNew />

      {/* Main Content */}
      <div className="w-full flex justify-center pt-[68px] pb-[40px]">
        <div className="w-full max-w-[1440px] px-4 flex gap-[40px]">
          {/* Left Sidebar */}
          <div className="flex-shrink-0 pt-8">
            <Sidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          </div>

          {/* Center Feed */}
          <div className="flex-1 flex flex-col gap-[40px] pt-[40px]">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <p className="text-[#71A866] font-[Encode Sans Condensed] text-[20px]">Загрузка...</p>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center py-12">
                <p className="text-[#A86667] font-[Encode Sans Condensed] text-[20px]">Ошибка: {error}</p>
              </div>
            )}

            {!loading && !error && filteredPosts.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <p className="text-[#71A866] font-[Encode Sans Condensed] text-[20px]">Нет постов</p>
              </div>
            )}

            {filteredPosts.map((post, index) => (
              <div key={post.id} className="flex justify-center">
                <NewPostCard post={post} isPrivate={index % 2 === 1} />
              </div>
            ))}
          </div>

          {/* Right Sidebar */}
          <div className="flex-shrink-0 pt-[40px]">
            <BlogRatings />
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <div className="fixed bottom-8 right-8">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-[10px] py-[10px] rounded-[10px] bg-transparent border border-[#71A866] flex items-center gap-[10px] text-[#71A866] font-[Inter] text-[16px] font-semibold leading-5 transition-all hover:bg-[#375C30]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="18 15 12 9 6 15" />
          </svg>
          <span>Наверх</span>
        </button>
      </div>
    </div>
  );
};

export default HomeNew;
