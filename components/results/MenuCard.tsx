interface MenuCardItem {
  id: number
  name: string
  tags: string[]
}

interface MenuCardProps {
  menus: MenuCardItem[]
  selectedMenu: number
  onSelect: (id: number) => void
}

export default function MenuCard({ menus, selectedMenu, onSelect }: MenuCardProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-dc-text text-sm lg:text-base font-semibold">📋 메뉴 선택</div>

      {/* 데스크탑 */}
      <div className="hidden lg:grid grid-cols-3 gap-4">
        {menus.map((menu) => (
          <button
            key={menu.id}
            onClick={() => onSelect(menu.id)}
            className={`p-5 rounded-2xl border text-left transition-all ${selectedMenu === menu.id
                ? "border-dc-primary bg-dc-primary-light"
                : "border-dc-border bg-dc-surface hover:border-dc-primary/50"
              }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="text-dc-text text-sm font-bold">{menu.name}</div>
              {selectedMenu === menu.id && (
                <span className="text-[10px] font-bold bg-dc-primary text-white px-2 py-0.5 rounded-full">
                  선택됨
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {menu.tags.map((tag) => (
                <span key={tag} className="text-xs text-dc-text-secondary bg-dc-muted px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* 모바일 */}
      <div className="lg:hidden flex flex-col gap-2">
        {menus.map((menu) => (
          <button
            key={menu.id}
            onClick={() => onSelect(menu.id)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${selectedMenu === menu.id
                ? "border-dc-primary bg-dc-primary-light"
                : "border-dc-border bg-dc-surface"
              }`}
          >
            <div>
              <div className="text-dc-text text-sm font-semibold">{menu.name}</div>
              <div className="text-dc-text-secondary text-xs mt-0.5">{menu.tags.join(" · ")}</div>
            </div>
            <span className="text-dc-text-secondary">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}