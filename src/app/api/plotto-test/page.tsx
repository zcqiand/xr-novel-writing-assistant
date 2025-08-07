'use client';

import { useState, useEffect } from 'react';
import { plottoClient, PlottoCharacter, PlottoSubject, PlottoPredicate, PlottoOutcome, PlottoConflict } from '@/lib/plotto-client';

export default function PlottoTestPage() {
  const [characters, setCharacters] = useState<PlottoCharacter[]>([]);
  const [subjects, setSubjects] = useState<PlottoSubject[]>([]);
  const [predicates, setPredicates] = useState<PlottoPredicate[]>([]);
  const [outcomes, setOutcomes] = useState<PlottoOutcome[]>([]);
  const [conflicts, setConflicts] = useState<PlottoConflict[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<PlottoCharacter | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<PlottoSubject | null>(null);
  const [selectedPredicate, setSelectedPredicate] = useState<PlottoPredicate | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<PlottoOutcome | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<PlottoConflict | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载所有数据
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [charactersData, subjectsData, predicatesData, outcomesData, conflictsData] = await Promise.all([
        plottoClient.getCharacters(),
        plottoClient.getSubjects(),
        plottoClient.getPredicates(),
        plottoClient.getOutcomes(),
        plottoClient.getConflicts(),
      ]);

      setCharacters(charactersData);
      setSubjects(subjectsData);
      setPredicates(predicatesData);
      setOutcomes(outcomesData);
      setConflicts(conflictsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索数据
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const results = await plottoClient.search(searchQuery);
      setSearchResults(results.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败');
    } finally {
      setLoading(false);
    }
  };

  // 随机选择元素
  const handleRandomSelect = async () => {
    setLoading(true);
    setError(null);
    try {
      const elements = await plottoClient.getRandomStoryElements();
      setSelectedCharacter(elements.character);
      setSelectedSubject(elements.subject);
      setSelectedPredicate(elements.predicate);
      setSelectedOutcome(elements.outcome);
      setSelectedConflict(elements.conflict);
    } catch (err) {
      setError(err instanceof Error ? err.message : '随机选择失败');
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    loadAllData();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Plotto API 测试页面</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={loadAllData}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2 disabled:opacity-50"
        >
          {loading ? '加载中...' : '重新加载数据'}
        </button>
        <button
          onClick={handleRandomSelect}
          disabled={loading}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? '选择中...' : '随机选择元素'}
        </button>
      </div>

      {/* 搜索功能 */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-3">搜索功能</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="输入搜索关键词..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            搜索
          </button>
        </div>

        {searchResults.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">搜索结果 ({searchResults.length})</h3>
            <div className="max-h-40 overflow-y-auto border rounded p-2">
              {searchResults.map((result, index) => (
                <div key={index} className="mb-2 p-2 bg-white rounded border">
                  <span className="font-medium">{result.type}:</span>
                  {result.type === 'character' && (
                    <span>{result.data.designation} - {result.data.description}</span>
                  )}
                  {result.type === 'subject' && (
                    <span>#{result.data.number} - {result.data.description}</span>
                  )}
                  {result.type === 'predicate' && (
                    <span>#{result.data.number} - {result.data.description}</span>
                  )}
                  {result.type === 'outcome' && (
                    <span>#{result.data.number} - {result.data.description}</span>
                  )}
                  {result.type === 'conflict' && (
                    <span>{result.data.id} ({result.data.category}/{result.data.subcategory})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 数据统计 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded">
          <h3 className="font-semibold">角色数量</h3>
          <p className="text-2xl">{characters.length}</p>
        </div>
        <div className="bg-green-100 p-4 rounded">
          <h3 className="font-semibold">主题数量</h3>
          <p className="text-2xl">{subjects.length}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded">
          <h3 className="font-semibold">谓词数量</h3>
          <p className="text-2xl">{predicates.length}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded">
          <h3 className="font-semibold">结果数量</h3>
          <p className="text-2xl">{outcomes.length}</p>
        </div>
        <div className="bg-red-100 p-4 rounded">
          <h3 className="font-semibold">冲突数量</h3>
          <p className="text-2xl">{conflicts.length}</p>
        </div>
      </div>

      {/* 随机选择的结果 */}
      {(selectedCharacter || selectedSubject || selectedPredicate || selectedOutcome || selectedConflict) && (
        <div className="mb-6 p-4 bg-indigo-100 rounded">
          <h2 className="text-xl font-semibold mb-3">随机选择的故事元素</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedCharacter && (
              <div className="bg-white p-3 rounded border">
                <h3 className="font-medium text-blue-600">角色</h3>
                <p><strong>标识:</strong> {selectedCharacter.designation}</p>
                <p><strong>性别:</strong> {selectedCharacter.sex}</p>
                <p><strong>描述:</strong> {selectedCharacter.description}</p>
              </div>
            )}
            {selectedSubject && (
              <div className="bg-white p-3 rounded border">
                <h3 className="font-medium text-green-600">主题</h3>
                <p><strong>编号:</strong> #{selectedSubject.number}</p>
                <p><strong>描述:</strong> {selectedSubject.description}</p>
              </div>
            )}
            {selectedPredicate && (
              <div className="bg-white p-3 rounded border">
                <h3 className="font-medium text-yellow-600">谓词</h3>
                <p><strong>编号:</strong> #{selectedPredicate.number}</p>
                <p><strong>描述:</strong> {selectedPredicate.description}</p>
              </div>
            )}
            {selectedOutcome && (
              <div className="bg-white p-3 rounded border">
                <h3 className="font-medium text-purple-600">结果</h3>
                <p><strong>编号:</strong> #{selectedOutcome.number}</p>
                <p><strong>描述:</strong> {selectedOutcome.description}</p>
              </div>
            )}
            {selectedConflict && (
              <div className="bg-white p-3 rounded border md:col-span-2">
                <h3 className="font-medium text-red-600">冲突</h3>
                <p><strong>ID:</strong> {selectedConflict.id}</p>
                <p><strong>分类:</strong> {selectedConflict.category}</p>
                <p><strong>子分类:</strong> {selectedConflict.subcategory}</p>
                <p><strong>排列数量:</strong> {selectedConflict.permutations.length}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 数据展示 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 角色列表 */}
        <div className="bg-white p-4 rounded border">
          <h2 className="text-xl font-semibold mb-3">角色列表</h2>
          <div className="max-h-60 overflow-y-auto">
            {characters.map((character, index) => (
              <div key={index} className="mb-2 p-2 border-b">
                <p><strong>{character.designation}</strong> - {character.sex}</p>
                <p className="text-sm text-gray-600">{character.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 主题列表 */}
        <div className="bg-white p-4 rounded border">
          <h2 className="text-xl font-semibold mb-3">主题列表</h2>
          <div className="max-h-60 overflow-y-auto">
            {subjects.map((subject, index) => (
              <div key={index} className="mb-2 p-2 border-b">
                <p><strong>#{subject.number}</strong> - {subject.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 谓词列表 */}
        <div className="bg-white p-4 rounded border">
          <h2 className="text-xl font-semibold mb-3">谓词列表</h2>
          <div className="max-h-60 overflow-y-auto">
            {predicates.slice(0, 10).map((predicate, index) => (
              <div key={index} className="mb-2 p-2 border-b">
                <p><strong>#{predicate.number}</strong> - {predicate.description}</p>
              </div>
            ))}
            {predicates.length > 10 && (
              <p className="text-sm text-gray-500">... 还有 {predicates.length - 10} 个谓词</p>
            )}
          </div>
        </div>

        {/* 冲突列表 */}
        <div className="bg-white p-4 rounded border">
          <h2 className="text-xl font-semibold mb-3">冲突列表</h2>
          <div className="max-h-60 overflow-y-auto">
            {conflicts.slice(0, 10).map((conflict, index) => (
              <div key={index} className="mb-2 p-2 border-b">
                <p><strong>{conflict.id}</strong> - {conflict.category}/{conflict.subcategory}</p>
              </div>
            ))}
            {conflicts.length > 10 && (
              <p className="text-sm text-gray-500">... 还有 {conflicts.length - 10} 个冲突</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}