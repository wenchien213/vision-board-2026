
import React, { useState, useEffect, useRef } from 'react';
import { VisionState, AppStep } from './types';
import { VISION_KEYWORDS } from './constants';
import { generateVisionEncouragement, generateVisionImage } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<VisionState>({
    name: '',
    step: AppStep.Welcome,
    tenKeywords: [],
    threeKeywords: [],
    encouragement: '',
    fiveGoals: ['', '', '', '', ''],
    finalThreeGoals: [],
    imageUrl: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextStep = () => setState(prev => ({ ...prev, step: prev.step + 1 }));
  const resetApp = () => setState({
    name: '',
    step: AppStep.Welcome,
    tenKeywords: [],
    threeKeywords: [],
    encouragement: '',
    fiveGoals: ['', '', '', '', ''],
    finalThreeGoals: [],
    imageUrl: ''
  });

  useEffect(() => {
    if (state.step === AppStep.WriteGoals && state.encouragement === '') {
      const fetchData = async () => {
        setIsLoading(true);
        setIsGeneratingImage(true);
        const [text, img] = await Promise.all([
          generateVisionEncouragement(state.name, state.threeKeywords),
          generateVisionImage(state.threeKeywords)
        ]);
        setState(prev => ({ ...prev, encouragement: text, imageUrl: img }));
        setIsLoading(false);
        setIsGeneratingImage(false);
      };
      fetchData();
    }
  }, [state.step, state.name, state.threeKeywords, state.encouragement]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    if (boardRef.current) {
      const canvas = await (window as any).html2canvas(boardRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `${state.name}-2026-VisionBoard.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const renderStep = () => {
    switch (state.step) {
      case AppStep.Welcome:
        return (
          <div className="flex flex-col items-center justify-center min-h-[75vh] text-center fade-in px-4">
            <div className="mb-8 w-24 h-24 bg-gradient-to-tr from-rose-100 to-indigo-100 rounded-full wabi-sabi-border animate-pulse shadow-md border border-white"></div>
            <h1 className="text-4xl md:text-6xl font-normal tracking-tight mb-4 text-slate-800">
              2026 願景板
            </h1>
            <p className="text-lg md:text-xl text-slate-500 mb-12 max-w-lg leading-relaxed font-light">
              製作屬於你、獨一無二的 2026 願景夢想版，<br/>協助你聆聽內心真正的聲音。
            </p>
            <div className="w-full max-w-sm space-y-6">
              <div className="relative group">
                <input 
                  type="text"
                  placeholder="您的名字或暱稱"
                  className="w-full bg-white/60 border-b-2 border-slate-300 py-4 px-2 text-center text-xl focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-normal text-slate-800"
                  value={state.name}
                  onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <button
                disabled={!state.name.trim()}
                onClick={nextStep}
                className="w-full bg-slate-900 text-white font-medium py-4 rounded-full hover:bg-black transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed tracking-[0.2em] text-sm uppercase"
              >
                開始探索之旅
              </button>
            </div>
          </div>
        );

      case AppStep.PickTen:
        return (
          <div className="fade-in max-w-5xl mx-auto py-12 px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-normal mb-4 text-slate-800">願景關鍵字</h2>
              <p className="text-slate-500 font-normal">請在以下關鍵字中選擇 <span className="text-indigo-600 font-bold underline decoration-indigo-200">10</span> 個最重要的詞彙</p>
              <div className="mt-6 flex justify-center gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className={`h-2 w-8 rounded-full transition-all duration-500 ${state.tenKeywords.length > i ? 'bg-indigo-500 shadow-sm' : 'bg-slate-200'}`} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3 mb-12">
              {VISION_KEYWORDS.map(word => {
                const isSelected = state.tenKeywords.includes(word);
                return (
                  <button
                    key={word}
                    onClick={() => {
                      if (isSelected) {
                        setState(prev => ({ ...prev, tenKeywords: prev.tenKeywords.filter(k => k !== word) }));
                      } else if (state.tenKeywords.length < 10) {
                        setState(prev => ({ ...prev, tenKeywords: [...prev.tenKeywords, word] }));
                      }
                    }}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all duration-300 ${
                      isSelected 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-105' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
            <button
              disabled={state.tenKeywords.length !== 10}
              onClick={nextStep}
              className="w-full max-w-md mx-auto block bg-slate-900 text-white font-medium py-4 rounded-full hover:bg-black transition-all shadow-xl disabled:opacity-30 tracking-widest uppercase text-sm"
            >
              已選好核心關鍵字
            </button>
          </div>
        );

      case AppStep.PickThree:
        return (
          <div className="fade-in max-w-2xl mx-auto py-12 px-4 text-center">
            <h2 className="text-3xl font-normal mb-6 text-slate-800">淬鍊願景</h2>
            <p className="text-slate-500 mb-12 font-normal">請從剛才的 10 個詞彙中，選出 <span className="text-slate-900 font-bold underline decoration-amber-300">絕對重要</span> 的 3 個</p>
            <div className="flex flex-wrap justify-center gap-5 mb-16">
              {state.tenKeywords.map(word => {
                const isSelected = state.threeKeywords.includes(word);
                return (
                  <button
                    key={word}
                    onClick={() => {
                      if (isSelected) {
                        setState(prev => ({ ...prev, threeKeywords: prev.threeKeywords.filter(k => k !== word) }));
                      } else if (state.threeKeywords.length < 3) {
                        setState(prev => ({ ...prev, threeKeywords: [...prev.threeKeywords, word] }));
                      }
                    }}
                    className={`px-10 py-5 rounded-2xl border-2 transition-all text-xl font-medium ${
                      isSelected 
                        ? 'bg-white border-indigo-500 text-indigo-700 shadow-lg transform -translate-y-2' 
                        : 'bg-white/60 text-slate-400 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
            <button
              disabled={state.threeKeywords.length !== 3}
              onClick={nextStep}
              className="w-full max-w-md mx-auto block bg-slate-900 text-white font-medium py-4 rounded-full hover:bg-black transition-all shadow-xl disabled:opacity-30 tracking-widest uppercase text-sm"
            >
              選好了
            </button>
          </div>
        );

      case AppStep.WriteGoals:
        return (
          <div className="fade-in max-w-3xl mx-auto py-12 px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-light mb-6 text-slate-600 tracking-wider">你的 2026 願景關鍵字</h2>
              <div className="flex justify-center gap-8 mb-10">
                {state.threeKeywords.map(k => (
                  <span key={k} className="text-3xl font-medium text-slate-900 border-b-2 border-indigo-400 px-3 pb-1">{k}</span>
                ))}
              </div>
              
              <div className="glass-panel p-10 rounded-[2rem] mb-12 min-h-[140px] flex flex-col items-center justify-center border-2 border-white/50">
                {isLoading ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <span className="text-slate-600 font-medium">正在聆聽內心的聲音...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-xl md:text-2xl font-normal text-slate-700 italic leading-relaxed mb-8 px-4">
                      「 {state.encouragement} 」
                    </p>
                    {state.imageUrl && (
                       <div className="relative group w-40 h-40 overflow-hidden rounded-full shadow-lg border-4 border-white">
                         <img src={state.imageUrl} alt="AI Visual" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />
                       </div>
                    )}
                  </>
                )}
              </div>
              
              <p className="text-slate-600 text-base mb-12 font-medium">
                寫下 2026 年想達成的目標清單，讓願景轉化為行動。
              </p>
            </div>
            
            <div className="space-y-8 mb-16">
              {state.fiveGoals.map((goal, idx) => (
                <div key={idx} className="flex items-center group">
                  <span className="text-slate-400 font-bold mr-6 text-xl">{idx + 1}.</span>
                  <input
                    type="text"
                    placeholder={`願景清單項目 ${idx + 1}...`}
                    className="flex-1 bg-transparent border-b-2 border-slate-200 py-3 px-2 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 text-slate-800 text-lg font-medium"
                    value={goal}
                    onChange={(e) => {
                      const newGoals = [...state.fiveGoals];
                      newGoals[idx] = e.target.value;
                      setState(prev => ({ ...prev, fiveGoals: newGoals }));
                    }}
                  />
                </div>
              ))}
            </div>

            <button
              disabled={state.fiveGoals.some(g => !g.trim()) || isLoading}
              onClick={nextStep}
              className="w-full bg-slate-900 text-white font-medium py-4 rounded-full hover:bg-black transition-all shadow-xl disabled:opacity-30 tracking-widest uppercase text-sm"
            >
              寫好了
            </button>
          </div>
        );

      case AppStep.RefineGoals:
        return (
          <div className="fade-in max-w-2xl mx-auto py-12 px-4 text-center">
            <div className="mb-12">
              <h2 className="text-3xl font-normal mb-8 text-slate-800">最終淬鍊</h2>
              <p className="text-slate-500 font-medium leading-relaxed mb-4">
                請再次靜下心，深深地呼吸...
              </p>
              <p className="text-indigo-900 font-bold text-2xl">
                這五件事裡，哪三個是你絕對要實現的？
              </p>
            </div>

            <div className="space-y-5 mb-16">
              {state.fiveGoals.map((goal, idx) => {
                const isSelected = state.finalThreeGoals.includes(goal);
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (isSelected) {
                        setState(prev => ({ ...prev, finalThreeGoals: prev.finalThreeGoals.filter(g => g !== goal) }));
                      } else if (state.finalThreeGoals.length < 3) {
                        setState(prev => ({ ...prev, finalThreeGoals: [...prev.finalThreeGoals, goal] }));
                      }
                    }}
                    className={`w-full text-left p-7 rounded-3xl border-2 transition-all flex items-center ${
                      isSelected 
                        ? 'bg-white border-indigo-500 shadow-lg translate-x-2' 
                        : 'bg-white/60 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 mr-6 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                      {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`text-xl font-medium ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>{goal}</span>
                  </button>
                );
              })}
            </div>

            <button
              disabled={state.finalThreeGoals.length !== 3}
              onClick={nextStep}
              className="w-full bg-slate-900 text-white font-medium py-4 rounded-full hover:bg-black transition-all shadow-xl disabled:opacity-30 tracking-widest uppercase text-sm"
            >
              完成製作
            </button>
          </div>
        );

      case AppStep.FinalBoard:
        return (
          <div className="fade-in max-w-2xl mx-auto py-12 px-4 pb-24">
            <div 
              ref={boardRef}
              className="bg-white p-12 md:p-16 rounded-[4rem] shadow-[0_20px_70px_rgba(0,0,0,0.06)] border border-slate-100 mb-12 relative overflow-hidden flex flex-col items-center"
              style={{ minHeight: '900px' }}
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#f8f5f2] rounded-full blur-[100px] -mr-48 -mt-48 opacity-80"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#edf2f7] rounded-full blur-[100px] -ml-48 -mb-48 opacity-80"></div>
              
              <div className="relative z-10 w-full flex flex-col items-center h-full">
                <header className="text-center mb-12">
                  <span className="text-xs tracking-[0.5em] text-slate-400 font-bold uppercase mb-4 block">Manifesting 2026</span>
                  <h1 className="text-4xl font-normal text-slate-900 tracking-widest">
                    {state.name} <span className="text-slate-400 mx-2 font-light">的</span> 願景板
                  </h1>
                </header>

                <div className="w-full aspect-square max-w-[340px] mb-12 relative group">
                  <div className="absolute inset-0 border-2 border-slate-200 translate-x-4 translate-y-4 rounded-3xl z-0"></div>
                  <div className="relative z-10 w-full h-full overflow-hidden rounded-3xl border-4 border-white shadow-md bg-slate-50">
                    {state.imageUrl ? (
                      <img src={state.imageUrl} alt="2026 Vision" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 font-light italic">
                        No image selected
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-3 -right-3 bg-slate-900 p-3 rounded-full shadow-xl z-20 cursor-pointer hover:scale-110 transition-all border-2 border-white"
                       onClick={() => fileInputRef.current?.click()}>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>

                <section className="w-full mb-12 text-center">
                  <div className="flex justify-center gap-5 mb-8">
                    {state.threeKeywords.map(k => (
                      <span key={k} className="text-slate-900 font-bold tracking-[0.2em] text-sm border-b-2 border-amber-200 pb-1">{k}</span>
                    ))}
                  </div>
                  <div className="px-8">
                    <p className="text-2xl font-normal italic text-slate-800 leading-relaxed">
                      「 {state.encouragement} 」
                    </p>
                  </div>
                </section>

                <section className="w-full flex-1 max-w-md">
                  <div className="mb-10 text-center">
                    <h3 className="text-sm tracking-[0.4em] text-slate-500 font-bold uppercase mb-4">2026 一定會完成的事</h3>
                    <div className="h-0.5 w-12 bg-indigo-200 mx-auto"></div>
                  </div>
                  <div className="space-y-8 px-4">
                    {state.finalThreeGoals.map((goal, idx) => (
                      <div key={idx} className="flex items-baseline">
                        <span className="text-sm text-indigo-400 font-black mr-6">0{idx + 1}</span>
                        <p className="text-xl text-slate-800 font-medium tracking-wide">{goal}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <footer className="mt-20 pt-10 border-t border-slate-100 w-full text-center text-slate-300 text-[11px] tracking-[0.4em] uppercase font-bold">
                  Studio • Whispers of 2026
                </footer>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 max-w-md mx-auto">
              <button
                onClick={handleDownload}
                className="flex-1 bg-slate-900 text-white font-medium py-4 rounded-full hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 tracking-[0.2em] uppercase text-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                下載保存
              </button>
              <button
                onClick={resetApp}
                className="flex-1 bg-white text-slate-600 border-2 border-slate-200 font-medium py-4 rounded-full hover:bg-slate-50 transition-all shadow-sm tracking-[0.2em] uppercase text-sm"
              >
                重啟對話
              </button>
            </div>
            <p className="mt-8 text-center text-slate-500 text-xs font-medium bg-white/50 backdrop-blur inline-block mx-auto px-4 py-2 rounded-full border border-white/80">
              💡 提示：點擊圖片右下角的相機，可換成自己的夢想照片。
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      {state.step > AppStep.Welcome && state.step < AppStep.FinalBoard && (
        <div className="w-full max-w-md mb-16 flex items-center gap-2">
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s} 
              className={`h-1.5 flex-1 transition-all duration-1000 rounded-full ${
                state.step >= s ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.3)]' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      )}

      <main className="w-full max-w-6xl flex-1 flex flex-col justify-center">
        {renderStep()}
      </main>

      <footer className="w-full text-center text-slate-400 py-12 text-[11px] tracking-[0.5em] uppercase font-bold">
        2026 Vision Board Studio • Serenity & Intention
      </footer>
    </div>
  );
};

export default App;
