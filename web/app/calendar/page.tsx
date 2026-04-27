import {
  CalendarDays,
  Plus,
  Film,
  Image,
  Clock,
  CheckCircle2,
  PenTool,
  Eye,
  Send,
  GripVertical,
} from "lucide-react";
import clsx from "clsx";

// ─────────────────────────────────────────────────────────────────────
// Dummy data — Content Calendar / Publisher Kanban
// ─────────────────────────────────────────────────────────────────────

type PostStatus = "drafting" | "pending_approval" | "scheduled" | "published";
type AssetType = "video" | "image";

interface ContentPost {
  id: string;
  title: string;
  platform: string;
  platformColor: string;
  assetType: AssetType;
  postDate: string;
  time?: string;
  thumbnailColor: string;
  campaign?: string;
  engagement?: string;
}

const columns: { key: PostStatus; label: string; count: number; dotColor: string }[] = [
  { key: "drafting", label: "Drafting", count: 4, dotColor: "bg-gray-400" },
  { key: "pending_approval", label: "Pending Approval", count: 3, dotColor: "bg-warning" },
  { key: "scheduled", label: "Scheduled", count: 5, dotColor: "bg-accent" },
  { key: "published", label: "Published", count: 6, dotColor: "bg-success" },
];

const posts: Record<PostStatus, ContentPost[]> = {
  drafting: [
    {
      id: "d-1",
      title: "Founder Story — Behind the Brand",
      platform: "Instagram",
      platformColor: "#E1306C",
      assetType: "video",
      postDate: "Apr 8",
      thumbnailColor: "#7C3AED",
      campaign: "Brand Story Series",
    },
    {
      id: "d-2",
      title: "Product Comparison — Us vs. Them",
      platform: "TikTok",
      platformColor: "#00F2EA",
      assetType: "video",
      postDate: "Apr 9",
      thumbnailColor: "#2563EB",
      campaign: "Competitor Takedown",
    },
    {
      id: "d-3",
      title: "Customer Testimonial #12",
      platform: "Meta",
      platformColor: "#1877F2",
      assetType: "video",
      postDate: "Apr 9",
      thumbnailColor: "#059669",
      campaign: "UGC Pipeline",
    },
    {
      id: "d-4",
      title: "Flash Sale Countdown Graphic",
      platform: "Instagram",
      platformColor: "#E1306C",
      assetType: "image",
      postDate: "Apr 10",
      thumbnailColor: "#DC2626",
    },
  ],
  pending_approval: [
    {
      id: "pa-1",
      title: "Summer Drop Teaser — Hook #3",
      platform: "TikTok",
      platformColor: "#00F2EA",
      assetType: "video",
      postDate: "Apr 7",
      thumbnailColor: "#F59E0B",
      campaign: "Summer Drop",
    },
    {
      id: "pa-2",
      title: "Dyson V15 — Cinematic B-Roll",
      platform: "Instagram",
      platformColor: "#E1306C",
      assetType: "video",
      postDate: "Apr 7",
      thumbnailColor: "#8B5CF6",
      campaign: "Q3 Product Launch",
    },
    {
      id: "pa-3",
      title: "Lifestyle Flat Lay — New Arrivals",
      platform: "Meta",
      platformColor: "#1877F2",
      assetType: "image",
      postDate: "Apr 8",
      thumbnailColor: "#EC4899",
    },
  ],
  scheduled: [
    {
      id: "s-1",
      title: "UGC Talking Head — Hook Rate Test A",
      platform: "TikTok",
      platformColor: "#00F2EA",
      assetType: "video",
      postDate: "Apr 5",
      time: "2:00 PM",
      thumbnailColor: "#10B981",
      campaign: "Summer Drop",
    },
    {
      id: "s-2",
      title: "Product Demo — Bose QC Ultra",
      platform: "Instagram",
      platformColor: "#E1306C",
      assetType: "video",
      postDate: "Apr 5",
      time: "6:30 PM",
      thumbnailColor: "#A855F7",
      campaign: "Audio Launch",
    },
    {
      id: "s-3",
      title: "Carousel — Top 5 Summer Picks",
      platform: "Instagram",
      platformColor: "#E1306C",
      assetType: "image",
      postDate: "Apr 6",
      time: "11:00 AM",
      thumbnailColor: "#F97316",
    },
    {
      id: "s-4",
      title: "Flash Sale Announcement",
      platform: "Meta",
      platformColor: "#1877F2",
      assetType: "video",
      postDate: "Apr 6",
      time: "9:00 AM",
      thumbnailColor: "#EF4444",
      campaign: "Flash Sale Weekend",
    },
    {
      id: "s-5",
      title: "Yoga Mat Pro — Lifestyle Reel",
      platform: "TikTok",
      platformColor: "#00F2EA",
      assetType: "video",
      postDate: "Apr 6",
      time: "4:00 PM",
      thumbnailColor: "#14B8A6",
    },
  ],
  published: [
    {
      id: "p-1",
      title: "Summer Drop — Hero Video",
      platform: "TikTok",
      platformColor: "#00F2EA",
      assetType: "video",
      postDate: "Apr 3",
      time: "1:00 PM",
      thumbnailColor: "#FACC15",
      campaign: "Summer Drop",
      engagement: "124K views",
    },
    {
      id: "p-2",
      title: "Nike AF1 — Unboxing Reel",
      platform: "Instagram",
      platformColor: "#E1306C",
      assetType: "video",
      postDate: "Apr 3",
      time: "5:00 PM",
      thumbnailColor: "#3B82F6",
      campaign: "Summer Drop",
      engagement: "8.2K likes",
    },
    {
      id: "p-3",
      title: "Founder Q&A — Part 1",
      platform: "Instagram",
      platformColor: "#E1306C",
      assetType: "video",
      postDate: "Apr 2",
      time: "12:00 PM",
      thumbnailColor: "#7C3AED",
      campaign: "Brand Story Series",
      engagement: "3.4K likes",
    },
    {
      id: "p-4",
      title: "Dyson V15 — Before/After",
      platform: "Meta",
      platformColor: "#1877F2",
      assetType: "video",
      postDate: "Apr 2",
      time: "10:00 AM",
      thumbnailColor: "#8B5CF6",
      engagement: "42K reach",
    },
    {
      id: "p-5",
      title: "Weekend Sale — Story Set",
      platform: "Instagram",
      platformColor: "#E1306C",
      assetType: "image",
      postDate: "Apr 1",
      time: "9:00 AM",
      thumbnailColor: "#F43F5E",
      engagement: "2.1K clicks",
    },
    {
      id: "p-6",
      title: "Customer Review Montage",
      platform: "TikTok",
      platformColor: "#00F2EA",
      assetType: "video",
      postDate: "Apr 1",
      time: "3:00 PM",
      thumbnailColor: "#059669",
      campaign: "UGC Pipeline",
      engagement: "67K views",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// Card component
// ─────────────────────────────────────────────────────────────────────

function ContentCard({
  post,
  status,
}: {
  post: ContentPost;
  status: PostStatus;
}) {
  return (
    <div className="group rounded-lg border border-border bg-bg-primary p-3 transition-all hover:border-border-hover hover:bg-bg-tertiary">
      {/* Thumbnail */}
      <div
        className="mb-2.5 flex h-20 items-center justify-center rounded-md"
        style={{ backgroundColor: `${post.thumbnailColor}15` }}
      >
        {post.assetType === "video" ? (
          <Film
            size={22}
            strokeWidth={1.3}
            style={{ color: post.thumbnailColor }}
            className="opacity-50"
          />
        ) : (
          <Image
            size={22}
            strokeWidth={1.3}
            style={{ color: post.thumbnailColor }}
            className="opacity-50"
          />
        )}
      </div>

      {/* Title */}
      <p className="mb-1.5 text-[12px] font-semibold leading-snug text-text-primary">
        {post.title}
      </p>

      {/* Platform + Type */}
      <div className="mb-2 flex items-center gap-1.5">
        <span
          className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: `${post.platformColor}15`,
            color: post.platformColor,
          }}
        >
          {post.platform}
        </span>
        <span className="rounded bg-[#1e1e1e] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-text-muted">
          {post.assetType}
        </span>
      </div>

      {/* Campaign tag */}
      {post.campaign && (
        <p className="mb-2 text-[10px] text-text-muted">
          <span className="text-gray-600">Campaign:</span> {post.campaign}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[#1e1e1e] pt-2">
        <div className="flex items-center gap-1">
          <Clock size={10} className="text-gray-600" />
          <span className="text-[10px] text-text-muted">
            {post.postDate}
            {post.time ? ` · ${post.time}` : ""}
          </span>
        </div>

        {/* Status-specific indicator */}
        {status === "published" && post.engagement && (
          <span className="text-[10px] font-semibold text-success">
            {post.engagement}
          </span>
        )}
        {status === "pending_approval" && (
          <div className="flex items-center gap-1">
            <Eye size={10} className="text-warning" />
            <span className="text-[10px] font-medium text-warning">
              Review
            </span>
          </div>
        )}
        {status === "scheduled" && (
          <div className="flex items-center gap-1">
            <Send size={10} className="text-accent" />
            <span className="text-[10px] font-medium text-accent">
              Queued
            </span>
          </div>
        )}
        {status === "drafting" && (
          <div className="flex items-center gap-1">
            <PenTool size={10} className="text-text-muted" />
            <span className="text-[10px] font-medium text-text-muted">
              Draft
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const totalScheduled = posts.scheduled.length + posts.pending_approval.length;
  const totalPublished = posts.published.length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-bg-primary px-4 pl-14 md:pl-8 md:px-8">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[18px] font-medium tracking-[-0.01em] text-text-primary">
            <span className="hidden sm:inline">Calendar</span>
            <span className="sm:hidden">Cal</span>
          </h1>
          <span className="hidden font-display text-[18px] text-text-muted sm:block">
            content schedule
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-4 sm:flex">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
              <span className="text-accent">{totalScheduled}</span> queued
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
              <span className="text-success">{totalPublished}</span> shipped
            </span>
          </div>
          <button className="flex items-center gap-2 rounded-full bg-text-primary px-4 py-2 text-[12.5px] font-medium text-bg-primary transition-transform duration-150 hover:scale-[1.02]">
            <Plus size={13} strokeWidth={2.4} />
            <span className="hidden sm:inline">Schedule post</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </header>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto bg-bg-primary p-3 md:p-6">
        <div className="flex h-full gap-3 md:gap-4">
          {columns.map((col) => (
            <div
              key={col.key}
              className="flex w-64 shrink-0 flex-col rounded-xl border border-border bg-bg-secondary md:w-72"
            >
              {/* Column header */}
              <div className="flex items-center justify-between border-b border-[#1e1e1e] px-4 py-3">
                <div className="flex items-center gap-2">
                  <div
                    className={clsx(
                      "h-2 w-2 rounded-full",
                      col.dotColor
                    )}
                  />
                  <span className="text-[12px] font-semibold text-text-primary">
                    {col.label}
                  </span>
                </div>
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1e1e1e] px-1.5 text-[10px] font-bold text-text-muted">
                  {posts[col.key].length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {posts[col.key].map((post) => (
                  <ContentCard
                    key={post.id}
                    post={post}
                    status={col.key}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
