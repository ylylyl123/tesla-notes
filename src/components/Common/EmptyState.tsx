interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
}

export default function EmptyState({
  icon = "📝",
  title = "暂无内容",
  description,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <p className="empty-state-text">
        {title}
        {description && <span className="block mt-2 text-sm opacity-70">{description}</span>}
      </p>
    </div>
  );
}
