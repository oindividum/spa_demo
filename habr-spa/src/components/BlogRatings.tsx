interface BlogRating {
  name: string;
  followers: number;
  color?: string;
}

interface BlogRatingsProps {
  ratings?: BlogRating[];
}

const BlogRatings = ({ ratings }: BlogRatingsProps) => {
  const defaultRatings: BlogRating[] = ratings || [
    { name: '@Fidd_dev', followers: 2000, color: '#71A866' },
    { name: '@Tech_lead', followers: 1456, color: '#52734C' },
    { name: '@DableArt', followers: 117, color: '#52734C' },
    { name: '@toy_trainee', followers: 67, color: '#52734C' },
  ];

  return (
    <div className="w-[290px] flex flex-col gap-4">
      {/* Header */}
      <h2 className="text-[#71A866] font-[Encode Sans Condensed] text-[24px] font-normal leading-[30px] text-center">
        Рейтинг блогов
      </h2>

      {/* Ratings List */}
      <div className="flex flex-col gap-[10px]">
        {defaultRatings.map((rating, index) => (
          <div
            key={index}
            className="w-full px-[10px] py-[10px] rounded-[5px] border-2 flex items-center justify-between transition-all hover:shadow-md"
            style={{ borderColor: rating.color, color: rating.color }}
          >
            <span className="font-[Encode Sans Condensed] text-[16px] font-medium leading-[20px]">
              {rating.name}
            </span>
            <div className="flex items-center gap-[10px]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="font-[Encode Sans Condensed] text-[16px] font-medium leading-[20px] min-w-[40px]">
                {(rating.followers / 1000).toFixed(0)}k
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogRatings;
