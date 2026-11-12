export function BrandMark({
  size = 34,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="15" fill="currentColor" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17 14H38C46 14 50 18 50 26V30C50 37 46 41 39 41H36L51 51H38L25 41H25V51H17V14ZM25 22V33H38C41 33 42 32 42 29V26C42 23 41 22 38 22H25Z"
        fill="#F8F7F3"
      />
    </svg>
  );
}
export function BrandLogo({
  compact = false,
  inverse = false,
}: {
  compact?: boolean;
  inverse?: boolean;
}) {
  return (
    <span className={`brand-logo${inverse ? " inverse" : ""}`}>
      <BrandMark size={compact ? 29 : 35} />
      <span>
        Route<span className="brand-ledger">Ledger</span>
      </span>
    </span>
  );
}
