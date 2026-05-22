/**
 * 端到端测试脚本 v2
 */
const BASE = 'http://localhost:3001';

const TEXT_API_URL = process.env.TEXT_API_URL || '';
const TEXT_API_KEY = process.env.TEXT_API_KEY || '';
const TEXT_MODEL = process.env.TEXT_MODEL || '';
const IMAGE_API_URL = process.env.IMAGE_API_URL || '';
const IMAGE_API_KEY = process.env.IMAGE_API_KEY || '';
const IMAGE_MODEL = process.env.IMAGE_MODEL || '';

const hasTextApi = TEXT_API_URL && TEXT_API_KEY && TEXT_MODEL;
const hasImageApi = IMAGE_API_URL && IMAGE_API_KEY && IMAGE_MODEL;

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/event-stream')) {
    return { status: res.status, stream: true, response: res };
  }
  const data = await res.json();
  return { status: res.status, data };
}

async function get(url) {
  const res = await fetch(url);
  const data = await res.json();
  return { status: res.status, data };
}

async function readSSE(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let article = '';
  let buffer = '';
  let chunks = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) { article += parsed.content; chunks++; }
          if (parsed.error) throw new Error(parsed.error);
        } catch (e) {
          if (e.message && !e.message.includes('JSON')) throw e;
        }
      }
    }
  }
  return { article, chunks };
}

