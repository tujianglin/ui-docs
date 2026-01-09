import { defineComponent, ref, computed, provide, watch, onMounted, onUnmounted, nextTick } from 'vue';
import Sidebar from './components/Sidebar';
import Markdown from './components/Markdown';

// Scan for stories and raw files recursively
const exampleModules = import.meta.glob('./**/*.story.vue', { eager: true });
const rawExampleModules = import.meta.glob('./**/*.vue', { eager: true, as: 'raw' });

// Robust ID generation supporting Chinese
export const slugify = (text: any) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/&/g, '-and-')   // Replace & with 'and'
    .replace(/[^\u4e00-\u9fa5a-z0-9 -]/g, '') // Remove all non-word chars (allow Chinese)
    .replace(/--+/g, '-');    // Replace multiple - with single -
};

const App = defineComponent(() => {
  const activeKey = ref('./examples/Basic.story.vue'); // Initialize with a full path
  const activeMainTab = ref('demo'); // 'demo' | 'docs'
  const searchQuery = ref('');
  const isSearchFocused = ref(false);
  const searchSelectedIndex = ref(0);

  const getRawContent = (path: string) => {
    // Try both with and without ./ for robustness across dev/prod
    const normalizedKey = path.startsWith('./') ? path : `./${path}`;
    const keyWithoutDot = path.startsWith('./') ? path.substring(2) : path;

    const content = rawExampleModules[normalizedKey] || rawExampleModules[keyWithoutDot];

    if (typeof content === 'string') return content;
    if (content && typeof (content as any).default === 'string') return (content as any).default;
    return '';
  };

  const menuItems = computed(() => {
    return Object.keys(exampleModules).map(path => {
      // Extract filename from path and remove .story.vue extension
      const fileName = path.split('/').pop() || '';
      const name = fileName.replace(/\.story\.vue$/, '');
      return { key: path, label: name };
    });
  });

  const currentDemo = computed(() => {
    return (exampleModules[activeKey.value] as any)?.default;
  });

  const parsedDocs = computed(() => {
    const rawContent = getRawContent(activeKey.value);
    const docsMatch = rawContent.match(/<docs lang="md">([\s\S]*?)<\/docs>/);

    // @ts-ignore
    const content = docsMatch ? docsMatch[1].trim() : '';
    const titleMatch = content.match(/^#\s+(.*)/m);

    // Clean default title: only the word before .story.vue
    const fileName = activeKey.value.split('/').pop() || '';
    const nameFromPath = fileName.replace(/\.story\.vue$/, '');
    const title = titleMatch ? titleMatch[1] : nameFromPath;

    // Extract subtitle: find the first paragraph after the title
    const body = content.replace(/^#\s+.*\n?/, '').trim();
    const bodyLines = body.split('\n').filter(line => line.trim() !== '');
    const subtitle = bodyLines.length > 0 && !bodyLines[0].startsWith('##')
      ? bodyLines[0]
      : '在这里查看组件的各种用法演示和 API 文档。';

    const description = content.replace(/^#\s+.*\n?/, '').trim();

    return { title, subtitle, description };
  });

  const activeDocs = parsedDocs;
  const ActiveComponent = currentDemo;

  const variantCodesMap = computed(() => {
    const storyRaw = getRawContent(activeKey.value).replace(/<docs[\s\S]*?<\/docs>/, '').trim();
    const map: Record<string, string> = {};
    const variantRegex = /<Variant\s+title=["']([^"']+)["'][^>]*>([\s\S]*?)<\/Variant>/g;

    // Find imports in the story script to support deep extraction
    const scriptMatch = storyRaw.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/);
    const scriptContent = scriptMatch ? scriptMatch[1] : '';

    let match;
    while ((match = variantRegex.exec(storyRaw)) !== null) {
      const title = match[1];
      const content = match[2].trim();

      // Deep Extraction Logic per Variant
      // Check if content is just a simple component tag like <Demo /> or <Basic />
      const compMatch = content.match(/^<([A-Z][a-zA-Z0-9]+)(\s+[^>]*?)?\s*\/>$/);
      if (compMatch) {
        const compName = compMatch[1];
        // Look for the import of this component in the script block
        const importMatch = scriptContent.match(new RegExp(`import\\s+${compName}\\s+from\\s+['"](.+)['"]`));
        if (importMatch) {
          let importPath = importMatch[1];
          if (importPath.startsWith('./')) {
            // Resolve relative path based on the story file's directory
            const currentDir = activeKey.value.substring(0, activeKey.value.lastIndexOf('/'));
            const targetPath = `${currentDir}/${importPath.replace('./', '')}`;
            const targetRaw = getRawContent(targetPath);
            if (targetRaw) {
              map[title] = targetRaw.replace(/<docs[\s\S]*?<\/docs>/, '').trim();
              continue;
            }
          }
        }
      }

      map[title] = content;
    }
    return map;
  });

  const anchors = computed(() => {
    if (activeMainTab.value === 'demo') {
      return Object.keys(variantCodesMap.value).map(title => ({
        id: slugify(title),
        text: title,
        level: 2
      }));
    } else {
      const content = activeDocs.value.description;
      const foundHeaders: { text: string; id: string; level: number }[] = [];
      const lines = content.split('\n');
      lines.forEach(line => {
        const match = line.match(/^(#{2,3})\s+(.*)/);
        if (match) {
          const text = match[2];
          const id = slugify(text);
          foundHeaders.push({ text, id, level: match[1].length });
        }
      });
      return foundHeaders;
    }
  });

  // NEW: Global Content Index for Spotlight Search
  const globalIndex = computed(() => {
    const index: { type: 'component' | 'demo' | 'doc-header' | 'doc-content', key: string, label: string, anchorId?: string, snippet?: string }[] = [];

    Object.entries(rawExampleModules).forEach(([path, content]) => {
      // Only index from stories for components list, but use raw for content
      if (!path.endsWith('.story.vue')) return;

      const componentLabel = path.split('/').pop()?.replace('.story.vue', '') || '';
      const componentKey = path; // Use full path as key
      if (!componentLabel) return;

      // 1. Index Component
      index.push({ type: 'component', key: componentKey, label: componentLabel });

      const raw = typeof content === 'string' ? content : (content as any).default || '';
      if (typeof raw !== 'string') return; // Defensive check

      const docsMatch = raw.match(/<docs lang="md">([\s\S]*?)<\/docs>/);
      const docsContent = docsMatch ? docsMatch[1] : '';

      // CI Fixes:
      // [x] 创建自动化部署配置文件 (`deploy.yml`) (已修复权限与路径)
      // [x] 配置文档站点专属构建脚本
      // [x] 修复全站白屏 TypeError (防自建数据异常)
      const variantRegex = /<Variant\s+title=["']([^"']+)["'][^>]*>/g;
      let vMatch;
      while ((vMatch = variantRegex.exec(raw)) !== null) {
        index.push({
          type: 'demo',
          key: componentKey,
          label: vMatch[1],
          anchorId: slugify(vMatch[1])
        });
      }

      // 3. Index Markdown Headers & Content snippets
      if (docsContent) {
        const lines = docsContent.split('\n');
        lines.forEach(line => {
          // Headers
          const hMatch = line.match(/^(#{2,3})\s+(.*)/);
          if (hMatch) {
            index.push({
              type: 'doc-header',
              key: componentKey,
              label: hMatch[2],
              anchorId: slugify(hMatch[2])
            });
          }
          // Simple body indexing (lines with reasonable length, avoiding code blocks)
          else if (line.trim().length > 10 && !line.startsWith('```') && !line.startsWith('<')) {
            index.push({
              type: 'doc-content',
              key: componentKey,
              label: line.trim().slice(0, 50) + (line.length > 50 ? '...' : ''),
              snippet: line.trim(),
              anchorId: 'docs' // Jump to docs tab
            });
          }
        });
      }
    });
    return index;
  });

  const scrollToAnchor = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredResults = computed(() => {
    const query = searchQuery.value.toLowerCase().trim();
    if (!query) return [];

    const results = globalIndex.value.filter(item =>
      item.label.toLowerCase().includes(query) ||
      (item.snippet && item.snippet.toLowerCase().includes(query))
    );

    // Deduplicate and limit
    const seen = new Set();
    return results.filter(r => {
      const uniqueKey = `${r.type}-${r.key}-${r.anchorId || ''}-${r.label}`;
      if (seen.has(uniqueKey)) return false;
      seen.add(uniqueKey);
      return true;
    }).slice(0, 12);
  });

  const handleSearchSelect = (result: any) => {
    const jump = () => {
        if (result.anchorId === 'docs') {
            activeMainTab.value = 'docs';
        } else if (result.anchorId) {
            activeMainTab.value = 'demo';
            setTimeout(() => scrollToAnchor(result.anchorId), 100);
        }
    };

    if (activeKey.value !== result.key) {
        activeKey.value = result.key;
        jump();
    } else {
        jump();
    }

    searchQuery.value = '';
    searchSelectedIndex.value = 0;
    isSearchFocused.value = false;
  };

  const onGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          isSearchFocused.value = true;
      }
  };

  watch(isSearchFocused, (val) => {
      if (val) {
          nextTick(() => {
              const input = document.getElementById('spotlight-search') as HTMLInputElement;
              input?.focus();
          });
      }
  });

  onMounted(() => {
      window.addEventListener('keydown', onGlobalKeyDown);
  });

  onUnmounted(() => {
      window.removeEventListener('keydown', onGlobalKeyDown);
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isSearchFocused.value) return;

    if (e.key === 'Escape') {
      isSearchFocused.value = false;
      return;
    }

    if (filteredResults.value.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      searchSelectedIndex.value = (searchSelectedIndex.value + 1) % filteredResults.value.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      searchSelectedIndex.value = (searchSelectedIndex.value - 1 + filteredResults.value.length) % filteredResults.value.length;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSelect(filteredResults.value[searchSelectedIndex.value]);
    }
  };

  provide('variantCodes', variantCodesMap);

  // Reset tab and scroll when switching components
  watch(activeKey, () => {
    activeMainTab.value = 'demo';
  });

  const sidebarSections = computed(() => [
    {
      title: '控制台',
      items: [{ key: 'Overview', label: '项目概览' }]
    },
    {
      title: '组件库',
      items: menuItems.value.map(item => ({ key: item.key, label: item.label }))
    },
    {
      title: '建模参考',
      items: [
        { key: 'VvorPress', label: 'VvorPress 库' },
        { key: 'Forms', label: '表单' }
      ]
    }
  ]);

  return () => (
    <div class="flex h-screen bg-white font-sans text-gray-900 overflow-hidden">
      <Sidebar
        sections={sidebarSections.value}
        activeKey={activeKey.value}
        onUpdate:activeKey={(val) => (activeKey.value = val)}
      />

      <div class="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header class="h-16 border-b border-gray-100 flex items-center justify-between px-10 shrink-0 bg-white sticky top-0 z-10">
          <div />

          <div class="flex items-center space-x-6">
              <div
                  onClick={() => isSearchFocused.value = true}
                  class="bg-gray-50 border border-transparent rounded-full py-1.5 pl-4 pr-3 text-xs w-48 text-gray-400 flex items-center justify-between cursor-text hover:bg-gray-100 transition-all"
              >
                  <div class="flex items-center">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" class="mr-2 text-gray-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      <span>搜索组件 (⌘K)</span>
                  </div>
              </div>

              <div class="flex items-center space-x-4 border-l border-gray-100 pl-6">
                  <button class="text-gray-400 hover:text-gray-900 transition-colors">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                  </button>
              </div>
          </div>
        </header>

        <main class="flex-1 overflow-y-auto bg-white">
          <div class="w-full max-w-none px-10 py-12 md:px-20 lg:px-32">
            <div class="mb-8 flex items-center justify-between border-b border-gray-100">
              <div>
                  <h1 class="text-3xl font-semibold text-gray-900 tracking-tight mb-2 flex items-center">
                      {activeDocs.value.title}
                  </h1>
                  <p class="text-[14px] text-gray-500 font-normal">{activeDocs.value.subtitle}</p>
              </div>
              <div class="flex items-center space-x-1 self-end pb-px">
                  <button
                    onClick={() => activeMainTab.value = 'demo'}
                    class={[
                        "px-6 py-3 text-sm font-medium transition-all relative",
                        activeMainTab.value === 'demo' ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
                    ]}
                  >
                    设计方案
                    {activeMainTab.value === 'demo' && <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 animate-in fade-in slide-in-from-bottom-1" />}
                  </button>
                  <button
                    onClick={() => activeMainTab.value = 'docs'}
                    class={[
                        "px-6 py-3 text-sm font-medium transition-all relative",
                        activeMainTab.value === 'docs' ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
                    ]}
                  >
                    文档详情
                    {activeMainTab.value === 'docs' && <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 animate-in fade-in slide-in-from-bottom-1" />}
                  </button>
              </div>
            </div>

            <div class="flex flex-col lg:flex-row lg:space-x-12">
                <div class="flex-1 min-w-0">
                    {activeMainTab.value === 'docs' ? (
                        <div class="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
                            <h1 class="text-4xl font-black text-gray-900 tracking-tight mb-8">
                                {activeDocs.value.title}
                            </h1>
                            <Markdown content={activeDocs.value.description} />
                        </div>
                    ) : (
                        <div class="relative min-h-[600px] space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {ActiveComponent.value && <ActiveComponent.value />}
                        </div>
                    )}
                </div>

                {/* Right Side Anchor Navigation */}
                {anchors.value.length > 0 && (
                    <aside class="hidden lg:block w-64 shrink-0">
                        <div class="sticky top-24 pt-4 border-l border-gray-50 pl-8">
                            <div class="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">On this page</div>
                            <nav class="space-y-1">
                                {anchors.value.map(anchor => (
                                    <button
                                        key={anchor.id}
                                        onClick={() => scrollToAnchor(anchor.id)}
                                        class={[
                                            "text-left text-[13px] py-1.5 px-3 rounded-lg transition-all w-full flex items-center group leading-relaxed",
                                            "hover:bg-blue-50 hover:text-blue-600 text-gray-500 font-medium"
                                        ]}
                                        style={{ paddingLeft: `${(anchor.level - 1) * 12}px` }}
                                    >
                                        <div class="w-1 h-1 rounded-full bg-gray-300 mr-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span class="truncate">{anchor.text}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>
                )}
            </div>
          </div>
        </main>
      </div>

      {/* Spotlight 全局搜索模态框 */}
      {isSearchFocused.value && (
          <div class="fixed inset-0 z-[9999] flex items-start justify-center pt-24 px-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300 pointer-events-auto">
              <div
                  class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in slide-in-from-top-4 duration-300"
                  onClick={(e) => e.stopPropagation()}
              >
                  {/* 搜索头部 */}
                  <div class="px-6 py-4 border-b border-gray-50 flex items-center">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" class="text-blue-500 mr-4"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      <input
                          id="spotlight-search"
                          type="text"
                          value={searchQuery.value}
                          onInput={(e: any) => {
                              searchQuery.value = e.target.value;
                              searchSelectedIndex.value = 0;
                          }}
                          onKeydown={(e: any) => handleKeyDown(e)}
                          placeholder="搜索组件、示例或文档内容..."
                          class="flex-1 bg-transparent border-none text-base outline-none text-gray-900"
                      />
                      <div class="flex items-center space-x-1.5">
                          <kbd class="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-[10px] text-gray-400 font-sans">ESC</kbd>
                          <span class="text-[10px] text-gray-300">关闭</span>
                      </div>
                  </div>

                  {/* 搜索内容区 */}
                  <div class="max-h-[480px] overflow-auto py-2 custom-scrollbar">
                      {searchQuery.value.length === 0 ? (
                          <div class="px-6 py-12 text-center">
                              <div class="text-3xl mb-4 text-gray-200">🔍</div>
                              <div class="text-sm text-gray-400">输入关键词开始检索全站内容</div>
                          </div>
                      ) : filteredResults.value.length === 0 ? (
                          <div class="px-6 py-12 text-center text-sm text-gray-400">
                              未找到与 "{searchQuery.value}" 相关的结果
                          </div>
                      ) : (
                          <div>
                              <div class="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                                  搜索结果 ({filteredResults.value.length})
                              </div>
                              {filteredResults.value.map((result, index) => (
                                  <button
                                      key={`${result.type}-${result.key}-${result.label}`}
                                      onClick={() => handleSearchSelect(result)}
                                      onMouseenter={() => searchSelectedIndex.value = index}
                                      class={[
                                          "w-full text-left px-6 py-3.5 flex items-start transition-all",
                                          searchSelectedIndex.value === index ? "bg-blue-50/50" : "hover:bg-gray-50"
                                      ]}
                                  >
                                      <div class={[
                                          "mt-0.5 p-1.5 rounded-lg mr-4 transition-colors",
                                          searchSelectedIndex.value === index ? "bg-blue-100 text-blue-600" : "bg-gray-50 text-gray-400"
                                      ]}>
                                          {result.type === 'component' && <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>}
                                          {result.type === 'demo' && <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>}
                                          {result.type === 'doc-header' && <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"></path></svg>}
                                          {result.type === 'doc-content' && <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
                                      </div>
                                      <div class="flex-1 min-w-0">
                                          <div class="flex items-center justify-between">
                                              <span class={[
                                                  "font-bold text-[14px]",
                                                  searchSelectedIndex.value === index ? "text-blue-600" : "text-gray-900"
                                              ]}>{result.label}</span>
                                              <span class="text-[10px] text-gray-400 font-medium px-2 py-0.5 rounded bg-gray-50">{result.key}</span>
                                          </div>
                                          {result.snippet && (
                                              <p class="text-xs text-gray-500 mt-1 line-clamp-1">{result.snippet}</p>
                                          )}
                                      </div>
                                      {searchSelectedIndex.value === index && (
                                          <div class="ml-4 self-center">
                                              <kbd class="px-2 py-1 rounded border border-blue-200 bg-blue-50 text-[10px] text-blue-500 font-sans font-bold">↵</kbd>
                                          </div>
                                      )}
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>

                  {/* 搜索页脚 */}
                  <div class="px-6 py-3 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                      <div class="flex items-center space-x-4">
                          <div class="flex items-center space-x-1.5">
                              <kbd class="px-1 py-0.5 rounded border border-gray-200 bg-white text-[9px] text-gray-400 font-sans shadow-sm">↑↓</kbd>
                              <span class="text-[10px] text-gray-400">选择</span>
                          </div>
                          <div class="flex items-center space-x-1.5">
                              <kbd class="px-1 py-0.5 rounded border border-gray-200 bg-white text-[9px] text-gray-400 font-sans shadow-sm">↵</kbd>
                              <span class="text-[10px] text-gray-400">跳转</span>
                          </div>
                      </div>
                      <div class="text-[10px] text-gray-400 flex items-center">
                          基于 Vapor Component 深度索引
                      </div>
                  </div>
              </div>
              {/* 点击遮盖层关闭 */}
              <div class="absolute inset-0 -z-10" onClick={() => isSearchFocused.value = false}></div>
          </div>
      )}
    </div>
  );
});

export default App;
