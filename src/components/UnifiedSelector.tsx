import React, { useState, useEffect } from 'react';

interface Protagonist {
  id: string;
  description: string;
}

interface Predicate {
  id: string;
  name: string;
  description: string;
  conflictLinks?: Array<{
    ref: string;
    category: string;
    subcategory: string;
  }>;
}

interface Outcome {
  id: string;
  name: string;
  description: string;
}

interface Conflict {
  id: string;
  name: string;
  description: string;
  details?: string;
  leadUps?: Array<{
    mode: string;
    conflictLinks: Array<{
      ref: string;
      category: string;
      subcategory: string;
    }>;
  }>;
  carryOns?: Array<{
    mode: string;
    conflictLinks: Array<{
      ref: string;
      category: string;
      subcategory: string;
    }>;
  }>;
  includes?: Array<{
    mode: string;
    conflictLinks: Array<{
      ref: string;
      category: string;
      subcategory: string;
    }>;
  }>;
}

interface UnifiedSelectorProps {
  protagonists: Protagonist[];
  selectedProtagonist: Protagonist | null;
  onProtagonistChange: (protagonist: Protagonist) => void;

  predicates: Predicate[];
  selectedPredicate: string | null;
  onPredicateChange: (predicateId: string) => void;

  outcomes: Outcome[];
  selectedOutcome: string | null;
  onOutcomeChange: (outcomeId: string) => void;

  conflicts: Conflict[];
  selectedConflicts: string[];
  onConflictSelect?: (conflictId: string) => void;
  onConflictRemove?: (conflictId: string) => void;

  selectedLength?: 'short' | 'medium' | 'long';
  onLengthChange?: (length: 'short' | 'medium' | 'long') => void;
}