async function main() {
  console.log('========================================');
  console.log('  公众号写作神器 - 端到端测试 v2');
  console.log('========================================\n');

  const results = [];

  // 1. 健康检查
  console.log('--- 1. 健康检查 GET /api/health ---');
  try {
    const r = await get(`${BASE}/api/health`);
    const pass = r.status === 200 && r.data.success === true;
    console.log(`  状态: ${r.status} | ${pass ? '✅' : '❌'} | ${JSON.stringify(r.data)}`);
    results.push({ name: '健康检查', pass });
  } catch (e) { console.log(`  ❌ 错误: ${e.message}`); results.push({ name: '健康检查', pass: false }); }

  // 2. 风格列表
  console.log('\n--- 2. 风格列表 GET /api/styles ---');
  let styleId = '0';
  try {
    const r = await get(`${BASE}/api/styles`);
    const pass = r.status === 200 && r.data.styles?.length >= 3;
    console.log(`  状态: ${r.status} | 风格数: ${r.data.styles?.length} | ${pass ? '✅' : '❌'}`);
    r.data.styles?.forEach(s => console.log(`    - [${s.id}] ${s.name}`));
    results.push({ name: '风格列表', pass });
  } catch (e) { console.log(`  ❌ 错误: ${e.message}`); results.push({ name: '风格列表', pass: false }); }

  // 3. 参数校验
  console.log('\n--- 3. 参数校验 ---');
  const paramTests = [
    { name: 'article 缺参数', url: '/api/article', body: { topic: 'test' }, expectStatus: 400 },
    { name: 'titles 缺参数', url: '/api/titles', body: { article: 'test' }, expectStatus: 400 },
    { name: 'cover/prompts 缺参数', url: '/api/cover/prompts', body: { article: 'test' }, expectStatus: 400 },
    { name: 'cover/generate 缺参数', url: '/api/cover/generate', body: { prompt: 'test' }, expectStatus: 400 },
    { name: 'article 无效风格', url: '/api/article', body: { topic: 'test', styleId: '999', apiUrl: 'https://fake.com', apiKey: 'fake', modelName: 'fake' }, expectStatus: 404 },
  ];
  for (const t of paramTests) {
    try {
      const r = await post(`${BASE}${t.url}`, t.body);
      const pass = r.status === t.expectStatus;
      console.log(`  ${t.name}: ${pass ? '✅' : '❌'} (期望${t.expectStatus}, 实际${r.status}, error="${r.data?.error || ''}")`);
      results.push({ name: t.name, pass });
    } catch (e) { console.log(`  ${t.name}: ❌ 错误: ${e.message}`); results.push({ name: t.name, pass: false }); }
  }

  if (!hasTextApi) {
    console.log('\n⚠️  未设置 TEXT_API_URL/TEXT_API_KEY/TEXT_MODEL 环境变量，跳过 AI 测试');
    console.log('  设置方法:');
    console.log('  $env:TEXT_API_URL="https://open.bigmodel.cn/api/paas/v4/chat/completions"');
    console.log('  $env:TEXT_API_KEY="your-key"');
    console.log('  $env:TEXT_MODEL="glm-4-flash"');
  } else {
    // 4. 正文生成
    console.log('\n--- 4. 正文生成 POST /api/article (SSE) ---');
    let article = '';
    try {
      const r = await post(`${BASE}/api/article`, {
        topic: '写一段关于AI的短评，100字以内',
        styleId,
        apiUrl: TEXT_API_URL,
        apiKey: TEXT_API_KEY,
        modelName: TEXT_MODEL,
      });
      if (r.stream) {
        const sse = await readSSE(r.response);
        article = sse.article;
        const pass = article.length > 0;
        console.log(`  状态: ${r.status} | 流式块: ${sse.chunks} | 字数: ${article.length} | ${pass ? '✅' : '❌'}`);
        console.log(`  内容: ${article.slice(0, 100)}...`);
        results.push({ name: '正文生成', pass });
      } else {
        console.log(`  ❌ 非流式响应: status=${r.status}, data=${JSON.stringify(r.data)}`);
        results.push({ name: '正文生成', pass: false });
      }
    } catch (e) { console.log(`  ❌ 错误: ${e.message}`); results.push({ name: '正文生成', pass: false }); }

    // 5. 标题摘要
    if (article) {
      console.log('\n--- 5. 标题摘要 POST /api/titles ---');
      try {
        const r = await post(`${BASE}/api/titles`, {
          article,
          apiUrl: TEXT_API_URL,
          apiKey: TEXT_API_KEY,
          modelName: TEXT_MODEL,
        });
        const pass = r.status === 200 && Array.isArray(r.data.titles) && r.data.titles.length >= 1;
        console.log(`  状态: ${r.status} | 标题数: ${r.data.titles?.length} | ${pass ? '✅' : '❌'}`);
        r.data.titles?.forEach((t, i) => console.log(`    ${i+1}. ${t.title}`));
        results.push({ name: '标题摘要', pass });
      } catch (e) { console.log(`  ❌ 错误: ${e.message}`); results.push({ name: '标题摘要', pass: false }); }

      // 6. 封面 Prompt
      console.log('\n--- 6. 封面 Prompt POST /api/cover/prompts ---');
      let prompts = [];
      try {
        const r = await post(`${BASE}/api/cover/prompts`, {
          article,
          apiUrl: TEXT_API_URL,
          apiKey: TEXT_API_KEY,
          modelName: TEXT_MODEL,
        });
        const pass = r.status === 200 && r.data.prompts?.length >= 1;
        prompts = r.data.prompts || [];
        console.log(`  状态: ${r.status} | Prompt数: ${prompts.length} | 关键点: ${JSON.stringify(r.data.keyPoints)} | ${pass ? '✅' : '❌'}`);
        prompts.forEach((p, i) => console.log(`    ${i+1}. ${p.slice(0, 60)}...`));
        results.push({ name: '封面Prompt', pass });
      } catch (e) { console.log(`  ❌ 错误: ${e.message}`); results.push({ name: '封面Prompt', pass: false }); }

      // 7. 封面图生成
      if (hasImageApi && prompts.length > 0) {
        console.log('\n--- 7. 封面图生成 POST /api/cover/generate ---');
        let imageUrl = '';
        try {
          const r = await post(`${BASE}/api/cover/generate`, {
            prompt: prompts[0],
            apiUrl: IMAGE_API_URL,
            apiKey: IMAGE_API_KEY,
            modelName: IMAGE_MODEL,
          });
          const pass = r.status === 200 && (r.data.url || r.data.b64_json);
          imageUrl = r.data.url || '';
          console.log(`  状态: ${r.status} | URL: ${imageUrl ? '有' : '无'} | Base64: ${r.data.b64_json ? '有' : '无'} | ${pass ? '✅' : '❌'}`);
          results.push({ name: '封面图生成', pass });
        } catch (e) { console.log(`  ❌ 错误: ${e.message}`); results.push({ name: '封面图生成', pass: false }); }

        // 8. 图片代理
        if (imageUrl) {
          console.log('\n--- 8. 图片代理 GET /api/cover/proxy ---');
          try {
            const proxyUrl = `${BASE}/api/cover/proxy?url=${encodeURIComponent(imageUrl)}`;
            const res = await fetch(proxyUrl);
            const pass = res.status === 200;
            console.log(`  状态: ${res.status} | Content-Type: ${res.headers.get('content-type')} | ${pass ? '✅' : '❌'}`);
            results.push({ name: '图片代理', pass });
          } catch (e) { console.log(`  ❌ 错误: ${e.message}`); results.push({ name: '图片代理', pass: false }); }
        }
      } else if (!hasImageApi) {
        console.log('\n⚠️  未设置 IMAGE_API_URL/IMAGE_API_KEY/IMAGE_MODEL 环境变量，跳过图片测试');
      }
    }
  }

  // 汇总
  console.log('\n========================================');
  console.log('  测试汇总');
  console.log('========================================');
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  results.forEach(r => console.log(`  ${r.pass ? '✅' : '❌'} ${r.name}`));
  console.log(`\n通过: ${passed}/${total}`);
  console.log(passed === total ? '🎉 全部通过！' : '⚠️ 存在失败项');
}

main().catch(console.error);
