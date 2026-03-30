import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Edit2, Plus, Users, Coins, Sparkles, Check, X, Upload, RefreshCw, Share2 } from 'lucide-react';
import LZString from 'lz-string';

interface Player {
  id: string;
  name: string;
}

const ShuffleAnimation = ({ players }: { players: Player[] }) => {
  const [currentName, setCurrentName] = useState(players[0]?.name || '');

  useEffect(() => {
    if (players.length === 0) return;
    const interval = setInterval(() => {
      const randomPlayer = players[Math.floor(Math.random() * players.length)];
      setCurrentName(randomPlayer.name);
    }, 50);
    return () => clearInterval(interval);
  }, [players]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-md"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 0.3 }}
        className="text-5xl md:text-7xl font-black text-amber-500 tracking-wider uppercase text-center px-4"
      >
        {currentName}
      </motion.div>
      <div className="mt-12 flex items-center gap-3 text-zinc-400 text-xl font-medium">
        <RefreshCw className="w-6 h-6 animate-spin" />
        正在打乱分配顺序...
      </div>
    </motion.div>
  );
};

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [batchInput, setBatchInput] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  const [totalLoot, setTotalLoot] = useState<number | ''>('');
  
  const [isDistributing, setIsDistributing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [shuffledPlayers, setShuffledPlayers] = useState<Player[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [distributedIds, setDistributedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get('d');
    if (d) {
      try {
        const jsonStr = LZString.decompressFromEncodedURIComponent(d);
        if (jsonStr) {
          const data = JSON.parse(jsonStr);
          if (data && typeof data.t === 'number' && Array.isArray(data.n)) {
            const loadedPlayers = data.n.map((name: string) => ({ id: crypto.randomUUID(), name }));
            setPlayers(loadedPlayers);
            setShuffledPlayers(loadedPlayers);
            setTotalLoot(data.t);
            setShowResults(true);
          }
        }
      } catch (e) {
        console.error('Failed to parse shared data', e);
      }
    }
  }, []);

  const handleBatchImport = () => {
    const names = batchInput.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    const newPlayers = names.map(name => ({ id: crypto.randomUUID(), name }));
    setPlayers(prev => [...prev, ...newPlayers]);
    setBatchInput('');
    setShowResults(false);
    setIsBatchModalOpen(false);
  };

  const handleAddPlayer = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newPlayerName.trim()) {
      setPlayers(prev => [...prev, { id: crypto.randomUUID(), name: newPlayerName.trim() }]);
      setNewPlayerName('');
      setShowResults(false);
    }
  };

  const handleDeletePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    setShowResults(false);
  };

  const startEdit = (player: Player) => {
    setEditingId(player.id);
    setEditName(player.name);
  };

  const saveEdit = () => {
    if (editName.trim() && editingId) {
      setPlayers(prev => prev.map(p => p.id === editingId ? { ...p, name: editName.trim() } : p));
    }
    setEditingId(null);
    setEditName('');
    setShowResults(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const clearAll = () => {
    if (confirm('确定要清空所有玩家吗？')) {
      setPlayers([]);
      setShowResults(false);
    }
  };

  const handleDistribute = () => {
    if (players.length === 0 || !totalLoot || totalLoot <= 0) return;
    
    setIsDistributing(true);
    setShowResults(false);
    setDistributedIds(new Set());
    
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    setShuffledPlayers(shuffled);
    
    setTimeout(() => {
      setIsDistributing(false);
      setShowResults(true);
      
      // Update URL with compressed results
      const dataToShare = {
        t: totalLoot,
        n: shuffled.map(p => p.name)
      };
      const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(dataToShare));
      const newUrl = `${window.location.pathname}?d=${compressed}`;
      window.history.replaceState(null, '', newUrl);

      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }, 2500);
  };

  const handleReturn = () => {
    setShowResults(false);
    window.history.replaceState(null, '', window.location.pathname);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleDistributed = (id: string) => {
    setDistributedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const totalM = typeof totalLoot === 'number' ? totalLoot : 0;
  const perPersonM = players.length > 0 ? Math.floor(Math.round((totalM / players.length) * 10000) / 100) / 100 : 0;

  const formatM = (m: number) => {
    return m.toFixed(2) + 'm';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-amber-500/30 pb-20">
      <AnimatePresence>
        {isDistributing && <ShuffleAnimation players={players} />}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <header className="mb-10 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3 justify-center md:justify-start">
              <Sparkles className="w-8 h-8 text-amber-500" />
              Albion Loot 分配器
            </h1>
            <p className="text-zinc-400 mt-2">公平、公开的战利品分配工具</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-6 py-3 flex items-center gap-4 shadow-lg">
            <div className="flex flex-col items-center">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">总人数</span>
              <span className="text-2xl font-mono font-bold text-white">{players.length}</span>
            </div>
            <div className="w-px h-8 bg-zinc-800"></div>
            <Users className="w-6 h-6 text-zinc-600" />
          </div>
        </header>

        {!showResults && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Player Management */}
            <div className="lg:col-span-7 space-y-6">
              {/* Player List */}
              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  玩家列表
                </h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsBatchModalOpen(true)}
                    className="text-xs text-amber-500 hover:text-amber-400 px-3 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 transition-colors flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    批量导入
                  </button>
                  {players.length > 0 && (
                    <button 
                      onClick={clearAll}
                      className="text-xs text-red-400 hover:text-red-300 px-3 py-1 rounded bg-red-400/10 hover:bg-red-400/20 transition-colors"
                    >
                      清空全部
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleAddPlayer} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="输入单个玩家名字..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={!newPlayerName.trim()}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  添加
                </button>
              </form>

              <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {players.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-3"
                    >
                      <Users className="w-12 h-12 opacity-20" />
                      <p>暂无玩家，请导入或添加</p>
                    </motion.div>
                  ) : (
                    players.map((player) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3 flex items-center justify-between group hover:border-zinc-700 transition-colors overflow-hidden"
                      >
                        {editingId === player.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="flex-1 bg-zinc-900 border border-amber-500/50 rounded px-3 py-1 text-white focus:outline-none"
                              autoFocus
                              onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                            />
                            <button onClick={saveEdit} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEdit} className="p-1.5 text-zinc-400 hover:bg-zinc-800 rounded">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-zinc-300 font-medium pl-2 truncate flex-1">{player.name}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => startEdit(player)}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeletePlayer(player.id)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-md transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>

          {/* Right Column: Loot Settings & Results */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl sticky top-8">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                Loot 设置
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">总 Loot 金额 (m)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={totalLoot}
                      onChange={(e) => setTotalLoot(e.target.value ? Number(e.target.value) : '')}
                      placeholder="0.00"
                      min="0"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-12 text-2xl font-mono text-amber-500 placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                    />
                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-600" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-xl">m</span>
                  </div>
                </div>

                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800/80">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">预计人均loot</span>
                    <span className="text-xl font-mono text-white">
                      {formatM(perPersonM)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleDistribute}
                  disabled={players.length === 0 || !totalLoot || totalLoot <= 0 || isDistributing}
                  className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-amber-500/20 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  开始分配 Loot
                </button>
              </div>
            </section>
          </div>
          </div>
        )}

        {/* Results Section */}
        <AnimatePresence>
          {showResults && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 md:p-8 bg-zinc-900 border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-500/10"
            >
              <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <h2 className="text-2xl font-bold text-amber-500 flex items-center gap-3">
                  <Sparkles className="w-7 h-7" />
                  最终分配名单
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    {copied ? '已复制链接' : '分享结果'}
                  </button>
                  <button
                    onClick={handleReturn}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    返回修改
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 text-center">
                  <div className="text-zinc-400 text-sm mb-2 uppercase tracking-wider font-bold">总金额</div>
                  <div className="text-3xl font-mono text-white">{formatM(totalM)}</div>
                </div>
                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 text-center">
                  <div className="text-zinc-400 text-sm mb-2 uppercase tracking-wider font-bold">参与人数</div>
                  <div className="text-3xl font-mono text-white">{players.length}</div>
                </div>
                <div className="bg-zinc-950 p-5 rounded-xl border border-amber-500/50 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-amber-500/5"></div>
                  <div className="relative">
                    <div className="text-amber-500/80 text-sm mb-2 uppercase tracking-wider font-bold">人均loot</div>
                    <div className="text-3xl font-mono text-amber-500">{formatM(perPersonM)}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {shuffledPlayers.map((player, index) => {
                  const isDistributed = distributedIds.has(player.id);
                  return (
                    <motion.div 
                      key={player.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => toggleDistributed(player.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                        isDistributed 
                          ? 'bg-zinc-900/50 border-zinc-800/50 opacity-40 grayscale' 
                          : 'bg-zinc-950 border-zinc-800 hover:border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-sm ${
                          isDistributed
                            ? 'bg-zinc-800 text-zinc-500'
                            : index < 3 ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {index + 1}
                        </div>
                        <span className={`font-medium truncate transition-colors ${
                          isDistributed ? 'text-zinc-500 line-through' : 'text-zinc-200'
                        }`} title={player.name}>
                          {player.name}
                        </span>
                      </div>
                      <div className={`shrink-0 font-mono font-medium flex items-center gap-1.5 ml-2 transition-colors ${
                        isDistributed ? 'text-zinc-600' : 'text-amber-500'
                      }`}>
                        <Coins className="w-4 h-4 opacity-70" />
                        {formatM(perPersonM)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Batch Import Modal */}
      <AnimatePresence>
        {isBatchModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-amber-500" />
                  批量导入玩家
                </h2>
                <button 
                  onClick={() => setIsBatchModalOpen(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <textarea
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                placeholder="在此粘贴玩家名单，每行一个名字..."
                className="w-full h-48 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all resize-none font-mono text-sm"
              />
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleBatchImport}
                  disabled={!batchInput.trim()}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  导入名单
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(24, 24, 27, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(63, 63, 70, 0.8);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(82, 82, 91, 1);
        }
      `}} />
    </div>
  );
}
