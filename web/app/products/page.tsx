import {
  Package,
  Plus,
  Search,
  Box,
  TrendingUp,
  AlertTriangle,
  Zap,
} from "lucide-react";
import clsx from "clsx";

// ─────────────────────────────────────────────────────────────────────
// Dummy product catalog — the "Uzum Hook"
// ─────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  activeCampaigns: number;
  revenue: string;
  color: string; // placeholder thumbnail color
}

const products: Product[] = [
  {
    id: "p-001",
    sku: "NK-AF1-WHT",
    name: "Nike Air Force 1",
    category: "Footwear",
    stock: 342,
    stockStatus: "in_stock",
    activeCampaigns: 3,
    revenue: "$48,200",
    color: "#3B82F6",
  },
  {
    id: "p-002",
    sku: "DY-V15-PRO",
    name: "Dyson V15 Detect",
    category: "Home Appliances",
    stock: 89,
    stockStatus: "in_stock",
    activeCampaigns: 2,
    revenue: "$62,400",
    color: "#8B5CF6",
  },
  {
    id: "p-003",
    sku: "AP-MBP-16",
    name: 'MacBook Pro 16"',
    category: "Electronics",
    stock: 24,
    stockStatus: "low_stock",
    activeCampaigns: 1,
    revenue: "$124,800",
    color: "#6B7280",
  },
  {
    id: "p-004",
    sku: "SK-HYD-SER",
    name: "Hydra Boost Serum",
    category: "Skincare",
    stock: 1240,
    stockStatus: "in_stock",
    activeCampaigns: 4,
    revenue: "$18,900",
    color: "#EC4899",
  },
  {
    id: "p-005",
    sku: "AD-UB-22",
    name: "Adidas Ultraboost 22",
    category: "Footwear",
    stock: 0,
    stockStatus: "out_of_stock",
    activeCampaigns: 0,
    revenue: "$31,600",
    color: "#F59E0B",
  },
  {
    id: "p-006",
    sku: "SM-GW-6",
    name: "Galaxy Watch 6",
    category: "Wearables",
    stock: 156,
    stockStatus: "in_stock",
    activeCampaigns: 2,
    revenue: "$22,100",
    color: "#10B981",
  },
  {
    id: "p-007",
    sku: "LG-OLED-65",
    name: 'LG C3 OLED 65"',
    category: "Electronics",
    stock: 8,
    stockStatus: "low_stock",
    activeCampaigns: 1,
    revenue: "$89,600",
    color: "#EF4444",
  },
  {
    id: "p-008",
    sku: "YT-MAT-PRO",
    name: "Yoga Mat Pro",
    category: "Fitness",
    stock: 876,
    stockStatus: "in_stock",
    activeCampaigns: 1,
    revenue: "$6,400",
    color: "#14B8A6",
  },
  {
    id: "p-009",
    sku: "BS-QC-45",
    name: "Bose QC Ultra",
    category: "Audio",
    stock: 67,
    stockStatus: "in_stock",
    activeCampaigns: 2,
    revenue: "$34,500",
    color: "#A855F7",
  },
  {
    id: "p-010",
    sku: "ZR-CND-500",
    name: "Zara Candle 500ml",
    category: "Home & Living",
    stock: 2100,
    stockStatus: "in_stock",
    activeCampaigns: 0,
    revenue: "$4,200",
    color: "#D4A574",
  },
  {
    id: "p-011",
    sku: "TF-LIP-RG",
    name: "Tom Ford Lip Color",
    category: "Beauty",
    stock: 14,
    stockStatus: "low_stock",
    activeCampaigns: 3,
    revenue: "$41,800",
    color: "#BE123C",
  },
  {
    id: "p-012",
    sku: "NB-990-GRY",
    name: "New Balance 990v6",
    category: "Footwear",
    stock: 203,
    stockStatus: "in_stock",
    activeCampaigns: 1,
    revenue: "$27,300",
    color: "#64748B",
  },
];

const stockConfig = {
  in_stock: { label: "In Stock", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  low_stock: { label: "Low Stock", color: "text-amber-400", bg: "bg-amber-500/10" },
  out_of_stock: { label: "Out of Stock", color: "text-red-400", bg: "bg-red-500/10" },
};

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const totalSKUs = products.length;
  const activeAI = products.filter((p) => p.activeCampaigns > 0).length;
  const lowStock = products.filter(
    (p) => p.stockStatus === "low_stock" || p.stockStatus === "out_of_stock"
  ).length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#262626] px-4 pl-14 md:pl-6 md:px-6">
        <div className="flex items-center gap-2.5">
          <Package size={18} strokeWidth={1.8} className="text-[#facc15]" />
          <h1 className="text-[15px] font-semibold text-white">Products</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-[#262626] bg-[#141414] px-3 py-1.5 sm:flex">
            <Search size={14} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search SKUs..."
              className="w-40 bg-transparent text-[12px] text-white placeholder-gray-500 outline-none"
              readOnly
            />
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-[#facc15] px-3 py-2 text-[12px] font-bold text-black transition-colors hover:bg-[#eab308]">
            <Plus size={13} strokeWidth={2.5} />
            <span className="hidden sm:inline">Sync Catalog</span>
            <span className="sm:hidden">Sync</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-[#0A0A0A] p-4 md:p-6">
        {/* Summary stats */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {[
            {
              label: "Total SKUs",
              value: totalSKUs,
              icon: Box,
              color: "text-[#facc15]",
            },
            {
              label: "AI-Active Products",
              value: activeAI,
              icon: Zap,
              color: "text-blue-400",
            },
            {
              label: "Stock Alerts",
              value: lowStock,
              icon: AlertTriangle,
              color: "text-amber-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-[#262626] bg-[#141414] p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-gray-400">
                  {s.label}
                </span>
                <s.icon size={16} className={s.color} />
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => {
            const stock = stockConfig[p.stockStatus];

            return (
              <div
                key={p.id}
                className="group rounded-xl border border-[#262626] bg-[#141414] p-4 transition-all hover:border-[#363636] hover:bg-[#1a1a1a]"
              >
                {/* Thumbnail placeholder */}
                <div
                  className="mb-3 flex h-28 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${p.color}12` }}
                >
                  <Box
                    size={32}
                    strokeWidth={1.2}
                    style={{ color: p.color }}
                    className="opacity-60"
                  />
                </div>

                {/* Product info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-white">
                        {p.name}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] tracking-wider text-gray-500">
                        {p.sku}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#1e1e1e] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-500">
                      {p.category}
                    </span>
                    <span
                      className={clsx(
                        "rounded px-1.5 py-0.5 text-[9px] font-semibold",
                        stock.bg,
                        stock.color
                      )}
                    >
                      {stock.label}
                    </span>
                  </div>

                  {/* Metrics row */}
                  <div className="flex items-center justify-between border-t border-[#1e1e1e] pt-2">
                    <div>
                      <p className="text-[10px] text-gray-500">Stock</p>
                      <p className="font-mono text-[12px] font-medium text-white">
                        {p.stock.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Revenue</p>
                      <p className="font-mono text-[12px] font-medium text-white">
                        {p.revenue}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500">AI Campaigns</p>
                      <div className="flex items-center justify-end gap-1">
                        {p.activeCampaigns > 0 ? (
                          <>
                            <Zap size={10} className="text-[#facc15]" />
                            <span className="font-mono text-[12px] font-bold text-[#facc15]">
                              {p.activeCampaigns}
                            </span>
                          </>
                        ) : (
                          <span className="font-mono text-[12px] text-gray-600">
                            0
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
