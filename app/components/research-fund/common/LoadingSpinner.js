export default function LoadingSpinner({ size = "medium", label = "กำลังโหลดข้อมูล" }) {
  const sizeClasses = {
    small: "h-4 w-4 border-2",
    medium: "h-8 w-8 border-[3px]",
    large: "h-11 w-11 border-4",
  };

  return (
    <span className="inline-flex items-center justify-center p-2" role="status" aria-label={label}>
      <span
        className={`${sizeClasses[size] || sizeClasses.medium} animate-spin rounded-full border-blue-100 border-t-blue-600`}
        aria-hidden="true"
      />
    </span>
  );
}
