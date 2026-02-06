'use client';

export function GradientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-[120px] bg-gradient-to-br from-cyan-500 to-blue-600 animate-float-slow"
        style={{
          top: '-10%',
          right: '-5%',
          animationDelay: '0s',
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-25 blur-[100px] bg-gradient-to-tr from-teal-500 to-emerald-600 animate-float-slow"
        style={{
          bottom: '-15%',
          left: '-10%',
          animationDelay: '-2s',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-20 blur-[80px] bg-gradient-to-r from-purple-500 to-pink-600 animate-float-slow"
        style={{
          top: '40%',
          left: '30%',
          animationDelay: '-4s',
        }}
      />
      <div
        className="absolute w-[200px] h-[200px] rounded-full opacity-15 blur-[60px] bg-gradient-to-br from-cyan-400 to-teal-500 animate-float-fast"
        style={{
          top: '60%',
          right: '20%',
          animationDelay: '-1s',
        }}
      />
    </div>
  );
}
