const Loader = ({ size = "md", fullPage = false }: { size?: "sm" | "md" | "lg"; fullPage?: boolean }) => {
  const sizeClasses = {
    sm: "h-6 w-6 border-2",
    md: "h-10 w-10 border-3",
    lg: "h-16 w-16 border-4",
  };

  const loaderContent = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`animate-spin rounded-full border-t-secondary border-r-transparent border-b-secondary border-l-transparent ${sizeClasses[size]}`}
      ></div>
      <span className="text-secondary font-medium animate-pulse">Loading...</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {loaderContent}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-4">{loaderContent}</div>;
};

export default Loader;
