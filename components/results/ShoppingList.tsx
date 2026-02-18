import CopyButton from "@/components/shared/CopyButton"

interface ShoppingItem {
  name: string
  amount: string
}

interface ShoppingListProps {
  items: ShoppingItem[]
  onRegenerate?: () => void
}

export default function ShoppingList({ items, onRegenerate }: ShoppingListProps) {
  const shoppingText = items.map(item => `${item.name} - ${item.amount}`).join("\n")

  return (
    <div className="lg:w-[280px] lg:flex-none bg-dc-surface rounded-2xl border border-dc-border p-5 lg:p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-dc-text text-base font-bold">🛒 장보기 목록</h2>
        <span className="text-[10px] font-semibold text-dc-primary bg-dc-primary-light px-2 py-0.5 rounded-full">
          AI 추천
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {items.length === 0 ? (
          <div className="text-dc-text-secondary text-sm text-center py-4">
            장보기 목록이 없어요
          </div>
        ) : (
          items.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-dc-text text-sm">{item.name}</span>
              <span className="text-dc-text-secondary text-xs">{item.amount}</span>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2">
        <CopyButton text={shoppingText} label="장보기 목록 복사" />
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="w-full h-11 bg-dc-muted rounded-xl text-dc-text-secondary text-sm font-medium hover:bg-dc-border transition-colors"
          >
            다시 생성하기
          </button>
        )}
      </div>
    </div>
  )
}