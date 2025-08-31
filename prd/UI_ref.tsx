import React from 'react';
import { FaImage, FaFileAlt, FaThLarge, FaArrowRight } from 'react-icons/fa';

function App() {
  return (
    <div className="min-h-screen p-8 bg-white">
      <header className="flex items-center gap-4 mb-8">
        <h1 className="text-4xl font-extrabold">AI OCR Demo</h1>
        <div className="w-10 h-10 rounded-lg bg-green-400 flex items-center justify-center">
          <FaArrowRight className="text-white text-2xl rotate-180" />
        </div>
      </header>

      <main className="flex gap-8">
        {/* Left column */}
        <section className="flex-1 border-2 border-slate-900 bg-yellow-50 p-6 flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="font-bold text-lg mb-4 self-start">1. 문제 이미지 업로드</h2>
          <div className="flex flex-col items-center justify-center flex-grow text-center text-slate-400">
            <FaImage className="text-6xl mb-4" />
            <p className="text-base leading-relaxed">
              문제 이미지를 업로드하거나
              <br />
              캡쳐해서 붙여 넣으세요!
            </p>
          </div>
        </section>

        {/* Middle column */}
        <section className="flex-1 border-2 border-slate-900 bg-sky-200 p-6 flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="font-bold text-lg mb-4 self-start">2. AI OCR Demo 결과를 JSON 형식으로 확인</h2>
          <div className="flex flex-col items-center justify-center flex-grow text-center text-slate-500">
            <FaFileAlt className="text-6xl mb-4" />
            <p className="text-base leading-relaxed">
              AI OCR Demo결과가
              <br />
              JSON형식으로 표현됩니다.
            </p>
          </div>
        </section>

        {/* Right column */}
        <section className="flex-1 border-2 border-slate-900 bg-green-100 p-6 flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="font-bold text-lg mb-4 self-start">3. JSON 결과를 미리보기 형식으로 확인</h2>
          <div className="flex flex-col items-center justify-center flex-grow text-center text-slate-400">
            <FaThLarge className="text-6xl mb-4" />
            <p className="text-base leading-relaxed">
              JSON 결과를 알아보기 쉽게
              <br />
              여기에 렌더링합니다.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;