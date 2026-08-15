import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-[68px] flex items-center px-4 gap-[274px]"
      style={{
        backgroundColor: '#36383C',
        borderBottom: '3px solid #537051',
        boxShadow: '0px 6px 11.8px rgba(176, 253, 205, 0.13)',
      }}
    >
      {/* Logo Section */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-[#71A866] rounded flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#292B2F">
              <rect x="4" y="4" width="8" height="8" />
              <rect x="12" y="4" width="8" height="8" />
              <rect x="4" y="12" width="8" height="8" />
              <rect x="12" y="12" width="8" height="8" />
            </svg>
          </div>
          <span className="text-[#71A866] font-[Encode Sans Condensed] text-[32px] font-semibold leading-10">
            Fidd
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="hidden md:flex items-center gap-0 ml-[300px]">
        {[
          { label: 'О нас', color: '#4C7045' },
          { label: 'Лента', color: '#7BB96E', underline: true },
          { label: 'Все блоги', color: '#4C7045' },
          { label: 'Хранилище', color: '#4C7045' },
        ].map((item, index) => (
          <button
            key={index}
            className="px-[10px] py-[10px] relative font-[Encode Sans Condensed] text-[16px] font-normal leading-5 transition-colors hover:opacity-80"
            style={{ color: item.color }}
          >
            {item.label}
            {item.underline && (
              <div className="absolute bottom-[10px] left-[10px] right-[10px] h-[1px] bg-[#7BB96E]" />
            )}
          </button>
        ))}
      </nav>

      {/* Right Actions */}
      <div className="ml-auto flex items-center gap-10">
        <button
          className="px-[10px] py-[10px] rounded-[10px] bg-[#375C30] border border-[#71A866] shadow-md text-[#EAEAEA] font-[Encode Sans Condensed] text-[16px] font-normal leading-5 transition-all hover:bg-[#3d6633]"
        >
          Создать блог
        </button>

        {/* Notification */}
        <button className="relative">
          <div
            className="w-12 h-12 rounded-full bg-[#375C30] border border-[#71A866] shadow-md flex items-center justify-center transition-all hover:bg-[#3d6633]"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71A866" strokeWidth="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
        </button>

        {/* User Profile */}
        <button
          className="w-12 h-12 rounded-full bg-[#375C30] border border-[#71A866] shadow-md flex items-center justify-center transition-all hover:bg-[#3d6633]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71A866" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
