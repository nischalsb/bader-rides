export default function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-[20%] -right-[10%] w-[700px] h-[700px] rounded-full bg-cardinal/[0.03] blur-[180px] animate-float" />
      <div className="absolute top-[30%] -left-[15%] w-[600px] h-[600px] rounded-full bg-accent-blue/[0.03] blur-[160px] animate-float-slow" />
      <div className="absolute -bottom-[10%] right-[15%] w-[500px] h-[500px] rounded-full bg-cardinal/[0.02] blur-[150px] animate-pulse-glow" />
    </div>
  );
}
