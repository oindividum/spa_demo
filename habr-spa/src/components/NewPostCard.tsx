import { useNavigate } from 'react-router-dom';
import type { Post } from '../types/Post';

interface NewPostCardProps {
  post: Post;
  isPrivate?: boolean;
}

const NewPostCard = ({ post, isPrivate = false }: NewPostCardProps) => {
  const navigate = useNavigate();
  const borderColor = isPrivate ? '#A86667' : '#71A866';
  const accentColor = isPrivate ? '#A86667' : '#71A866';
  const bgColor = isPrivate ? '#5C3030' : '#375C30';
  const shadowColor = isPrivate ? 'rgba(168, 102, 103, 0.25)' : 'rgba(113, 168, 102, 0.25)';

  const handleCardClick = () => {
    navigate(`/post/${post.id}`);
  };

  return (
    <div
      className="w-[737px] cursor-pointer rounded-[10px] overflow-hidden transition-all hover:shadow-lg"
      style={{
        border: `5px solid ${borderColor}`,
        filter: `drop-shadow(-6px 0px 11.8px ${shadowColor}) drop-shadow(6px 0px 11.8px ${shadowColor}) drop-shadow(0px 6px 11.8px ${shadowColor})`,
      }}
      onClick={handleCardClick}
    >
      {/* Image */}
      {post.imageUrl && (
        <div className="w-full h-[390px] overflow-hidden border-b-[5px]" style={{ borderColor }}>
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content Section */}
      <div className="bg-[#36383C] p-[26px]" style={{ minHeight: post.imageUrl ? '316px' : '390px' }}>
        {/* Author and Date */}
        <div
          className="flex justify-between items-center mb-[26px]"
          style={{
            gap: isPrivate ? '417px' : '417px',
          }}
        >
          <div className="flex items-center gap-4">
            <span
              className="text-[16px] font-medium font-[Encode Sans Condensed]"
              style={{ color: accentColor }}
            >
              @{post.author}
            </span>
            <span
              className="text-[16px] font-medium font-[Encode Sans Condensed]"
              style={{ color: `${accentColor}80` }}
            >
              {post.createdAt}
            </span>
          </div>
        </div>

        {/* Title and Description */}
        <div className="flex flex-col gap-2 mb-[23px]">
          <h3
            className="font-bold text-[32px] font-[Encode Sans Condensed] leading-[40px]"
            style={{ color: accentColor }}
          >
            {post.title}
          </h3>
          <p
            className="text-[20px] font-[Encode Sans Condensed] font-normal leading-[25px]"
            style={{ color: accentColor }}
          >
            {post.summary}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-[10px]">
          <button
            className="px-[10px] py-[10px] rounded-[10px] font-[Inter] text-[16px] font-normal leading-[19px] transition-colors"
            style={{ color: accentColor }}
          >
            Перейти на Блог
          </button>
          <button
            className="px-[10px] py-[10px] rounded-[10px] font-[Encode Sans Condensed] text-[16px] font-medium leading-[20px] text-[#EAEAEA] transition-colors"
            style={{ backgroundColor: bgColor, border: `2px solid ${accentColor}` }}
          >
            Перейти на Пост
          </button>
        </div>
      </div>

      {/* Stats Footer */}
      <div
        className="flex justify-between items-center px-[40px] py-[24px] bg-[#36383C] border-t"
        style={{ borderColor: `${accentColor}20` }}
      >
        <div className="flex items-center gap-[10px]">
          <span
            className="text-[16px] font-normal font-[Inter]"
            style={{ color: accentColor }}
          >
            Публичный пост
          </span>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            style={{ stroke: accentColor, strokeWidth: '1.5' }}
          >
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        </div>

        <div className="flex gap-[10px] items-center">
          {/* Views */}
          <div className="flex items-center gap-[10px]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="1.5">
              <path d="M1.5 12s4.5-8 10.5-8 10.5 8 10.5 8-4.5 8-10.5 8-10.5-8-10.5-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span
              className="text-[16px] font-normal font-[Encode Sans Condensed]"
              style={{ color: accentColor }}
            >
              {post.views || '1.5k'}
            </span>
          </div>

          {/* Likes */}
          <div className="flex items-center gap-[9px]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span
              className="text-[16px] font-normal font-[Encode Sans Condensed]"
              style={{ color: accentColor }}
            >
              {post.likes || 24}
            </span>
          </div>

          {/* Comments */}
          <div className="flex items-center gap-[6px]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span
              className="text-[16px] font-medium font-[Encode Sans Condensed]"
              style={{ color: accentColor }}
            >
              {post.comments || 455}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPostCard;
