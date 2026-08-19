import React, { useState } from 'react';

export default function SwapPage() {
  const [payAmount, setPayAmount] = useState('0.0');
  const [receiveAmount, setReceiveAmount] = useState('0.0');

  return (
    <div className="antialiased min-h-screen flex flex-col bg-[#09090B] text-[#e5e1e4] font-sans relative overflow-x-hidden">
      {/* Hero Glow Background */}
      <div 
        className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, rgba(9, 9, 11, 0) 70%)'
        }}
      />

      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#18181B]/80 backdrop-blur-xl border-b border-white/10 shadow-sm">
        <div className="flex justify-between items-center h-16 px-6 md:px-10 max-w-[1280px] mx-auto">
          <div className="text-2xl font-bold tracking-tighter text-[#c3c0ff]">Utilify</div>
          
          <div className="hidden md:flex space-x-8 text-base">
            <a href="#" className="text-[#c3c0ff] font-bold border-b-2 border-[#c3c0ff] pb-1 active:scale-95 transition-transform duration-100">
              Swap
            </a>
            <a href="#" className="text-[#c7c4d8] hover:text-[#e5e1e4] transition-colors hover:bg-[#2a2a2c]/50 px-3 py-1 rounded active:scale-95">
              Bridge
            </a>
            <a href="#" className="text-[#c7c4d8] hover:text-[#e5e1e4] transition-colors hover:bg-[#2a2a2c]/50 px-3 py-1 rounded active:scale-95">
              Tools
            </a>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 bg-[#201f22] px-3 py-1.5 rounded-full border border-white/10">
              <img 
                className="w-4 h-4 rounded-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMVyTsgD7VCKXgVK5I5LHBpp0PcAVdeTqDeuA0b928InzYUIyDHn4zDbZr8bbL24X0iZZtroGujFSIKcauQTUAZnR7LJA6Tpb76CqJR9ycDPD9gwKGejc36pHb-VTAdzXV-Q6IyKPgSiVXiGKUV3Tn8k9vQ1_Hp19MDXmwuXnAG9WE4jyjOrMlqxrPUSXhLcjv7dWcm842Jty8vD4F_4KxxaTMamK6dycy0spfePPxjCQnrYVBV8V_vg" 
                alt="Solana"
              />
              <span className="text-xs font-medium text-[#e5e1e4] font-mono">Solana</span>
            </div>
            
            <button className="bg-[#4f46e5] text-[#dad7ff] px-6 py-2 rounded-full text-xs font-medium font-mono hover:bg-[#4d44e3] transition-all duration-200 border border-[#c3c0ff]/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              Connect Wallet
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-24 pb-16 px-5 md:px-10 max-w-[1280px] mx-auto w-full relative z-10 flex flex-col gap-16">
        
        {/* Hero & Swap Terminal Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-3xl md:text-5xl font-bold text-[#e5e1e4] tracking-tight leading-tight">
              The Universal <br />
              <span className="text-[#c3c0ff]">Web3 Toolkit</span>
            </h1>
            <p className="text-base text-[#c7c4d8] max-w-md">
              Seamlessly swap tokens, bridge across networks, and deploy smart contracts from a single, high-performance terminal.
            </p>
            <div className="flex gap-4">
              <button className="bg-[#2a2a2c] border border-white/10 text-[#e5e1e4] px-6 py-3 rounded-full text-xs font-mono hover:bg-[#39393b] transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">explore</span> 
                Explore Tools
              </button>
            </div>
          </div>

          {/* Swap Terminal Card */}
          <div className="bg-[#18181B]/60 backdrop-blur-md border border-white/10 rounded-xl p-6 relative overflow-hidden group shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-[#4f46e5]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-[#e5e1e4]">Swap</h2>
              <span className="material-symbols-outlined text-[#c7c4d8] cursor-pointer hover:text-[#c3c0ff] transition-colors">
                settings
              </span>
            </div>

            <div className="space-y-2 relative">
              {/* You Pay Input */}
              <div className="bg-[#09090B] border border-white/10 rounded-lg p-4 focus-within:border-[#c3c0ff] transition-colors">
                <div className="flex justify-between text-[#c7c4d8] text-xs font-mono mb-2">
                  <span>You pay</span>
                  <span>Balance: 0.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <input 
                    type="text" 
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="bg-transparent text-2xl font-semibold text-[#e5e1e4] outline-none w-1/2" 
                    placeholder="0"
                  />
                  <button className="flex items-center gap-2 bg-[#201f22] px-3 py-1.5 rounded-full hover:bg-[#39393b] transition-colors border border-white/10">
                    <img 
                      className="w-5 h-5 rounded-full object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUoyfZUzHI1LkQwYxkHJwmF5yC1Uec-D3cOxiguljyc_xjJKQX0tqE9GVJgZ6YPeIZegPEHUHpPD7EyIg8p2x5itsV_jEoDQ6GWRiGJZRw4VFICWha4Sn8I9cTMbU9xr9OhmUdN6pprYUZCKNUq7Bc5DtUI6BP4q2uOjpCodQgu6WXnFCb5aT3kOV1lNCUytkE4iTCSFzSlo5p1iRK-7DFXW54vW3e3Zmy6113xXH3SfYWIOLTr3FWAA" 
                      alt="SOL"
                    />
                    <span className="text-xs font-mono">SOL</span>
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  </button>
                </div>
              </div>

              {/* Swap Icon Button */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <button className="bg-[#39393b] p-2 rounded-full border border-white/10 text-[#e5e1e4] hover:text-[#c3c0ff] transition-all hover:rotate-180 duration-300">
                  <span className="material-symbols-outlined">swap_vert</span>
                </button>
              </div>

              {/* You Receive Input */}
              <div className="bg-[#09090B] border border-white/10 rounded-lg p-4 focus-within:border-[#c3c0ff] transition-colors">
                <div className="flex justify-between text-[#c7c4d8] text-xs font-mono mb-2">
                  <span>You receive</span>
                </div>
                <div className="flex justify-between items-center">
                  <input 
                    type="text" 
                    value={receiveAmount}
                    onChange={(e) => setReceiveAmount(e.target.value)}
                    className="bg-transparent text-2xl font-semibold text-[#e5e1e4] outline-none w-1/2" 
                    placeholder="0"
                  />
                  <button className="flex items-center gap-2 bg-[#4f46e5]/20 px-3 py-1.5 rounded-full hover:bg-[#4f46e5]/30 transition-colors border border-[#4f46e5]/30 text-[#c3c0ff]">
                    <span className="text-xs font-mono">Select token</span>
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  </button>
                </div>
              </div>
            </div>

            <button className="w-full mt-6 bg-[#2a2a2c] text-[#c7c4d8] py-4 rounded-lg text-xs font-mono cursor-not-allowed border border-white/10">
              Connect Wallet to Swap
            </button>
          </div>
        </section>

        {/* Supported Networks Section */}
        <section className="space-y-6 border-t border-white/10 pt-12">
          <div>
            <h3 className="text-2xl font-semibold text-[#e5e1e4]">Supported Networks</h3>
            <p className="text-sm text-[#c7c4d8]">Lightning fast bridging across top chains.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Solana Card */}
            <div className="bg-[#18181B]/60 backdrop-blur-md p-4 rounded-lg flex items-center gap-4 border border-white/10 hover:border-[#c3c0ff]/50 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-[#39393b] flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                <img className="w-6 h-6 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAi3jXNZjtcefzEjaXpG5S7Fku51l6uJ-tYNXmOUbJkqm64A_2SCCFjh8HNeq3QMYV-o3-iBOOYQIq7sMffsksKzw1tUAU84TFPVb0u7JoqQ-osdWWoSYHlG-mOqzkyfpRdXXDiEOoUMfAwIugr5rrLqvJhSqh-sxcZaklwkrDesX4WqSvqFQ3BSoMQqLr2CQudkTgfg4olpfwWT_81k3xQ85hLDOgUhYPRG1L6uFwEygQgJMmAowLcCw" alt="Solana" />
              </div>
              <span className="text-xs font-mono text-[#e5e1e4]">Solana</span>
            </div>

            {/* Ethereum Card */}
            <div className="bg-[#18181B]/60 backdrop-blur-md p-4 rounded-lg flex items-center gap-4 border border-white/10 hover:border-[#c3c0ff]/50 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-[#39393b] flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                <img className="w-6 h-6 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2XFzu42Ps48XISL0JQivsLxmvdPS8N9PBzR5JLlQqNb3Nvo-kupV8vGNCDIBxX9spGqvVoQeaJFDXEJClz4muoj01TPGvYCYrsmNh5t6F5FnKA8HfrVM0h5-aqiivQDwN7V7LIkUyeIM6oQRZ8DlGR5KqZd65PKoR21gMYteLbqVYAxtwe2YzX8bUTbpH94be1ofPL_GSgq0MqbLGoAeZV24yIwq7pQTWkCANY3n2W5STR6_k_U9YrQ" alt="Ethereum" />
              </div>
              <span className="text-xs font-mono text-[#e5e1e4]">Ethereum</span>
            </div>

            {/* Polygon Card */}
            <div className="bg-[#18181B]/60 backdrop-blur-md p-4 rounded-lg flex items-center gap-4 border border-white/10 hover:border-[#c3c0ff]/50 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-[#39393b] flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                <img className="w-6 h-6 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_Irkc_ayOkZdRgPcxDUtZd5_VNBZOfXuzeQwvLvQnVikmJmoMkIsXxax5UNGItY2BairZrvICbT2POR2hej2ZIbW1jUVMrWXKAp7jmA-a2XzkQhBZwRuUKWzg_tjCQeZv5kQhyPCbIVf4AMc6okRzZjX6GEtWqjMssG_h2EjmnmiLyBOamdjorLpg1qJPypm13ZIGUDmsTDndChJYUO0BevKK36z7nmDcNiW9ioe0vNNgaZ9Jgz0YQQ" alt="Polygon" />
              </div>
              <span className="text-xs font-mono text-[#e5e1e4]">Polygon</span>
            </div>

            {/* More Networks Card */}
            <div className="bg-[#18181B]/60 backdrop-blur-md p-4 rounded-lg flex items-center gap-4 border border-white/10 hover:border-[#c3c0ff]/50 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-[#39393b] flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[#c7c4d8] group-hover:text-[#c3c0ff]">more_horiz</span>
              </div>
              <span className="text-xs font-mono text-[#e5e1e4]">12+ More</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 mt-auto bg-[#131315] border-t border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-10 max-w-[1280px] mx-auto gap-4">
          <div className="text-2xl font-bold text-[#e5e1e4]">Utilify</div>
          <div className="flex space-x-6 text-xs font-mono">
            <a href="#" className="text-[#c7c4d8] hover:text-[#c3c0ff] transition-colors">Privacy Policy</a>
            <a href="#" className="text-[#c7c4d8] hover:text-[#c3c0ff] transition-colors">Terms of Service</a>
            <a href="#" className="text-[#c7c4d8] hover:text-[#c3c0ff] transition-colors">Docs</a>
            <a href="#" className="text-[#c7c4d8] hover:text-[#c3c0ff] transition-colors">Github</a>
          </div>
          <div className="text-[#c3c0ff] text-xs font-mono">© 2024 Utilify Web3 Hub</div>
        </div>
      </footer>
    </div>
  );
}