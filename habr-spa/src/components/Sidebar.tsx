interface SidebarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const Sidebar = ({ activeFilter, onFilterChange }: SidebarProps) => {
  const filters = [
    { id: 'available', label: 'Доступные мне', icon: 'unlock' },
    { id: 'all', label: 'Все посты', icon: 'files' },
    { id: 'purchased', label: 'Только купленные', icon: 'money' },
  ];

  return (
    <div className="w-[260px] flex flex-col gap-[30px]">
      {/* Profile Button */}
      <button
        className="w-full px-[10px] py-[10px] rounded-[10px] bg-[#375C30] border-2 border-[#71A866] shadow-md flex items-center justify-between text-[#EAEAEA] font-[Encode Sans Condensed] text-[16px] font-medium leading-[20px] transition-all hover:bg-[#3d6633]"
      >
        <span>Мой профиль</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>

      {/* Feed Filter */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[#71A866] font-[Encode Sans Condensed] text-[20px] font-normal leading-[25px] text-center">
          Фильтр ленты
        </h3>

        <div className="border-2 border-[#71A866] rounded-[10px] p-[12px_7px] flex flex-col gap-[20px]">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`w-full px-[10px] py-[10px] rounded-[10px] flex items-center justify-between font-[Encode Sans Condensed] text-[16px] font-medium leading-[20px] transition-all ${
                activeFilter === filter.id
                  ? 'bg-[#375C30] border border-[#71A866] text-[#EAEAEA] shadow-md'
                  : 'text-[#71A866] hover:bg-[#292B2F]'
              }`}
            >
              <span>{filter.label}</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                {filter.icon === 'unlock' && <rect x="3" y="11" width="18" height="11" rx="2" />}
                {filter.icon === 'files' && (
                  <>
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <polyline points="13 2 13 9 20 9" />
                  </>
                )}
                {filter.icon === 'money' && <circle cx="12" cy="12" r="1" />}
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Links */}
      <div className="border border-[#71A866] rounded-[10px] p-[10px] flex flex-col gap-2">
        <div className="text-center text-[#71A86680] font-[Encode Sans Condensed] text-[20px] font-medium pb-2 border-b border-[#71A86690]">
          Fidd © 2026
        </div>

        <button className="text-left px-[10px] py-[10px] text-[#71A866] font-[Encode Sans Condensed] text-[16px] font-medium leading-[20px] hover:underline transition-colors">
          Политика конфиденциальности
        </button>

        <button className="text-left px-[10px] py-[10px] text-[#71A866] font-[Encode Sans Condensed] text-[16px] font-medium leading-[20px] hover:underline transition-colors">
          Сookie
        </button>

        <button className="text-left px-[10px] py-[10px] text-[#71A866] font-[Encode Sans Condensed] text-[16px] font-medium leading-[20px] hover:underline transition-colors">
          Контактная информация
        </button>

        <button className="text-left px-[10px] py-[10px] text-[#71A866] font-[Encode Sans Condensed] text-[16px] font-medium leading-[20px] hover:underline transition-colors">
          Как работает сервис
        </button>

        <button className="text-left px-[10px] py-[10px] text-[#71A866] font-[Encode Sans Condensed] text-[16px] font-medium leading-[20px] hover:underline transition-colors">
          FAQ
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
