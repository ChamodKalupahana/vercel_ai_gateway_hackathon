'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Trophy, Swords, Send } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type GameState = 'START' | 'LOADING' | 'BATTLE' | 'RESULTS';

interface ModelResponse {
  id: string; // Random internal ID to hide identity
  modelId: string; // Real model name
  text: string;
  wins: number;
  losses: number;
}

// --- Components ---

function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        "bg-white text-black hover:bg-neutral-200 border border-neutral-200 shadow-sm",
        "dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700 dark:border-neutral-700",
        className
      )}
      {...props}
    />
  );
}

function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg p-6", className)} {...props}>
      {children}
    </div>
  );
}

// --- Main Page ---

export default function EvalGame() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [topic, setTopic] = useState('');
  const [responses, setResponses] = useState<ModelResponse[]>([]);
  const [pairs, setPairs] = useState<[number, number][]>([]);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [error, setError] = useState('');

  const startGame = async () => {
    if (!topic.trim()) return;
    setGameState('LOADING');
    setError('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: topic }),
      });

      if (!res.ok) throw new Error('Failed to fetch responses');

      const data = await res.json();
      const rawResults: { modelId: string; text: string; status: 'success' | 'error' }[] = data.results;

      const validResponses = rawResults
        .filter(r => r.status === 'success')
        .map((r, index) => ({
          id: `model-${index}`,
          modelId: r.modelId,
          text: r.text,
          wins: 0,
          losses: 0
        }));

      if (validResponses.length < 2) {
        throw new Error("Not enough models generated responses successfully.");
      }

      setResponses(validResponses);

      // Generate Round Robin Pairs
      const newPairs: [number, number][] = [];
      for (let i = 0; i < validResponses.length; i++) {
        for (let j = i + 1; j < validResponses.length; j++) {
          newPairs.push([i, j]);
        }
      }

      // Shuffle pairs for randomness
      const shuffledPairs = newPairs.sort(() => Math.random() - 0.5);
      // Limit to 10 pairs if desired, but 5 models = 10 pairs exactly, so perfect.

      setPairs(shuffledPairs);
      setCurrentPairIndex(0);
      setGameState('BATTLE');

    } catch (e) {
      console.error(e);
      setError('Something went wrong. Please check if your API Key is valid and try again.');
      setGameState('START');
    }
  };

  const handleVote = (winnerIndex: number, loserIndex: number) => {
    setResponses(prev => {
      const next = [...prev];
      next[winnerIndex].wins += 1;
      next[loserIndex].losses += 1;
      return next;
    });

    if (currentPairIndex < pairs.length - 1) {
      setCurrentPairIndex(prev => prev + 1);
    } else {
      setGameState('RESULTS');
    }
  };

  const resetGame = () => {
    setGameState('START');
    setTopic('');
    setResponses([]);
    setPairs([]);
    setCurrentPairIndex(0);
  };

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tighter mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Arena of Minds
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Evaluating {responses.length > 0 ? responses.length : 5} AI models blindly
          </p>
        </header>

        {/* Content Area */}
        <div className="flex-1 relative w-full h-full min-h-[400px]">
          <AnimatePresence mode="wait">

            {/* START SCREEN */}
            {gameState === 'START' && (
              <motion.div
                key="start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-6 w-full max-w-md mx-auto mt-10"
              >
                <div className="w-full space-y-2">
                  <label className="text-sm font-medium ml-1">Proposed Topic / Argument</label>
                  <textarea
                    className="w-full p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-32"
                    placeholder="e.g. 'Is coffee better than tea?' or 'Explain quantum physics simply'"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        startGame();
                      }
                    }}
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button onClick={startGame} disabled={!topic.trim()} className="w-full py-4 text-lg flex items-center justify-center gap-2">
                  Enter the Arena <Swords size={20} />
                </Button>
              </motion.div>
            )}

            {/* LOADING SCREEN */}
            {gameState === 'LOADING' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full w-full py-20"
              >
                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                <p className="text-lg animate-pulse">Summoning models...</p>
                <p className="text-sm text-neutral-500">This may take a moment</p>
              </motion.div>
            )}

            {/* BATTLE SCREEN */}
            {gameState === 'BATTLE' && (
              <motion.div
                key="battle"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col"
              >
                <div className="flex justify-between items-center mb-4 px-2">
                  <span className="text-sm font-mono text-neutral-500">Match {currentPairIndex + 1} / {pairs.length}</span>
                  <div className="h-2 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${((currentPairIndex) / pairs.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 flex-1">
                  {[0, 1].map((idx) => {
                    const modelIndex = pairs[currentPairIndex][idx];
                    const response = responses[modelIndex];
                    return (
                      <Card key={response.id} className="flex flex-col h-full hover:border-blue-500 transition-colors cursor-pointer group" onClick={() => handleVote(modelIndex, pairs[currentPairIndex][idx === 0 ? 1 : 0])}>
                        <div className="flex-1 prose dark:prose-invert prose-sm overflow-y-auto max-h-[400px] mb-4">
                          <p className="whitespace-pre-wrap leading-relaxed">{response.text}</p>
                        </div>
                        <Button className="w-full mt-auto group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
                          Vote for this response
                        </Button>
                      </Card>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* RESULTS SCREEN */}
            {gameState === 'RESULTS' && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-2xl mx-auto"
              >
                <Card className="bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950">
                  <div className="flex items-center justify-center gap-3 mb-8">
                    <Trophy className="text-yellow-500 w-8 h-8" />
                    <h2 className="text-2xl font-bold">Leaderboard</h2>
                  </div>

                  <div className="space-y-3">
                    {[...responses].sort((a, b) => b.wins - a.wins).map((r, i) => (
                      <motion.div
                        key={r.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                            i === 0 ? "bg-yellow-500 text-black" :
                              i === 1 ? "bg-neutral-400 text-black" :
                                i === 2 ? "bg-orange-700 text-white" : "bg-neutral-200 dark:bg-neutral-700"
                          )}>
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-semibold">{r.modelId}</p>
                            <p className="text-xs text-neutral-500">Model {r.id.split('-')[1]}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{r.wins} Wins</div>
                          <div className="text-xs text-neutral-500">{r.losses} Losses</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-center">
                    <Button onClick={resetGame} className="w-full sm:w-auto">
                      Play Again
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
