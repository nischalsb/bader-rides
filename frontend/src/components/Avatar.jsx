const sizes = { sm: "w-8 h-8 text-[10px]", md: "w-10 h-10 text-xs", lg: "w-12 h-12 text-sm" };

export default function Avatar({ initials, size = "md", glow }) {
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-cardinal to-cardinal-dark text-white font-bold flex items-center justify-center shrink-0 ${glow ? "ring-2 ring-cardinal/30 shadow-[0_0_20px_rgba(197,5,12,0.2)]" : ""}`}>
      {initials}
    </div>
  );
}