export default function UnifiedSelector({
  protagonists,
  selectedProtagonist,
  onProtagonistChange,
  predicates,
  selectedPredicate,
  onPredicateChange,
  outcomes,
  selectedOutcome,
  onOutcomeChange,
  conflicts,
  selectedConflicts,
  onConflictSelect,
  onConflictRemove,
  selectedLength,
  onLengthChange
}: UnifiedSelectorProps) {
  const [recommendedConflicts, setRecommendedConflicts] = useState<Conflict[]>([]);
  const [leadUpConflicts, setLeadUpConflicts] = useState<Conflict[]>([]);
  const [carryOnConflicts, setCarryOnConflicts] = useState<Conflict[]>([]);
  const [includeConflicts, setIncludeConflicts] = useState<Conflict[]>([]);
  // TODO: 验证这些状态变量是否需要使用 - 暂时保留以备将来UI扩展
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showLeadUpConflicts, setShowLeadUpConflicts] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showCarryOnConflicts, setShowCarryOnConflicts] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showIncludeConflicts, setShowIncludeConflicts] = useState(false);

  // 根据选择的情节发展获取关联的冲突
  useEffect(() => {

    // 只有在没有选择冲突时，才根据情节发展推荐冲突
    if (selectedPredicate && selectedConflicts.length === 0) {
      const predicate = predicates.find(p => p.id === selectedPredicate);
      if (predicate) {

        // 获取与当前情节发展关联的冲突
        const relatedConflictIds = predicate.conflictLinks?.map(link => link.ref) || [];
        const relatedConflicts = conflicts.filter(conflict =>
          relatedConflictIds.includes(conflict.id)
        );

        // 如果没有直接关联的冲突，则推荐所有冲突
        let finalConflicts = relatedConflicts;
        if (relatedConflicts.length === 0) {
          finalConflicts = conflicts;
        }

        // 如果冲突数量大于3，随机选择3个
        if (finalConflicts.length > 3) {
          finalConflicts = getRandomConflicts(finalConflicts, 3);
        }

        setRecommendedConflicts(finalConflicts);
      }
    } else if (selectedConflicts.length === 0 && !selectedPredicate) {
      setRecommendedConflicts([]);
    }
  }, [selectedPredicate, predicates, conflicts, selectedConflicts]);

  // 随机选择指定数量的冲突
  const getRandomConflicts = (conflictList: Conflict[], count: number): Conflict[] => {
    const shuffled = [...conflictList].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // 获取前置冲突、后续冲突和包含冲突（只处理最后一个冲突）
  const getRelatedConflicts = React.useCallback((selectedConflictIds: string[]) => {
    const leadUpConflicts: Conflict[] = [];
    const carryOnConflicts: Conflict[] = [];
    const includeConflicts: Conflict[] = [];

    // 只处理最后一个冲突
    if (selectedConflictIds.length > 0) {
      const lastConflictId = selectedConflictIds[selectedConflictIds.length - 1];
      const lastConflict = conflicts.find(c => c.id === lastConflictId);

      if (lastConflict) {
        console.log(`🔍 [getRelatedConflicts] 处理最后一个冲突: ${lastConflict.id}`);

        // 获取前置冲突
        if (lastConflict.leadUps && lastConflict.leadUps.length > 0) {
          lastConflict.leadUps.forEach((group, _groupIndex) => {
            // TODO: 验证 groupIndex 参数是否需要使用
            console.log('🔍 [UnifiedSelector] leadUps groupIndex 未使用:', _groupIndex);

            group.conflictLinks.forEach(link => {
              const linkedConflict = conflicts.find(c => c.id === link.ref);
              if (linkedConflict) {
                const isAlreadySelected = selectedConflictIds.includes(linkedConflict.id);
                const isAlreadyInLeadUps = leadUpConflicts.find(c => c.id === linkedConflict.id);

                if (!isAlreadySelected && !isAlreadyInLeadUps) {
                  leadUpConflicts.push(linkedConflict);
                  console.log(`🔍 [getRelatedConflicts] 添加前置冲突: ${linkedConflict.id}`);
                } else {
                  console.log(`🔍 [getRelatedConflicts] 跳过前置冲突: ${linkedConflict.id} (已选择=${isAlreadySelected}, 已在列表中=${!!isAlreadyInLeadUps})`);
                }
              } else {
                console.log(`🔍 [getRelatedConflicts] 未找到前置冲突: ${link.ref}`);
              }
            });
          });
        }

        // 获取后续冲突
        if (lastConflict.carryOns && lastConflict.carryOns.length > 0) {
          lastConflict.carryOns.forEach((group, _groupIndex) => {
            // TODO: 验证 groupIndex 参数是否需要使用
            console.log('🔍 [UnifiedSelector] carryOns groupIndex 未使用:', _groupIndex);

            group.conflictLinks.forEach(link => {
              const linkedConflict = conflicts.find(c => c.id === link.ref);
              if (linkedConflict) {
                const isAlreadySelected = selectedConflictIds.includes(linkedConflict.id);
                const isAlreadyInCarryOns = carryOnConflicts.find(c => c.id === linkedConflict.id);

                if (!isAlreadySelected && !isAlreadyInCarryOns) {
                  carryOnConflicts.push(linkedConflict);
                  console.log(`🔍 [getRelatedConflicts] 添加后续冲突: ${linkedConflict.id}`);
                } else {
                  console.log(`🔍 [getRelatedConflicts] 跳过后续冲突: ${linkedConflict.id} (已选择=${isAlreadySelected}, 已在列表中=${!!isAlreadyInCarryOns})`);
                }
              } else {
                console.log(`🔍 [getRelatedConflicts] 未找到后续冲突: ${link.ref}`);
              }
            });
          });
        }

        // 获取包含冲突
        if (lastConflict.includes && lastConflict.includes.length > 0) {
          lastConflict.includes.forEach((group, _groupIndex) => {
            // TODO: 验证 groupIndex 参数是否需要使用
            console.log('🔍 [UnifiedSelector] includes groupIndex 未使用:', _groupIndex);

            group.conflictLinks.forEach(link => {
              const linkedConflict = conflicts.find(c => c.id === link.ref);
              if (linkedConflict) {
                const isAlreadySelected = selectedConflictIds.includes(linkedConflict.id);
                const isAlreadyInIncludes = includeConflicts.find(c => c.id === linkedConflict.id);

                if (!isAlreadySelected && !isAlreadyInIncludes) {
                  includeConflicts.push(linkedConflict);
                  console.log(`🔍 [getRelatedConflicts] 添加包含冲突: ${linkedConflict.id}`);
                } else {
                  console.log(`🔍 [getRelatedConflicts] 跳过包含冲突: ${linkedConflict.id} (已选择=${isAlreadySelected}, 已在列表中=${!!isAlreadyInIncludes})`);
                }
              } else {
                console.log(`🔍 [getRelatedConflicts] 未找到包含冲突: ${link.ref}`);
              }
            });
          });
        }
      } else {
        console.log(`🔍 [getRelatedConflicts] 未找到最后一个冲突: ${lastConflictId}`);
      }
    } else {
      console.log('🔍 [getRelatedConflicts] 没有选择的冲突');
    }

    // 限制每个列表最多3个冲突
    const limitedLeadUpConflicts = leadUpConflicts.length > 3
      ? getRandomConflicts(leadUpConflicts, 3)
      : leadUpConflicts;

    const limitedCarryOnConflicts = carryOnConflicts.length > 3
      ? getRandomConflicts(carryOnConflicts, 3)
      : carryOnConflicts;

    const limitedIncludeConflicts = includeConflicts.length > 3
      ? getRandomConflicts(includeConflicts, 3)
      : includeConflicts;

    return {
      leadUpConflicts: limitedLeadUpConflicts,
      carryOnConflicts: limitedCarryOnConflicts,
      includeConflicts: limitedIncludeConflicts
    };
  }, [conflicts]);

  // 处理冲突选择
  const handleConflictSelect = (conflictId: string) => {
    // 所有冲突选择逻辑现在都在父组件中处理
    if (onConflictSelect) {
      onConflictSelect(conflictId);
    }
  };

  // 当选择的冲突发生变化时，更新前置冲突、后续冲突和包含冲突
  useEffect(() => {

    if (selectedConflicts.length > 0) {
      const { leadUpConflicts, carryOnConflicts, includeConflicts } = getRelatedConflicts(selectedConflicts);
      setLeadUpConflicts(leadUpConflicts);
      setCarryOnConflicts(carryOnConflicts);
      setIncludeConflicts(includeConflicts);
    } else {
      setLeadUpConflicts([]);
      setCarryOnConflicts([]);
      setIncludeConflicts([]);
    }
  }, [selectedConflicts, conflicts, getRelatedConflicts]);

  // 当选择的冲突或情节发展发生变化时，更新待选冲突区域
  useEffect(() => {

    if (selectedConflicts.length > 0) {
      // 当有选择的冲突时，显示相关的前置冲突、后续冲突和包含冲突
      const { leadUpConflicts, carryOnConflicts, includeConflicts } = getRelatedConflicts(selectedConflicts);

      // 根据冲突类型决定插入位置：
      // - 前置冲突(leadUps)插入到待选冲突前面
      // - 继续冲突(carryOns)和包含冲突(includes)插入到待选冲突后面
      const relatedConflicts = [...leadUpConflicts, ...carryOnConflicts, ...includeConflicts];

      // getRelatedConflicts 函数已经过滤了已选择的冲突，这里不需要再次过滤
      // 但需要进行去重处理（虽然 getRelatedConflicts 已经做了，但这里再确保一次）
      const uniqueConflicts = relatedConflicts.filter((c, index, self) =>
        index === self.findIndex(item => item.id === c.id)
      );

      // 如果冲突数量大于3，随机选择3个
      let finalConflicts = uniqueConflicts;
      if (finalConflicts.length > 3) {
        finalConflicts = getRandomConflicts(finalConflicts, 3);
      }

      setRecommendedConflicts(finalConflicts);
    } else if (selectedPredicate && selectedConflicts.length === 0) {
      // 如果没有选择冲突但有情节发展，则恢复基于情节发展的冲突推荐
      const predicate = predicates.find(p => p.id === selectedPredicate);
      if (predicate) {
        // 获取与当前情节发展关联的冲突
        const relatedConflictIds = predicate.conflictLinks?.map(link => link.ref) || [];
        const relatedConflicts = conflicts.filter(conflict =>
          relatedConflictIds.includes(conflict.id)
        );

        // 如果没有直接关联的冲突，则推荐所有冲突
        let finalConflicts = relatedConflicts;
        if (relatedConflicts.length === 0) {
          finalConflicts = conflicts;
        }

        // 如果冲突数量大于3，随机选择3个
        if (finalConflicts.length > 3) {
          finalConflicts = getRandomConflicts(finalConflicts, 3);
        }

        setRecommendedConflicts(finalConflicts);
      } else {
        setRecommendedConflicts([]);
      }
    } else {
      // 既没有选择冲突也没有选择情节发展，清空待选冲突
      setRecommendedConflicts([]);
    }
  }, [selectedConflicts, conflicts, getRelatedConflicts, selectedPredicate, predicates]);
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
        <h2 className="text-2xl font-bold text-white text-center">故事元素选择器</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* 主角类型选择 */}
        <div className="space-y-3">
          <label htmlFor="protagonist-select" className="block text-sm font-medium text-gray-700">
            🎭 选择主角类型
          </label>
          <select
            id="protagonist-select"
            value={selectedProtagonist?.id || ''}
            onChange={(e) => {
              const selected = protagonists.find(protagonist => protagonist.id === e.target.value);
              if (selected) {
                onProtagonistChange(selected);
              }
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
            aria-label="选择主角类型"
          >
            <option value="">请选择主角类型</option>
            {protagonists.map((protagonist) => (
              <option key={protagonist.id} value={protagonist.id}>
                {protagonist.id} - {protagonist.description}
              </option>
            ))}
          </select>
        </div>

        {/* 情节发展选择 */}
        <div className="space-y-3">
          <label htmlFor="predicate-select" className="block text-sm font-medium text-gray-700">
            📝 选择情节发展
          </label>
          {selectedConflicts.length > 0 && (
            <div className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded p-2">
              ⚠️ 已选择冲突，无法修改情节发展。请先清除冲突选择。
            </div>
          )}
          <select
            id="predicate-select"
            value={selectedPredicate || ''}
            onChange={(e) => {
              if (e.target.value) {
                onPredicateChange(e.target.value);
              }
            }}
            disabled={selectedConflicts.length > 0}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md ${selectedConflicts.length > 0
              ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-white border-gray-300 hover:border-green-400'
              }`}
            aria-label="选择情节发展"
          >
            <option value="">请选择情节发展</option>
            {predicates.map((predicate) => (
              <option key={predicate.id} value={predicate.id}>
                {predicate.id} - {predicate.description}
              </option>
            ))}
          </select>
        </div>

        {/* 故事结局选择 */}
        <div className="space-y-3">
          <label htmlFor="outcome-select" className="block text-sm font-medium text-gray-700">
            🎯 选择故事结局
          </label>
          <select
            id="outcome-select"
            value={selectedOutcome || ''}
            onChange={(e) => {
              if (e.target.value) {
                onOutcomeChange(e.target.value);
              }
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
            aria-label="选择故事结局"
          >
            <option value="">请选择故事结局</option>
            {outcomes.map((outcome) => (
              <option key={outcome.id} value={outcome.id}>
                {outcome.id} - {outcome.description}
              </option>
            ))}
          </select>
        </div>

        {/* 故事篇幅选择 */}
        <div className="space-y-3">
          <label htmlFor="length-select" className="block text-sm font-medium text-gray-700">
            📚 选择故事篇幅
          </label>
          <select
            id="length-select"
            value={selectedLength || 'short'}
            onChange={(e) => {
              if (onLengthChange) {
                onLengthChange(e.target.value as 'short' | 'medium' | 'long');
              }
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
            aria-label="选择故事篇幅"
          >
            <option value="short">短篇故事（约5-8章）</option>
            <option value="medium">中篇故事（约15-30章）</option>
            <option value="long">长篇故事（50章以上）</option>
          </select>
        </div>

        {/* 冲突推荐区域 */}
        {recommendedConflicts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <h3 className="text-sm font-medium text-yellow-800 mb-3">
              🎯 待选冲突
            </h3>
            <div className="space-y-2">
              <p className="text-xs text-yellow-700 mb-2">
                以下冲突可供选择：
              </p>
              {recommendedConflicts.map((conflict) => {
                // 确定冲突类型
                let conflictType = '';
                let conflictTypeClass = '';

                // 检查冲突是否在前置冲突列表中
                if (leadUpConflicts.some(c => c.id === conflict.id)) {
                  conflictType = '前置';
                  conflictTypeClass = 'bg-blue-100 text-blue-800';
                }
                // 检查冲突是否在继续冲突列表中
                else if (carryOnConflicts.some(c => c.id === conflict.id)) {
                  conflictType = '继续';
                  conflictTypeClass = 'bg-green-100 text-green-800';
                }
                // 检查冲突是否在包含冲突列表中
                else if (includeConflicts.some(c => c.id === conflict.id)) {
                  conflictType = '包含';
                  conflictTypeClass = 'bg-purple-100 text-purple-800';
                }

                return (
                  (conflictType.length > 0 || selectedConflicts.length == 0) ? (
                    <div
                      key={conflict.id}
                      className="flex items-center justify-between p-2 bg-white rounded border border-yellow-200 hover:border-yellow-400 cursor-pointer transition-colors"
                      onClick={() => handleConflictSelect(conflict.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${conflictTypeClass} mr-2`}>
                            {conflictType}冲突
                          </span>
                          <span className="text-sm font-medium text-gray-800">
                            {conflict.id} - {conflict.details}
                          </span>
                        </div>
                      </div>
                      <div className="text-yellow-600 text-lg">
                        ➕
                      </div>
                    </div>
                  ) : null
                );
              })}
            </div>
          </div>
        )}

        {/* 没有待选冲突时的提醒 */}
        {recommendedConflicts.length === 0 && selectedConflicts.length === 0 && leadUpConflicts.length === 0 && carryOnConflicts.length === 0 && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mt-6">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                ℹ️ 冲突提醒
              </h3>
              <p className="text-xs text-gray-600">
                当前没有待选冲突。请选择情节发展来获取冲突推荐，或手动添加冲突来开始构建您的故事。
              </p>
            </div>
          </div>
        )}

        {/* 选择状态摘要 */}
        <div className="bg-gray-50 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">当前选择状态:</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center">
              <span className="w-20 font-medium">主角类型:</span>
              <span>{selectedProtagonist ? selectedProtagonist.description : '未选择'}</span>
            </div>
            <div className="flex items-center">
              <span className="w-20 font-medium">情节发展:</span>
              <span>{selectedPredicate ? predicates.find(p => p.id === selectedPredicate)?.description : '未选择'}</span>
            </div>
            <div className="flex items-center">
              <span className="w-20 font-medium">故事结局:</span>
              <span>{selectedOutcome ? outcomes.find(o => o.id === selectedOutcome)?.description : '未选择'}</span>
            </div>
            <div className="flex items-center">
              <span className="w-20 font-medium">故事篇幅:</span>
              <span>
                {selectedLength === 'short' && '短篇故事（约5-8章）'}
                {selectedLength === 'medium' && '中篇故事（约15-30章）'}
                {selectedLength === 'long' && '长篇故事（50章以上）'}
                {!selectedLength && '未选择'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-20 font-medium">冲突:</span>
              <span>
                {selectedConflicts.length > 0
                  ? selectedConflicts.map(id => {
                    const conflict = conflicts.find(c => c.id === id);
                    return (
                      <span key={id} className="inline-flex items-center bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                        {id} - {conflict?.details}
                        {onConflictRemove && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onConflictRemove(id);
                            }}
                            className="ml-1 text-red-600 hover:text-red-800 focus:outline-none"
                            aria-label={`删除冲突 ${id}`}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    );
                  })
                  : '未选择'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}