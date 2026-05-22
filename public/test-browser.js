/**
 * 浏览器端端到端测试脚本
 * 在 http://localhost:5174/ 的浏览器控制台中粘贴运行
 */
(async function() {
  const BASE = '';
  const settings = JSON.parse(localStorage.getItem('wt_settings') || '{}');

  console.log('========================================');
  console.log('  公众号写作神器 - 浏览器端测试');
  console.log('========================================\n');
  console.log('当前设置:');
  console.log(`  文本API: ${settings.apiUrl ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`  文本Key: ${settings.apiKey ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`  文本模型: ${settings.modelName || '未配置'}`);
  console.log(`  图片API: ${settings.imageUrl ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`  图片Key: ${settings.imageApiKey ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`  图片模型: ${settings.imageModel || '未配置'}\n`);

  const results = [];

  // 1. 健康检查
  console.log('--- 1. 健康检查 GET /api/health ---');
  try {
    const r = await fetch(`${BASE}/api/health`);
    const d = await r.json();
    const pass = r.status === 200 && d.success === true;
    console.log(`  状态: ${r.status} | ${pass ? '✅' : '❌'} | ${JSON.stringify(d)}`);
    results.push({ name: '健康检查', pass });
  } catch (e) { console.log(`  ❌ ${e.message}`); results.push({ name: '健康检查', pass: false }); }

  // 2. 风格列表
  console.log('\n--- 2. 风格列表 GET /api/styles ---');
  try {
    const r = await fetch(`${BASE}/api/styles`);
    const d = await r.json();
    const pass = r.status === 200 && d.styles?.length >= 3;
    console.log(`  状态: ${r.status} | 风格数: ${d.styles?.length} | ${pass ? '✅' : '❌'}`);
    d.styles?.forEach(s => console.log(`    - [${s.id}] ${s.name}`));
    results.push({ name: '风格列表', pass });
  } catch (e) { console.log(`  ❌ ${e.message}`); results.push({ name: '风格列表', pass: false }); }

  // 3. 参数校验
  console.log('\n--- 3. 参数校验 ---');
  const paramTests = [
    { name: 'article缺参数', url: '/api/article', body: { topic: 'test' }, expect: 400 },
    { name: 'titles缺参数', url: '/api/titles', body: { article: 'test' }, expect: 400 },
    { name: 'cover/prompts缺参数', url: '/api/cover/prompts', body: { article: 'test' }, expect: 400 },
    { name: 'cover/generate缺参数', url: '/api/cover/generate', body: { prompt: 'test' }, expect: 400 },
  ];
  for (const t of paramTests) {
    try {
      const r = await fetch(`${BASE}${t.url}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t.body),
      });
      const d = await r.json();
      const pass = r.status === t.expect;
      console.log(`  ${t.name}: ${pass ? '✅' : '❌'} (期望${t.expect}, 实际${r.status})`);
      results.push({ name: t.name, pass });
    } catch (e) { console.log(`  ${t.name}: ❌ ${e.message}`); results.push({ name: t.name, pass: false }); }
  }

  // 检查是否有文本API配置
  if (!settings.apiUrl || !settings.apiKey || !settings.modelName) {
    console.log('\n⚠️ 文本模型未配置，跳过AI测试');
  } else {
    // 4. 正文生成 (SSE)
    console.log('\n--- 4. 正文生成 POST /api/article (SSE流式) ---');
    let article = '';
    try {
      const r = await fetch(`${BASE}/api/article`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: '写一段关于AI对内容创作影响的短评，100字以内',
          styleId: '2',
          apiUrl: settings.apiUrl,
          apiKey: settings.apiKey,
          modelName: settings.modelName,
        }),
      });

      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || '请求失败');
      }

      const reader = r.body.getReader();
      const decoder = new TextDecoder();
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
            } catch (e) { if (e.message && !e.message.includes('JSON')) throw e; }
          }
        }
      }

      const pass = article.length > 0;
      console.log(`  流式块: ${chunks} | 字数: ${article.length} | ${pass ? '✅' : '❌'}`);
      console.log(`  内容: ${article.slice(0, 150)}...`);
      results.push({ name: '正文生成(SSE)', pass });
    } catch (e) { console.log(`  ❌ ${e.message}`); results.push({ name: '正文生成(SSE)', pass: false }); }

    // 5. 标题摘要
    if (article) {
      console.log('\n--- 5. 标题摘要 POST /api/titles ---');
      try {
        const r = await fetch(`${BASE}/api/titles`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            article,
            apiUrl: settings.apiUrl,
            apiKey: settings.apiKey,
            modelName: settings.modelName,
          }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || '请求失败');
        const pass = Array.isArray(d.titles) && d.titles.length >= 1;
        console.log(`  状态: ${r.status} | 标题数: ${d.titles?.length} | ${pass ? '✅' : '❌'}`);
        d.titles?.forEach((t, i) => console.log(`    ${i+1}. ${t.title} | ${t.summary}`));
        results.push({ name: '标题摘要', pass });
      } catch (e) { console.log(`  ❌ ${e.message}`); results.push({ name: '标题摘要', pass: false }); }

      // 6. 封面 Prompt
      console.log('\n--- 6. 封面Prompt POST /api/cover/prompts ---');
      let prompts = [];
      try {
        const r = await fetch(`${BASE}/api/cover/prompts`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            article,
            apiUrl: settings.apiUrl,
            apiKey: settings.apiKey,
            modelName: settings.modelName,
          }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || '请求失败');
        prompts = d.prompts || [];
        const pass = prompts.length >= 1;
        console.log(`  状态: ${r.status} | Prompt数: ${prompts.length} | 关键点: ${JSON.stringify(d.keyPoints)} | ${pass ? '✅' : '❌'}`);
        prompts.forEach((p, i) => console.log(`    ${i+1}. ${p.slice(0, 80)}...`));
        results.push({ name: '封面Prompt', pass });
      } catch (e) { console.log(`  ❌ ${e.message}`); results.push({ name: '封面Prompt', pass: false }); }

      // 7. 封面图生成
      if (settings.imageUrl && settings.imageApiKey && settings.imageModel && prompts.length > 0) {
        console.log('\n--- 7. 封面图生成 POST /api/cover/generate ---');
        let imageUrl = '';
        try {
          const r = await fetch(`${BASE}/api/cover/generate`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: prompts[0],
              apiUrl: settings.imageUrl,
              apiKey: settings.imageApiKey,
              modelName: settings.imageModel,
            }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error || '请求失败');
          imageUrl = d.url || '';
          const pass = !!(d.url || d.b64_json);
          console.log(`  状态: ${r.status} | URL: ${d.url ? '有' : '无'} | Base64: ${d.b64_json ? '有' : '无'} | ${pass ? '✅' : '❌'}`);
          results.push({ name: '封面图生成', pass });

          // 8. 图片代理
          if (imageUrl) {
            console.log('\n--- 8. 图片代理 GET /api/cover/proxy ---');
            try {
              const proxyUrl = `${BASE}/api/cover/proxy?url=${encodeURIComponent(imageUrl)}`;
              const res = await fetch(proxyUrl);
              const pass = res.status === 200;
              console.log(`  状态: ${res.status} | Content-Type: ${res.headers.get('content-type')} | ${pass ? '✅' : '❌'}`);
              results.push({ name: '图片代理', pass });
            } catch (e) { console.log(`  ❌ ${e.message}`); results.push({ name: '图片代理', pass: false }); }
          }
        } catch (e) { console.log(`  ❌ ${e.message}`); results.push({ name: '封面图生成', pass: false }); }
      } else if (!settings.imageUrl || !settings.imageApiKey || !settings.imageModel) {
        console.log('\n⚠️ 图片模型未配置，跳过封面图测试');
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
})();
