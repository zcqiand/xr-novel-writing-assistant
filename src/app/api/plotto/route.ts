import { NextRequest, NextResponse } from 'next/server';
import { PlottoParser } from '@/lib/plotto-parser';
import fs from 'fs/promises';
import path from 'path';

/**
 * GET /api/plotto
 * 获取Plotto数据的API端点
 */
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // all, characters, subjects, predicates, outcomes, conflicts
    const id = searchParams.get('id'); // 用于获取特定ID的数据

    // 读取plotto.xml文件
    const xmlPath = path.join(process.cwd(), 'public/data/plotto.xml');
    const xmlContent = await fs.readFile(xmlPath, 'utf-8');

    // 解析XML数据
    const parser = new PlottoParser();
    parser.parse(xmlContent);
    const plottoData = parser.getParsedData();

    // 根据请求类型返回相应的数据
    let responseData: any;

    switch (type) {
      case 'characters':
        if (id) {
          // 获取特定角色
          const character = plottoData.characters.find(c => c.designation === id);
          responseData = character || null;
        } else {
          responseData = plottoData.characters;
        }
        break;

      case 'subjects':
        if (id) {
          // 获取特定主题
          const subject = plottoData.subjects.find(s => s.number === parseInt(id));
          responseData = subject || null;
        } else {
          responseData = plottoData.subjects;
        }
        break;

      case 'predicates':
        if (id) {
          // 获取特定谓词
          const predicate = plottoData.predicates.find(p => p.number === parseInt(id));
          responseData = predicate || null;
        } else {
          responseData = plottoData.predicates;
        }
        break;

      case 'outcomes':
        if (id) {
          // 获取特定结果
          const outcome = plottoData.outcomes.find(o => o.number === parseInt(id));
          responseData = outcome || null;
        } else {
          responseData = plottoData.outcomes;
        }
        break;

      case 'conflicts':
        if (id) {
          // 获取特定冲突
          const conflict = plottoData.conflicts.find(c => c.id === id);
          responseData = conflict || null;
        } else {
          responseData = plottoData.conflicts;
        }
        break;

      default:
        // 返回所有数据
        responseData = plottoData;
    }

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: responseData,
      type,
      ...(id && { id })
    });

  } catch (error) {
    console.error('获取Plotto数据时出错:', error);

    // 返回错误响应
    return NextResponse.json(
      {
        success: false,
        error: '获取Plotto数据失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/plotto/search
 * 搜索Plotto数据的API端点
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { query, type = 'all', category, subcategory } = body;

    if (!query) {
      return NextResponse.json(
        { error: '搜索关键词不能为空' },
        { status: 400 }
      );
    }

    // 读取plotto.xml文件
    const xmlPath = path.join(process.cwd(), 'public/data/plotto.xml');
    const xmlContent = await fs.readFile(xmlPath, 'utf-8');

    // 解析XML数据
    const parser = new PlottoParser();
    parser.parse(xmlContent);
    const plottoData = parser.getParsedData();

    // 搜索逻辑
    const searchResults: any[] = [];
    const searchQuery = query.toLowerCase();

    // 搜索角色
    if (type === 'all' || type === 'characters') {
      plottoData.characters.forEach(character => {
        if (character.designation.toLowerCase().includes(searchQuery) ||
          character.description.toLowerCase().includes(searchQuery)) {
          searchResults.push({
            type: 'character',
            data: character
          });
        }
      });
    }

    // 搜索主题
    if (type === 'all' || type === 'subjects') {
      plottoData.subjects.forEach(subject => {
        if (subject.description.toLowerCase().includes(searchQuery)) {
          searchResults.push({
            type: 'subject',
            data: subject
          });
        }
      });
    }

    // 搜索谓词
    if (type === 'all' || type === 'predicates') {
      plottoData.predicates.forEach(predicate => {
        if (predicate.description.toLowerCase().includes(searchQuery)) {
          searchResults.push({
            type: 'predicate',
            data: predicate
          });
        }
      });
    }

    // 搜索结果
    if (type === 'all' || type === 'outcomes') {
      plottoData.outcomes.forEach(outcome => {
        if (outcome.description.toLowerCase().includes(searchQuery)) {
          searchResults.push({
            type: 'outcome',
            data: outcome
          });
        }
      });
    }

    // 搜索冲突
    if (type === 'all' || type === 'conflicts') {
      plottoData.conflicts.forEach(conflict => {
        const matchDescription = conflict.category.toLowerCase().includes(searchQuery) ||
          conflict.subcategory.toLowerCase().includes(searchQuery) ||
          conflict.permutations.some(p =>
            p.description.toLowerCase().includes(searchQuery)
          );

        if (matchDescription) {
          searchResults.push({
            type: 'conflict',
            data: conflict
          });
        }
      });
    }

    // 按分类过滤
    const filteredResults = category ?
      searchResults.filter(result => {
        if (result.type === 'conflict') {
          return result.data.category === category;
        }
        return true;
      }) : searchResults;

    // 按子分类过滤
    const finalResults = subcategory ?
      filteredResults.filter(result => {
        if (result.type === 'conflict') {
          return result.data.subcategory === subcategory;
        }
        return true;
      }) : filteredResults;

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: finalResults,
      query,
      category,
      subcategory,
      total: finalResults.length
    });

  } catch (error) {
    console.error('搜索Plotto数据时出错:', error);

    // 返回错误响应
    return NextResponse.json(
      {
        success: false,
        error: '搜索Plotto数据失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}