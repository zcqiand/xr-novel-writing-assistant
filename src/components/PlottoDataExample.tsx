'use client';

import { useState, useEffect } from 'react';
import { plottoClient, PlottoCharacter, PlottoSubject, PlottoPredicate, PlottoOutcome, PlottoConflict } from '@/lib/plotto-client';

export default function PlottoDataExample() {
  const [character, setCharacter] = useState<PlottoCharacter | null>(null);
  const [subject, setSubject] = useState<PlottoSubject | null>(null);
  const [predicate, setPredicate] = useState<PlottoPredicate | null>(null);
  const [outcome, setOutcome] = useState<PlottoOutcome | null>(null);
  const [conflict, setConflict] = useState<PlottoConflict | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取随机数据
  const getRandomData = async () => {
    setLoading(true);
    setError(null);
    try {
      const elements = await plottoClient.getRandomStoryElements();
      setCharacter(elements.character);
      setSubject(elements.subject);
      setPredicate(elements.predicate);
      setOutcome(elements.outcome);
      setConflict(elements.conflict);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索数据
  const searchData = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const results = await plottoClient.search(query);
      console.log('搜索结局:', results);
      // 这里可以处理搜索结局，比如显示在界面上
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取特定数据
  const getSpecificData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 获取特定角色
      const specificCharacter = await plottoClient.getCharacter('A');
      console.log('角色A:', specificCharacter);

      // 获取特定主角类型
      const specificSubject = await plottoClient.getSubject(1);
      console.log('主角类型1:', specificSubject);

      // 获取特定冲突
      const specificConflict = await plottoClient.getConflict('1a');
      console.log('冲突1a:', specificConflict);

    } catch (err) {
      setError(err instanceof Error ? err.message : '获取特定数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取一些数据
  useEffect(() => {
    getRandomData();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Plotto 数据使用示例</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={getRandomData}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2 disabled:opacity-50"
        >
          {loading ? '加载中...' : '获取随机故事元素'}
        </button>
        <button
          onClick={() => searchData('爱情')}
          disabled={loading}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2 disabled:opacity-50"
        >
          {loading ? '搜索中...' : '搜索"爱情"'}
        </button>
        <button
          onClick={getSpecificData}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? '获取中...' : '获取特定数据'}
        </button>
      </div>

      {/* 显示获取到的数据 */}
      {(character || subject || predicate || outcome || conflict) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 角色卡片 */}
          {character && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">角色</h3>
              <div className="space-y-2">
                <p><span className="font-medium">标识:</span> {character.designation}</p>
                <p><span className="font-medium">性别:</span> {character.sex}</p>
                <p><span className="font-medium">描述:</span> {character.description}</p>
              </div>
            </div>
          )}

          {/* 主角类型卡片 */}
          {subject && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-2">主角类型</h3>
              <div className="space-y-2">
                <p><span className="font-medium">编号:</span> #{subject.number}</p>
                <p><span className="font-medium">描述:</span> {subject.description}</p>
              </div>
            </div>
          )}

          {/* 情节卡片 */}
          {predicate && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">情节</h3>
              <div className="space-y-2">
                <p><span className="font-medium">编号:</span> #{predicate.number}</p>
                <p><span className="font-medium">描述:</span> {predicate.description}</p>
                <p><span className="font-medium">关联冲突:</span> {predicate.conflictLinks.length} 个</p>
              </div>
            </div>
          )}

          {/* 结局卡片 */}
          {outcome && (
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">结局</h3>
              <div className="space-y-2">
                <p><span className="font-medium">编号:</span> #{outcome.number}</p>
                <p><span className="font-medium">描述:</span> {outcome.description}</p>
              </div>
            </div>
          )}

          {/* 冲突卡片 */}
          {conflict && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 md:col-span-2 lg:col-span-3">
              <h3 className="text-lg font-semibold text-red-800 mb-2">冲突</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><span className="font-medium">ID:</span> {conflict.id}</p>
                  <p><span className="font-medium">分类:</span> {conflict.category}</p>
                  <p><span className="font-medium">子分类:</span> {conflict.subcategory}</p>
                  <p><span className="font-medium">排列数量:</span> {conflict.permutations.length}</p>
                </div>
                <div>
                  <p><span className="font-medium">描述:</span></p>
                  <div className="mt-2 space-y-1">
                    {conflict.permutations.slice(0, 2).map((perm, index) => (
                      <p key={index} className="text-sm bg-white p-2 rounded border">
                        {perm.description}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 使用说明 */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">使用说明</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">1. 基本用法</h3>
            <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
              {`import { plottoClient } from '@/lib/plotto-client';

// 获取所有数据
const data = await plottoClient.getAllData();

// 获取特定类型的数据
const characters = await plottoClient.getCharacters();
const subjects = await plottoClient.getSubjects();
const conflicts = await plottoClient.getConflicts();`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">2. 获取特定元素</h3>
            <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
              {`// 获取特定角色
const character = await plottoClient.getCharacter('A');

// 获取特定主角类型
const subject = await plottoClient.getSubject(1);

// 获取特定冲突
const conflict = await plottoClient.getConflict('1a');`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">3. 搜索功能</h3>
            <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
              {`// 搜索所有数据
const results = await plottoClient.search('爱情');

// 搜索特定类型
const characterResults = await plottoClient.search('A', 'characters');

// 按分类搜索
const categoryResults = await plottoClient.search('爱情', 'conflicts', '爱情与求爱');`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">4. 随机选择</h3>
            <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
              {`// 获取随机角色
const randomCharacter = await plottoClient.getRandomCharacter();

// 获取随机故事元素组合
const storyElements = await plottoClient.getRandomStoryElements();`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">5. 获取分类信息</h3>
            <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
              {`// 获取所有分类
const categories = await plottoClient.getCategories();

// 获取特定分类的子分类
const subcategories = await plottoClient.getSubcategories('爱情与求爱');`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}