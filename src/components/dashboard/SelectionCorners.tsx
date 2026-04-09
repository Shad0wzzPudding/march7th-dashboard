interface SelectionCornersProps {
  visible: boolean;
}

export const SelectionCorners = ({ visible }: SelectionCornersProps) => {
  if (!visible) return null;

  const cornerClass = "absolute w-5 h-5 border-primary/70 pointer-events-none z-10";

  return (
    <>
      {/* Top-left */}
      <span className={`${cornerClass} top-0 left-0 border-t-2 border-l-2 rounded-tl-lg`} />
      {/* Top-right */}
      <span className={`${cornerClass} top-0 right-0 border-t-2 border-r-2 rounded-tr-lg`} />
      {/* Bottom-left */}
      <span className={`${cornerClass} bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg`} />
      {/* Bottom-right */}
      <span className={`${cornerClass} bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg`} />

      {/* Center tick marks on each edge */}
      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-0 border-t-2 border-primary/50 pointer-events-none z-10" />
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0 border-b-2 border-primary/50 pointer-events-none z-10" />
      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0 border-l-2 border-primary/50 pointer-events-none z-10" />
      <span className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-0 border-r-2 border-primary/50 pointer-events-none z-10" />
    </>
  );
};
