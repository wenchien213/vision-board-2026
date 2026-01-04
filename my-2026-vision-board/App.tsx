
import React, { useState, useEffect, useRef } from 'react';
import { VisionState, AppStep } from './types';
import { VISION_KEYWORDS } from './constants';
import { generateVisionEncouragement, generateVisionImage } from './services/geminiService';
import { PAYMENT_ASSETS } from './assets/payment';
import { VISION_GALLERY } from './assets/vision_defaults';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean>(true);
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

  const nextStep = () => setState(prev => ({ ...prev, step: prev.step + 1 }));
  
  // 修正：手動重設所有狀態，而不使用會導致報錯的 window.location.reload()
  const resetApp = () => {
    setState(initialState);
    setIsLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = async () => {
    if (boardRef.current) {
      const canvas = await (window as any).html2canvas(boardRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        useCORS: true,
        logging: false
      });
      const link = document.createElement('a');
      link.download = `${state.name}_2026_願景板.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const handleFinishThree = async () => {
    setIsLoading(true);
    try {
      const [msg, img] = await Promise.all([
        generateVisionEncouragement(state.name, state.threeKeywords),
        generateVisionImage(state.threeKeywords)
      ]);
      setState(prev => ({ ...prev, encouragement: msg, imageUrl: img || VISION_GALLERY[0].url, step: AppStep.WriteGoals }));
    } catch (err: any) {
      if (err.message === "QUOTA_LIMIT") {
        setHasKey(false);
      }
      setState(prev => ({ ...prev, step: AppStep.WriteGoals }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyDialog = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  if (!hasKey) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="glass-panel p-10 rounded-3xl max-w-md text-center">
          <h2 className="text-xl font-medium mb-4">系統繁忙中</h2>
          <p className="text-slate-500 mb-8 text-sm">目前使用人數較多，若要繼續體驗高品質生成，請選取您的個人 API 金鑰。</p>
          <button onClick={handleKeyDialog} className="w-full bg-slate-800 text-white py-4 rounded-full font-light tracking-widest uppercase">選取金鑰</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 flex flex-col items-center">
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 border-2 border-indigo-100 border-t-indigo-400 rounded-full animate-spin mb-8"></div>
          <div className="serif text-2xl text-slate-700 animate-pulse tracking-widest">宇宙正在編織你的專屬祝福小語</div>
          <p className="mt-4 text-slate-400 font-light tracking-wide">正在同步未來的頻率...</p>
        </div>
      )}

      <div className="max-w-4xl w-full fade-in">
        {state.step === AppStep.Welcome && (
          <div className="max-w-md mx-auto mt-20 text-center">
            <h1 className="text-4xl md:text-5xl font-light mb-4 serif tracking-widest">2026 願景板</h1>
            <p className="text-slate-500 mb-16 font-light leading-relaxed">製作屬於你、獨一無二的 2026 願景夢想版，<br/>協助你聆聽內心真正的聲音</p>
            <input 
              type="text" 
              placeholder="您的名字或暱稱"
              className="w-full input-elegant py-4 text-center text-xl mb-12 placeholder:text-slate-300"
              value={state.name}
              onChange={e => setState(p => ({ ...p, name: e.target.value }))}
            />
            <button 
              onClick={() => state.name && nextStep()}
              className="w-full bg-slate-900 text-white py-5 rounded-full font-light tracking-[0.3em] button-hover shadow-xl shadow-slate-200"
            >
              開始
            </button>
          </div>
        )}

        {state.step === AppStep.PickTen && (
          <div className="text-center">
            <h2 className="text-2xl mb-2 serif">願景關鍵字</h2>
            <p className="text-slate-400 mb-12 font-light">請在以下關鍵字中選擇 10 個對你來說最重要的詞彙 ({state.tenKeywords.length}/10)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-16">
              {VISION_KEYWORDS.map(kw => {
                const active = state.tenKeywords.includes(kw);
                return (
                  <button 
                    key={kw}
                    onClick={() => {
                      if (active) setState(p => ({ ...p, tenKeywords: p.tenKeywords.filter(k => k !== kw) }));
                      else if (state.tenKeywords.length < 10) setState(p => ({ ...p, tenKeywords: [...p.tenKeywords, kw] }));
                    }}
                    className={`p-3 rounded-xl border text-sm transition-all duration-500 ${active ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white/50 border-slate-100 text-slate-500 hover:bg-white'}`}
                  >
                    {kw}
                  </button>
                )
              })}
            </div>
            <button 
              disabled={state.tenKeywords.length !== 10}
              onClick={nextStep}
              className="px-16 py-4 bg-slate-900 text-white rounded-full font-light tracking-widest disabled:opacity-20 shadow-lg"
            >
              選好了
            </button>
          </div>
        )}

        {state.step === AppStep.PickThree && (
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl mb-2 serif">淬鍊願景</h2>
            <p className="text-slate-400 mb-12 font-light">請從這 10 個詞彙中，選出絕對重要的 3 個 ({state.threeKeywords.length}/3)</p>
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              {state.tenKeywords.map(kw => {
                const active = state.threeKeywords.includes(kw);
                return (
                  <button 
                    key={kw}
                    onClick={() => {
                      if (active) setState(p => ({ ...p, threeKeywords: p.threeKeywords.filter(k => k !== kw) }));
                      else if (state.threeKeywords.length < 3) setState(p => ({ ...p, threeKeywords: [...p.threeKeywords, kw] }));
                    }}
                    className={`px-8 py-4 rounded-2xl border text-lg transition-all ${active ? 'bg-white border-indigo-300 text-indigo-600 shadow-xl' : 'bg-white/50 border-slate-100 text-slate-400'}`}
                  >
                    {kw}
                  </button>
                )
              })}
            </div>
            <button 
              disabled={state.threeKeywords.length !== 3}
              onClick={handleFinishThree}
              className="px-16 py-4 bg-slate-900 text-white rounded-full font-light tracking-widest disabled:opacity-20 shadow-lg"
            >
              選好了
            </button>
          </div>
        )}

        {state.step === AppStep.WriteGoals && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-lg text-slate-400 mb-4 font-light tracking-widest uppercase">你的 2026 願景關鍵字為</h2>
              <div className="flex justify-center gap-6 mb-8 serif text-3xl text-indigo-900">
                {state.threeKeywords.map(k => <span key={k}>#{k}</span>)}
              </div>
              <div className="p-8 bg-indigo-50/50 rounded-3xl italic text-slate-700 leading-relaxed font-light mb-4">
                「 {state.encouragement} 」
              </div>
            </div>
            
            <p className="text-slate-500 mb-8 font-light text-center">請寫下 2026 年想達成的 5 個目標清單</p>
            <div className="space-y-6 mb-16">
              {state.fiveGoals.map((g, i) => (
                <div key={i} className="flex items-center group">
                  <span className="text-slate-300 mr-4 font-light">{i+1}.</span>
                  <input 
                    className="flex-1 input-elegant py-3"
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
              className="w-full bg-slate-900 text-white py-5 rounded-full font-light tracking-widest disabled:opacity-20 shadow-lg"
            >
              寫好了
            </button>
          </div>
        )}

        {state.step === AppStep.RefineGoals && (
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl mb-4 serif">最終淬鍊</h2>
            <p className="text-slate-500 mb-4 font-light leading-relaxed">很棒！你寫下了想做的事～<br/>現在我們再來淬鍊一下，請你靜下心，深呼吸...</p>
            <p className="text-indigo-600 mb-12 font-medium tracking-wide">這五件事裡，你絕對要實現的哪三個呢？</p>
            
            <div className="space-y-4 mb-16">
              {state.fiveGoals.map((g, i) => {
                const active = state.finalThreeGoals.includes(g);
                return (
                  <button 
                    key={i}
                    onClick={() => {
                      if (active) setState(p => ({ ...p, finalThreeGoals: p.finalThreeGoals.filter(x => x !== g) }));
                      else if (state.finalThreeGoals.length < 3) setState(p => ({ ...p, finalThreeGoals: [...p.finalThreeGoals, g] }));
                    }}
                    className={`w-full p-6 text-left rounded-3xl border transition-all ${active ? 'bg-white border-indigo-400 shadow-md text-indigo-700' : 'bg-white/50 border-slate-100 text-slate-500'}`}
                  >
                    {g}
                  </button>
                )
              })}
            </div>
            <button 
              disabled={state.finalThreeGoals.length !== 3}
              onClick={nextStep}
              className="px-20 py-5 bg-slate-900 text-white rounded-full font-light tracking-widest disabled:opacity-20 shadow-lg"
            >
              完成製作！
            </button>
          </div>
        )}

        {state.step === AppStep.FinalBoard && (
          <div className="pb-20">
            <div 
              ref={boardRef}
              className="bg-white p-8 md:p-20 rounded-[3rem] shadow-2xl border border-slate-50 flex flex-col items-center text-center relative overflow-hidden mb-12"
              style={{ minHeight: '800px' }}
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/40 rounded-full blur-3xl -mr-48 -mt-48"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-50/40 rounded-full blur-3xl -ml-48 -mb-48"></div>

              <div className="relative z-10 w-full">
                <header className="mb-16">
                  <h1 className="text-4xl serif text-slate-900 mb-4 tracking-widest">{state.name} 的 2026 願景板</h1>
                  <div className="h-0.5 w-12 bg-slate-900 mx-auto opacity-20"></div>
                </header>

                <div className="flex flex-col lg:flex-row gap-16 mb-24 items-center">
                  <div className="w-full lg:w-1/2">
                    <div className="aspect-square bg-slate-50 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
                      {state.imageUrl ? <img src={state.imageUrl} className="w-full h-full object-cover" crossOrigin="anonymous" /> : <div className="w-full h-full flex items-center justify-center text-slate-300">願景視覺</div>}
                    </div>
                  </div>
                  <div className="w-full lg:w-1/2 text-left">
                    <div className="mb-12">
                      <h3 className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-bold mb-6">三個 2026 關鍵字</h3>
                      <div className="flex flex-wrap gap-5 serif text-3xl text-indigo-900">
                        {state.threeKeywords.map(k => <span key={k}>#{k}</span>)}
                      </div>
                    </div>
                    <div className="text-2xl serif italic text-slate-700 leading-relaxed border-l-2 border-indigo-100 pl-8 py-2">
                      「 {state.encouragement} 」
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-xl mx-auto">
                  <h3 className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-bold mb-12">2026 一定會完成的事</h3>
                  <div className="space-y-12 text-left">
                    {state.finalThreeGoals.map((g, i) => (
                      <div key={i} className="flex items-baseline border-b border-slate-50 pb-8">
                        <span className="serif text-4xl text-indigo-200 mr-10 font-light">0{i+1}</span>
                        <p className="text-2xl text-slate-800 font-light tracking-wide leading-snug">{g}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <footer className="mt-32 text-[9px] tracking-[0.8em] text-slate-300 uppercase">
                  Studio • Whispers of 2026 • {new Date().getFullYear()}
                </footer>
              </div>
            </div>

            {/* 控制面板：切換圖片與下載 */}
            <div className="max-w-3xl mx-auto glass-panel p-8 rounded-[2.5rem] mb-12 flex flex-col items-center">
              <h4 className="serif text-slate-700 mb-6 tracking-widest">更換願景視覺</h4>
              
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {VISION_GALLERY.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => setState(p => ({ ...p, imageUrl: item.url }))}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${state.imageUrl === item.url ? 'border-indigo-400 scale-110 shadow-lg' : 'border-white opacity-60 hover:opacity-100'}`}
                  >
                    <img src={item.url} className="w-full h-full object-cover" alt={item.title} />
                  </button>
                ))}
                
                {/* 上傳按鈕 */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-400 transition-all bg-white"
                >
                  <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="text-[8px]">上傳</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>
              <p className="text-[10px] text-slate-400 mb-10 tracking-widest italic">✨ 可上傳您喜歡的圖片</p>

              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button onClick={handleDownload} className="px-12 py-5 bg-slate-900 text-white rounded-full font-light tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-slate-800 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  下載願景板
                </button>
                <button onClick={resetApp} className="px-12 py-5 bg-white border border-slate-200 text-slate-600 rounded-full font-light tracking-widest hover:bg-slate-50 transition-colors">
                  再玩一次
                </button>
              </div>
            </div>

            {/* 贊助資訊 */}
            <div className="max-w-md mx-auto p-12 glass-panel rounded-[3rem] text-center border-indigo-50 shadow-2xl shadow-indigo-100/30">
              <div className="flex justify-center mb-8">
                 <div className="p-4 bg-amber-50 rounded-full text-amber-500 shadow-sm">
                   <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M4 11n2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </div>
              </div>
              <h4 className="serif text-xl text-slate-800 mb-4 tracking-widest">賞杯咖啡，支持創作者</h4>
              <p className="text-slate-500 text-xs font-light leading-relaxed mb-10 px-4">
                這是一個希望能溫暖人心的工具。<br/>如果您喜歡這個作品，歡迎贊助一杯咖啡，<br/>支持獨立開發者持續創作！
              </p>
              
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 mb-10 shadow-inner">
                <img 
                  src={`data:image/png;base64,${PAYMENT_ASSETS.qrCode}`} 
                  className="w-40 h-40 mx-auto mb-8 shadow-md border-4 border-white rounded-2xl" 
                  alt="Bank QR" 
                />
                <div className="text-xs text-slate-600 font-medium space-y-2">
                  <p className="tracking-widest">{PAYMENT_ASSETS.bankName}</p>
                  <p className="text-lg font-light tracking-widest text-slate-800">{PAYMENT_ASSETS.accountNumber}</p>
                </div>
              </div>
              
              <p className="text-[10px] text-indigo-400 font-medium tracking-[0.2em] uppercase">✨ {PAYMENT_ASSETS.note} ✨</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
