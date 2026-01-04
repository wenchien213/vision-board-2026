import React, { useState, useRef, useEffect } from 'react';
import { VisionState, AppStep } from './types';
import { VISION_KEYWORDS } from './constants';
import { generateVisionEncouragement, generateVisionImage } from './services/geminiService';
import { PAYMENT_ASSETS } from './assets/payment';
import { VISION_GALLERY } from './assets/vision_defaults';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const initialState: VisionState = {
    name: '',
    step: AppStep.Welcome,
    tenKeywords: [],
    threeKeywords: [],
    encouragement: '',
    fiveGoals: ['', '', '', '', ''],
    finalThreeGoals: [],
    imageUrl: ''
  };

  const [state, setState] = useState<VisionState>(initialState);

  const nextStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setState(prev => ({ ...prev, step: prev.step + 1 }));
  };
  
  const resetApp = () => {
    setState(initialState);
    setIsLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = async () => {
    if (boardRef.current) {
      setIsLoading(true);
      // 給予一點時間讓 DOM 渲染完成
      setTimeout(async () => {
        try {
          const canvas = await (window as any).html2canvas(boardRef.current, {
            backgroundColor: '#ffffff',
            scale: 4, // 提高解析度
            useCORS: true,
            logging: false,
            letterRendering: true
          });
          const link = document.createElement('a');
          link.download = `2026_願景板_${state.name}.png`;
          link.href = canvas.toDataURL('image/png', 1.0);
          link.click();
        } catch (err) {
          console.error("Download error:", err);
        } finally {
          setIsLoading(false);
        }
      }, 500);
    }
  };

  const handleFinishThree = async () => {
    setIsLoading(true);
    try {
      const [msg, img] = await Promise.all([
        generateVisionEncouragement(state.name, state.threeKeywords),
        generateVisionImage(state.threeKeywords)
      ]);
      setState(prev => ({ 
        ...prev, 
        encouragement: msg, 
        imageUrl: img || VISION_GALLERY[0].url, 
        step: AppStep.WriteGoals 
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, step: AppStep.WriteGoals }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-6 flex flex-col items-center">
      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 transition-all">
          <div className="relative w-24 h-24 mb-10">
            <div className="absolute inset-0 border-2 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-t-2 border-slate-900 rounded-full animate-spin"></div>
          </div>
          <div className="serif text-3xl text-slate-800 tracking-[0.2em] mb-4 animate-pulse">正在為您開啟未來的門扉</div>
          <p className="text-slate-500 font-light tracking-widest text-sm uppercase">Synchronizing with 2026 frequency...</p>
        </div>
      )}

      <div className="max-w-4xl w-full step-transition">
        {state.step === AppStep.Welcome && (
          <div className="max-w-md mx-auto mt-24 text-center">
            <span className="text-[10px] uppercase tracking-[0.6em] text-slate-500 mb-6 block font-medium">Vision Board Creator</span>
            <h1 className="text-5xl md:text-6xl font-light mb-8 serif tracking-[0.2em] leading-tight text-slate-900">2026 願景板</h1>
            <p className="text-slate-600 mb-20 font-light leading-relaxed tracking-wide text-sm">製作屬於你、獨一無二的 2026，<br/>在未來的藍圖裡，聽見靈魂深處的回響。</p>
            <div className="relative mb-16">
              <input 
                type="text" 
                placeholder="輸入您的名字或稱呼"
                className="w-full input-elegant py-4 text-center text-xl placeholder:text-slate-400 text-slate-800 bg-transparent border-b border-slate-300 focus:border-slate-900 transition-all outline-none"
                value={state.name}
                onChange={e => setState(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <button 
              onClick={() => state.name && nextStep()}
              disabled={!state.name}
              className="w-full bg-slate-900 text-white py-6 rounded-full font-light tracking-[0.4em] text-sm hover:bg-slate-800 disabled:opacity-30 transition-all shadow-2xl shadow-slate-200 uppercase"
            >
              開啟旅程
            </button>
          </div>
        )}

        {state.step === AppStep.PickTen && (
          <div className="text-center max-w-5xl mx-auto">
            <h2 className="text-3xl mb-4 serif tracking-widest">願景本質</h2>
            <p className="text-slate-600 mb-16 font-light tracking-widest">請從以下關鍵字中，挑選 10 個最能觸動你的詞彙 ({state.tenKeywords.length}/10)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-20">
              {VISION_KEYWORDS.map(kw => {
                const active = state.tenKeywords.includes(kw);
                return (
                  <button 
                    key={kw}
                    onClick={() => {
                      if (active) setState(p => ({ ...p, tenKeywords: p.tenKeywords.filter(k => k !== kw) }));
                      else if (state.tenKeywords.length < 10) setState(p => ({ ...p, tenKeywords: [...p.tenKeywords, kw] }));
                    }}
                    className={`keyword-btn py-4 px-2 rounded-2xl border text-sm tracking-widest transition-all duration-500 ${active ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white/40 border-slate-200 text-slate-600 hover:border-slate-400'}`}
                  >
                    {kw}
                  </button>
                )
              })}
            </div>
            <div className="sticky bottom-10">
              <button 
                disabled={state.tenKeywords.length !== 10}
                onClick={nextStep}
                className="px-20 py-5 bg-slate-900 text-white rounded-full font-light tracking-[0.3em] text-sm disabled:opacity-10 shadow-2xl hover:bg-slate-800 transition-all"
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {state.step === AppStep.PickThree && (
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl mb-4 serif tracking-widest">淬鍊靈魂</h2>
            <p className="text-slate-600 mb-20 font-light tracking-widest">在 2026，你最渴望擁有的 3 個核心是？ ({state.threeKeywords.length}/3)</p>
            <div className="flex flex-wrap justify-center gap-6 mb-24">
              {state.tenKeywords.map(kw => {
                const active = state.threeKeywords.includes(kw);
                return (
                  <button 
                    key={kw}
                    onClick={() => {
                      if (active) setState(p => ({ ...p, threeKeywords: p.threeKeywords.filter(k => k !== kw) }));
                      else if (state.threeKeywords.length < 3) setState(p => ({ ...p, threeKeywords: [...p.threeKeywords, kw] }));
                    }}
                    className={`px-12 py-6 rounded-[2rem] border text-xl serif transition-all duration-700 ${active ? 'bg-white border-slate-900 text-slate-900 shadow-2xl scale-110' : 'bg-white/30 border-slate-200 text-slate-500'}`}
                  >
                    {kw}
                  </button>
                )
              })}
            </div>
            <button 
              disabled={state.threeKeywords.length !== 3}
              onClick={handleFinishThree}
              className="px-24 py-6 bg-slate-900 text-white rounded-full font-light tracking-[0.4em] text-sm disabled:opacity-10 shadow-2xl hover:bg-slate-800 transition-all"
            >
              確認願景
            </button>
          </div>
        )}

        {state.step === AppStep.WriteGoals && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-24">
              <span className="text-[10px] uppercase tracking-[0.5em] text-slate-500 mb-8 block font-medium">Core Vision</span>
              <div className="flex justify-center gap-8 mb-12 serif text-4xl text-slate-900">
                {state.threeKeywords.map(k => <span key={k} className="px-2 border-b border-slate-200">#{k}</span>)}
              </div>
              <div className="px-10 py-12 glass-panel rounded-[3rem] text-slate-700 leading-[2] font-light italic text-lg relative group">
                <span className="absolute top-4 left-6 text-6xl text-slate-200 serif">“</span>
                {state.encouragement}
                <span className="absolute bottom-4 right-6 text-6xl text-slate-200 serif rotate-180">“</span>
              </div>
            </div>
            
            <h3 className="text-center text-slate-600 mb-12 font-light tracking-widest uppercase text-xs">請寫下 2026 的 5 個具體目標</h3>
            <div className="space-y-8 mb-20">
              {state.fiveGoals.map((g, i) => (
                <div key={i} className="flex items-center group relative">
                  <span className="absolute -left-12 text-[10px] text-slate-400 serif font-bold">0{i+1}</span>
                  <input 
                    className="w-full bg-transparent border-b border-slate-300 py-4 text-slate-900 font-normal placeholder:text-slate-500 focus:border-slate-900 outline-none transition-all"
                    value={g}
                    onChange={e => {
                      const n = [...state.fiveGoals];
                      n[i] = e.target.value;
                      setState(p => ({ ...p, fiveGoals: n }));
                    }}
                    placeholder={`願景清單項目 ${i+1}`}
                  />
                </div>
              ))}
            </div>
            <button 
              disabled={!state.fiveGoals.every(g => g.trim())}
              onClick={nextStep}
              className="w-full bg-slate-900 text-white py-6 rounded-full font-light tracking-[0.4em] text-sm disabled:opacity-10 shadow-2xl hover:bg-slate-800 transition-all uppercase"
            >
              寫好了！
            </button>
          </div>
        )}

        {state.step === AppStep.RefineGoals && (
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl mb-6 serif tracking-widest leading-relaxed">很棒！你寫下了想做的事～<br/>請你靜下心，深呼吸...</h2>
            <p className="text-slate-700 mb-6 font-light leading-relaxed tracking-wide">這五件事裡，你絕對要達成的事情是哪三個呢？</p>
            <p className="text-slate-900 mb-20 font-medium tracking-[0.2em] text-sm">請挑選出最絕對的 3 個項目</p>
            
            <div className="space-y-4 mb-24">
              {state.fiveGoals.map((g, i) => {
                const active = state.finalThreeGoals.includes(g);
                return (
                  <button 
                    key={i}
                    onClick={() => {
                      if (active) setState(p => ({ ...p, finalThreeGoals: p.finalThreeGoals.filter(x => x !== g) }));
                      else if (state.finalThreeGoals.length < 3) setState(p => ({ ...p, finalThreeGoals: [...p.finalThreeGoals, g] }));
                    }}
                    className={`w-full p-8 text-left rounded-[2rem] border transition-all duration-500 flex items-center gap-6 ${active ? 'bg-white border-slate-900 shadow-xl text-slate-900 translate-x-2' : 'bg-white/30 border-slate-200 text-slate-700 hover:border-slate-400'}`}
                  >
                    <div className={`w-3 h-3 rounded-full border ${active ? 'bg-slate-900 border-slate-900' : 'border-slate-300'}`}></div>
                    <span className="font-normal tracking-wide">{g}</span>
                  </button>
                )
              })}
            </div>
            <button 
              disabled={state.finalThreeGoals.length !== 3}
              onClick={nextStep}
              className="px-24 py-6 bg-slate-900 text-white rounded-full font-light tracking-[0.4em] text-sm disabled:opacity-10 shadow-2xl hover:bg-slate-800 transition-all uppercase"
            >
              生成願景板
            </button>
          </div>
        )}

        {state.step === AppStep.FinalBoard && (
          <div className="pb-32">
            {/* 願景板主體 */}
            <div 
              ref={boardRef}
              className="bg-white p-12 md:p-32 rounded-[4rem] shadow-2xl border border-slate-50 flex flex-col items-center text-center relative overflow-hidden mb-16"
              style={{ minHeight: '1200px', width: '100%', maxWidth: '1000px', margin: '0 auto' }}
            >
              {/* 背景質感裝飾 */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#fdfcfb] rounded-full blur-[100px] -mr-64 -mt-64 opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#f3f4f6] rounded-full blur-[100px] -ml-64 -mb-64 opacity-50"></div>

              <div className="relative z-10 w-full flex flex-col items-center">
                <header className="mb-24 w-full">
                  <span className="text-[10px] uppercase tracking-[1em] text-slate-500 font-bold mb-8 block">Manifestation of 2026</span>
                  <h1 className="text-5xl md:text-6xl serif text-slate-900 mb-6 tracking-[0.2em]">{state.name}</h1>
                  <div className="h-[1px] w-24 bg-slate-900 mx-auto opacity-10"></div>
                </header>

                {/* 視覺與核心詞彙區 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-32 items-center w-full">
                  <div className="w-full">
                    <div className="aspect-[4/5] bg-slate-50 rounded-[3rem] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.12)] border-[12px] border-white">
                      {state.imageUrl ? (
                        <img src={state.imageUrl} className="w-full h-full object-cover" crossOrigin="anonymous" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 serif">Visual Reflection</div>
                      )}
                    </div>
                  </div>
                  <div className="text-left flex flex-col justify-center h-full">
                    <div className="mb-20">
                      <h3 className="text-[9px] uppercase tracking-[0.6em] text-slate-500 font-bold mb-10 border-b border-slate-100 pb-4 inline-block">The Essences</h3>
                      <div className="flex flex-col gap-6 serif text-4xl text-slate-900">
                        {state.threeKeywords.map(k => <span key={k} className="hover:translate-x-2 transition-transform duration-500">#{k}</span>)}
                      </div>
                    </div>
                    <div className="text-2xl serif italic text-slate-700 leading-[1.8] font-light border-l-[3px] border-slate-200 pl-10 py-4 max-w-sm">
                      「 {state.encouragement} 」
                    </div>
                  </div>
                </div>

                {/* 目標清單區 */}
                <div className="w-full max-w-2xl">
                  <h3 className="text-[9px] uppercase tracking-[0.6em] text-slate-500 font-bold mb-16 border-b border-slate-100 pb-4 inline-block">Milestones to reach</h3>
                  <div className="space-y-16 text-left">
                    {state.finalThreeGoals.map((g, i) => (
                      <div key={i} className="flex items-baseline group">
                        <span className="serif text-5xl text-slate-900 mr-12 font-bold group-hover:text-slate-700 transition-colors duration-700">0{i+1}</span>
                        <div className="border-b border-slate-100 pb-10 w-full">
                          <p className="text-2xl text-slate-900 font-normal tracking-widest leading-relaxed">{g}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <footer className="mt-40 text-[9px] tracking-[1.2em] text-slate-400 uppercase font-medium">
                  Future Self • Whispers of 2026 • Design by {state.name}
                </footer>
              </div>
            </div>

            {/* 控制面板 */}
            <div className="max-w-3xl mx-auto glass-panel p-12 rounded-[3.5rem] mb-12 flex flex-col items-center">
              <div className="flex flex-col sm:flex-row gap-6 w-full justify-center">
                <button onClick={handleDownload} className="px-16 py-6 bg-slate-900 text-white rounded-full font-light tracking-[0.4em] flex items-center justify-center gap-4 shadow-2xl hover:bg-slate-800 transition-all text-xs uppercase">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  下載 2026 願景
                </button>
                <button onClick={resetApp} className="px-16 py-6 bg-white border border-slate-200 text-slate-600 rounded-full font-light tracking-[0.4em] hover:bg-slate-50 transition-all text-xs uppercase">
                  重新開始
                </button>
              </div>
            </div>

            {/* 支持創作者 */}
            <div className="max-w-md mx-auto p-16 glass-panel rounded-[4rem] text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-10 text-amber-500 shadow-sm">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M4 11n2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h4 className="serif text-2xl text-slate-900 mb-6 tracking-widest">賞杯咖啡</h4>
              <p className="text-slate-700 text-xs font-light leading-relaxed mb-12 px-2 tracking-wide">
                如果這個小工具能為您的未來帶來一絲力量，<br/>歡迎贊助創作者一杯咖啡。<br/>您的支持是讓美好事物持續發芽的動力。
              </p>
              
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 mb-10 shadow-inner">
                <img 
                  src={`data:image/png;base64,${PAYMENT_ASSETS.qrCode}`} 
                  className="w-48 h-48 mx-auto mb-10 shadow-md border-[6px] border-white rounded-[2rem]" 
                  alt="Bank QR" 
                />
                <div className="text-xs text-slate-700 font-medium space-y-3">
                  <p className="tracking-[0.5em] uppercase text-[9px] text-slate-400">Bank Details</p>
                  <p className="tracking-widest">{PAYMENT_ASSETS.bankName}</p>
                  <p className="text-xl font-light tracking-[0.2em] text-slate-900">{PAYMENT_ASSETS.accountNumber}</p>
                </div>
              </div>
              
              <p className="text-[10px] text-slate-500 font-medium tracking-[0.3em] uppercase italic">✨ {PAYMENT_ASSETS.note} ✨</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;