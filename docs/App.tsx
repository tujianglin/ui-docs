import { computed, defineComponent, markRaw, nextTick, onMounted, onUnmounted, provide, ref, shallowRef, watch } from 'vue';
import Markdown from './components/Markdown';
import Sidebar from './components/Sidebar';
import { slugify } from './utils/slugify';
import { parseStoryMetaFromVue } from './utils/storyMeta';

// Scan for stories and raw files recursively
const getExampleModules = () => import.meta.glob('../**/*.story.vue');
const getRawExampleModules = () => ({
  ...import.meta.glob('../**/*.vue', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('../**/*.tsx', { eager: true, query: '?raw', import: 'default' }),
});
const exampleModules = shallowRef<Record<string, () => Promise<any>>>(getExampleModules());
const rawExampleModules = shallowRef<Record<string, any>>({ ...getRawExampleModules() });

const refreshModules = () => {
  exampleModules.value = getExampleModules();
  rawExampleModules.value = { ...getRawExampleModules() };
};

if (import.meta.hot) {
  const shouldRefreshForPath = (path: string) => {
    const cleanPath = path.split('?')[0];
    return cleanPath.endsWith('.story.vue') || cleanPath.endsWith('.vue') || cleanPath.endsWith('.tsx');
  };

  import.meta.hot.on('vite:afterUpdate', (payload: any) => {
    const updates = Array.isArray(payload?.updates) ? payload.updates : [];
    if (updates.some((update: any) => shouldRefreshForPath(update.path || ''))) {
      refreshModules();
    }
  });
}

export { slugify };

const App = defineComponent(() => {
  const activeKey = ref(''); // Initialized after menu ordering
  const activeMainTab = ref('demo'); // 'demo' | 'docs'
  const searchQuery = ref('');
  const isSearchFocused = ref(false);
  const searchSelectedIndex = ref(0);
  const ActiveComponent = shallowRef<any>(null);
  const mainRef = ref<HTMLElement | null>(null);
  const activeAnchorId = ref('');
  const pendingAnchorId = ref('');
  const shouldResetAnchorOnStoryChange = ref(false);
  let scrollRaf = 0;

  const resolveOrderValue = (value?: number) =>
    typeof value === 'number' && Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;

  const highlightQuery = computed(() => searchQuery.value.trim());
  const highlightClasses = 'rounded bg-amber-100 px-1 text-amber-800';
  const typeLabelMap: Record<string, string> = {
    component: '组件',
    demo: '示例',
    'doc-header': '标题',
    'doc-content': '内容',
  };
  const typeTagClasses: Record<string, string> = {
    component: 'bg-blue-50 text-blue-600',
    demo: 'bg-emerald-50 text-emerald-600',
    'doc-header': 'bg-amber-50 text-amber-700',
    'doc-content': 'bg-slate-100 text-slate-600',
  };

  const renderHighlightedText = (text: string, query: string) => {
    const safeText = text || '';
    const rawQuery = query.trim();
    if (!safeText || !rawQuery) return safeText;

    const lowerText = safeText.toLowerCase();
    const lowerQuery = rawQuery.toLowerCase();
    if (!lowerText.includes(lowerQuery)) return safeText;

    const nodes: any[] = [];
    let start = 0;
    let index = lowerText.indexOf(lowerQuery, start);
    while (index !== -1) {
      if (index > start) {
        nodes.push(safeText.slice(start, index));
      }
      const match = safeText.slice(index, index + lowerQuery.length);
      nodes.push(<span class={highlightClasses}>{match}</span>);
      start = index + lowerQuery.length;
      index = lowerText.indexOf(lowerQuery, start);
    }
    if (start < safeText.length) nodes.push(safeText.slice(start));
    return nodes;
  };

  const getRawContentInfo = (path: string) => {
    // Try both with and without ./ for robustness across dev/prod
    const normalizedKey = path.startsWith('./') ? path : `./${path}`;
    const keyWithoutDot = path.startsWith('./') ? path.substring(2) : path;
    const candidates = [normalizedKey, keyWithoutDot];

    if (!/\.\w+$/.test(keyWithoutDot)) {
      candidates.push(
        `${normalizedKey}.vue`,
        `${keyWithoutDot}.vue`,
        `${normalizedKey}.tsx`,
        `${keyWithoutDot}.tsx`,
        `${normalizedKey}.ts`,
        `${keyWithoutDot}.ts`,
      );
    }

    const resolveLang = (key: string) => {
      if (key.endsWith('.tsx')) return 'tsx';
      if (key.endsWith('.ts')) return 'typescript';
      if (key.endsWith('.jsx')) return 'jsx';
      if (key.endsWith('.js')) return 'javascript';
      return 'vue';
    };

    for (const key of new Set(candidates)) {
      const content = rawExampleModules.value[key];
      if (typeof content === 'string') return { content, lang: resolveLang(key) };
      if (content && typeof (content as any).default === 'string') {
        return { content: (content as any).default as string, lang: resolveLang(key) };
      }
    }
    return { content: '', lang: 'vue' };
  };

  const getRawContent = (path: string) => getRawContentInfo(path).content;

  const getStoryNameFromPath = (path: string) => {
    const fileName = path.split('/').pop() || '';
    return fileName.replace(/\.story\.vue$/, '');
  };

  const storyMetaMap = computed(() => {
    const map: Record<
      string,
      { title: string; label: string; group: string; storyDescription?: string; groupOrder?: number; order?: number }
    > = {};

    Object.keys(exampleModules.value).forEach((path) => {
      const nameFromPath = getStoryNameFromPath(path);
      const raw = getRawContent(path);
      const meta = parseStoryMetaFromVue(raw);

      const title = meta.title || nameFromPath;
      const label = meta.label || title || nameFromPath;
      const group = meta.group || '组件库';

      map[path] = {
        title,
        label,
        group,
        storyDescription: meta.description,
        groupOrder: meta.groupOrder,
        order: meta.order,
      };
    });

    return map;
  });

  const menuItems = computed(() => {
    return Object.keys(exampleModules.value).map((path) => {
      const meta = storyMetaMap.value[path];
      return {
        key: path,
        label: meta?.label || getStoryNameFromPath(path),
        group: meta?.group || '组件库',
        groupOrder: meta?.groupOrder,
        order: meta?.order,
      };
    });
  });

  const getStoryFileName = (path: string) => path.split('/').pop() || path;
  const stripStoryKeyPrefix = (path: string) => path.replace(/^(\.\/|\.\.\/)+/, '').replace(/^\//, '');

  const storyKeyMaps = computed(() => {
    const keys = Object.keys(exampleModules.value);
    const baseNameCounts = new Map<string, number>();

    keys.forEach((key) => {
      const baseName = getStoryFileName(key);
      baseNameCounts.set(baseName, (baseNameCounts.get(baseName) || 0) + 1);
    });

    const aliasMap: Record<string, string> = {};
    const shortMap: Record<string, string> = {};

    keys.forEach((key) => {
      const baseName = getStoryFileName(key);
      const trimmed = stripStoryKeyPrefix(key);

      aliasMap[key] = key;
      if (trimmed) aliasMap[trimmed] = key;

      if (baseNameCounts.get(baseName) === 1) {
        aliasMap[baseName] = key;
        shortMap[key] = baseName;
        return;
      }

      shortMap[key] = trimmed || key;
    });

    return { aliasMap, shortMap };
  });

  const normalizeStoryKey = (rawKey: string) => {
    if (!rawKey) return '';
    const map = storyKeyMaps.value.aliasMap;
    if (map[rawKey]) return map[rawKey];
    const trimmed = stripStoryKeyPrefix(rawKey);
    if (trimmed && map[trimmed]) return map[trimmed];
    return '';
  };

  const getStoryKeyFromUrl = () => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    const rawKey = params.get('story') || params.get('path') || '';
    return normalizeStoryKey(rawKey);
  };

  const syncStoryKeyToUrl = (key: string) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (key) {
      const shortKey = storyKeyMaps.value.shortMap[key] || key;
      url.searchParams.set('story', shortKey);
      url.searchParams.delete('path');
    } else {
      url.searchParams.delete('story');
      url.searchParams.delete('path');
    }
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, '', nextUrl);
    }
  };

  const resolveStoryLoader = (rawKey: string) => {
    const normalizedKey = normalizeStoryKey(rawKey);
    if (!normalizedKey) return undefined;
    return exampleModules.value[normalizedKey];
  };

  const loadStory = async (key: string) => {
    const loader = resolveStoryLoader(key);
    if (!loader) {
      ActiveComponent.value = null;
      return;
    }

    try {
      const mod = await loader();
      ActiveComponent.value = mod?.default ? markRaw(mod.default) : null;
    } catch (error) {
      console.error('Failed to load story module:', key, error);
      ActiveComponent.value = null;
    }
  };

  const parsedDocs = computed(() => {
    const rawContent = getRawContent(activeKey.value);
    const docsMatch = rawContent.match(/<docs lang="md">([\s\S]*?)<\/docs>/);

    // @ts-ignore
    const content = docsMatch ? docsMatch[1].trim() : '';
    const titleMatch = content.match(/^#\s+(.*)/m);

    // Clean default title: only the word before .story.vue
    const nameFromPath = getStoryNameFromPath(activeKey.value);
    const titleFromDocs = titleMatch ? titleMatch[1] : nameFromPath;

    // Extract subtitle: find the first paragraph after the title
    const body = content.replace(/^#\s+.*\n?/, '').trim();
    const bodyLines = body.split('\n').filter((line) => line.trim() !== '');
    const subtitleFromDocs =
      bodyLines.length > 0 && !bodyLines[0].startsWith('##') ? bodyLines[0] : '在这里查看组件的各种用法演示和 API 文档。';

    const description = content.replace(/^#\s+.*\n?/, '').trim();

    const meta = storyMetaMap.value[activeKey.value];
    const title = meta?.title || titleFromDocs;
    const subtitle = meta?.storyDescription || subtitleFromDocs;

    return { title, subtitle, description };
  });

  const activeDocs = parsedDocs;

  const pickStringAttr = (attrs: string, name: string) => {
    const direct = attrs.match(new RegExp(String.raw`\b${name}\s*=\s*(?:"([^"]*)"|'([^']*)')`));
    const bound = attrs.match(new RegExp(String.raw`(?:\b(?:v-bind:|:))${name}\s*=\s*(?:"([^"]*)"|'([^']*)')`));
    const match = direct || bound;
    return (match?.[1] ?? match?.[2] ?? '').trim() || undefined;
  };

  const pickNumberAttr = (attrs: string, name: string) => {
    const raw = pickStringAttr(attrs, name);
    if (!raw) return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  };

  const variantCodesMap = computed(() => {
    const storyRaw = getRawContent(activeKey.value)
      .replace(/<docs[\s\S]*?<\/docs>/, '')
      .trim();
    const map: Record<string, { code: string; lang: string }> = {};
    const variantRegex = /<Variant\b([^>]*)>([\s\S]*?)<\/Variant>/g;

    // Find imports in the story script to support deep extraction
    const scriptMatch = storyRaw.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/);
    const scriptContent = scriptMatch ? scriptMatch[1] : '';

    const variants: { title: string; order?: number; content: string; lang: string; index: number }[] = [];
    let match;
    let index = 0;
    while ((match = variantRegex.exec(storyRaw)) !== null) {
      const attrs = match[1] || '';
      const title = pickStringAttr(attrs, 'title');
      if (!title) continue;
      const order = pickNumberAttr(attrs, 'order');
      const content = match[2].trim();
      let resolvedContent = content;
      let resolvedLang = 'vue';

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
            const targetInfo = getRawContentInfo(targetPath);
            if (targetInfo.content) {
              resolvedContent = targetInfo.content.replace(/<docs[\s\S]*?<\/docs>/, '').trim();
              resolvedLang = targetInfo.lang;
            }
          }
        }
      }

      variants.push({ title, order, content: resolvedContent, lang: resolvedLang, index: index++ });
    }
    variants
      .sort((a, b) => {
        const orderA = resolveOrderValue(a.order);
        const orderB = resolveOrderValue(b.order);
        if (orderA !== orderB) return orderA - orderB;
        return a.index - b.index;
      })
      .forEach((variant) => {
        map[variant.title] = { code: variant.content, lang: variant.lang };
      });
    return map;
  });

  const anchors = computed(() => {
    if (activeMainTab.value === 'demo') {
      return Object.keys(variantCodesMap.value).map((title) => ({
        id: slugify(title),
        text: title,
        level: 2,
      }));
    } else {
      const content = activeDocs.value.description;
      const foundHeaders: { text: string; id: string; level: number }[] = [];
      const lines = content.split('\n');
      lines.forEach((line) => {
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

  const decodeHash = (value: string) => {
    if (!value) return '';
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  const updateHash = (id: string) => {
    if (!id) return;
    const currentHash = decodeHash(window.location.hash.replace('#', ''));
    if (currentHash !== id) {
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  const updateActiveAnchor = (syncHash: boolean) => {
    const container = mainRef.value;
    if (!container) return;

    const anchorTargets = anchors.value
      .map((anchor) => ({ id: anchor.id, el: document.getElementById(anchor.id) }))
      .filter((item): item is { id: string; el: HTMLElement } => Boolean(item.el));

    if (!anchorTargets.length) {
      activeAnchorId.value = '';
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const offset = 120;
    const current = scrollTop + offset;

    if (pendingAnchorId.value) {
      const pendingTarget = document.getElementById(pendingAnchorId.value);
      if (pendingTarget) {
        const pendingTop = pendingTarget.getBoundingClientRect().top - containerRect.top + scrollTop;
        if (pendingTop > current) {
          activeAnchorId.value = pendingAnchorId.value;
          return;
        }
      }
      pendingAnchorId.value = '';
    }

    let currentId = anchorTargets[0].id;
    anchorTargets.forEach(({ id, el }) => {
      const top = el.getBoundingClientRect().top - containerRect.top + scrollTop;
      if (top <= current) currentId = id;
    });

    if (currentId !== activeAnchorId.value) {
      activeAnchorId.value = currentId;
      if (syncHash) updateHash(currentId);
    }
  };

  const scheduleActiveAnchorUpdate = () => {
    if (scrollRaf) return;
    scrollRaf = window.requestAnimationFrame(() => {
      scrollRaf = 0;
      updateActiveAnchor(true);
    });
  };

  // NEW: Global Content Index for Spotlight Search
  const globalIndex = computed(() => {
    const index: {
      type: 'component' | 'demo' | 'doc-header' | 'doc-content';
      key: string;
      label: string;
      anchorId?: string;
      snippet?: string;
    }[] = [];

    Object.keys(exampleModules.value).forEach((componentKey) => {
      const meta = storyMetaMap.value[componentKey];
      const componentLabel = meta?.label || getStoryNameFromPath(componentKey);
      if (!componentLabel) return;

      index.push({ type: 'component', key: componentKey, label: componentLabel });

      const raw = getRawContent(componentKey);
      if (!raw) return;

      const docsMatch = raw.match(/<docs lang="md">([\s\S]*?)<\/docs>/);
      const docsContent = docsMatch ? docsMatch[1] : '';

      // CI Fixes:
      // [x] 创建自动化部署配置文件 (`deploy.yml`) (已修复权限与路径)
      // [x] 配置文档站点专属构建脚本
      // [x] 修复全站白屏 TypeError (防自建数据异常)
      const variantRegex = /<Variant\b([^>]*)>/g;
      let vMatch;
      while ((vMatch = variantRegex.exec(raw)) !== null) {
        const attrs = vMatch[1] || '';
        const title = pickStringAttr(attrs, 'title');
        if (!title) continue;
        index.push({
          type: 'demo',
          key: componentKey,
          label: title,
          anchorId: slugify(title),
        });
      }

      // 3. Index Markdown Headers & Content snippets
      if (docsContent) {
        const lines = docsContent.split('\n');
        lines.forEach((line) => {
          // Headers
          const hMatch = line.match(/^(#{2,3})\s+(.*)/);
          if (hMatch) {
            index.push({
              type: 'doc-header',
              key: componentKey,
              label: hMatch[2],
              anchorId: slugify(hMatch[2]),
            });
          }
          // Simple body indexing (lines with reasonable length, avoiding code blocks)
          else if (line.trim().length > 10 && !line.startsWith('```') && !line.startsWith('<')) {
            index.push({
              type: 'doc-content',
              key: componentKey,
              label: line.trim().slice(0, 50) + (line.length > 50 ? '...' : ''),
              snippet: line.trim(),
              anchorId: 'docs', // Jump to docs tab
            });
          }
        });
      }
    });
    return index;
  });

  const scrollToAnchor = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return false;
    pendingAnchorId.value = id;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    activeAnchorId.value = id;
    updateHash(id);
    return true;
  };

  const filteredResults = computed(() => {
    const query = searchQuery.value.toLowerCase().trim();
    if (!query) return [];

    const results = globalIndex.value.filter(
      (item) => item.label.toLowerCase().includes(query) || (item.snippet && item.snippet.toLowerCase().includes(query)),
    );

    // Deduplicate and limit
    const seen = new Set();
    return results
      .filter((r) => {
        const uniqueKey = `${r.type}-${r.key}-${r.anchorId || ''}-${r.label}`;
        if (seen.has(uniqueKey)) return false;
        seen.add(uniqueKey);
        return true;
      })
      .slice(0, 12);
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
    if (mainRef.value) {
      mainRef.value.addEventListener('scroll', scheduleActiveAnchorUpdate, { passive: true });
    }
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', onGlobalKeyDown);
    if (mainRef.value) {
      mainRef.value.removeEventListener('scroll', scheduleActiveAnchorUpdate);
    }
    if (scrollRaf) window.cancelAnimationFrame(scrollRaf);
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
  provide('activeStoryKey', activeKey);

  watch(
    [activeKey, exampleModules],
    ([key]) => {
      void loadStory(key);
    },
    { immediate: true },
  );

  watch(activeKey, (key) => {
    syncStoryKeyToUrl(key);
  });

  // Reset tab and scroll when switching components
  watch(activeKey, () => {
    activeMainTab.value = 'demo';
  });

  const sidebarSections = computed(() => [
    ...(() => {
      const groups = new Map<
        string,
        {
          title: string;
          groupOrder?: number;
          index: number;
          items: { key: string; label: string; order?: number; index: number }[];
        }
      >();
      let groupIndex = 0;

      menuItems.value.forEach((item) => {
        const groupTitle = item.group || '组件库';
        const order = typeof item.order === 'number' ? item.order : undefined;
        const groupOrder = typeof item.groupOrder === 'number' ? item.groupOrder : undefined;
        const section = groups.get(groupTitle) || { title: groupTitle, groupOrder: undefined, index: groupIndex++, items: [] };
        if (typeof groupOrder === 'number') {
          section.groupOrder = typeof section.groupOrder === 'number' ? Math.min(section.groupOrder, groupOrder) : groupOrder;
        }
        section.items.push({ key: item.key, label: item.label, order, index: section.items.length });
        groups.set(groupTitle, section);
      });

      return Array.from(groups.values())
        .map((section) => {
          section.items.sort((a, b) => {
            const aOrder = resolveOrderValue(a.order);
            const bOrder = resolveOrderValue(b.order);
            if (aOrder !== bOrder) return aOrder - bOrder;
            return a.index - b.index;
          });
          return section;
        })
        .sort((a, b) => {
          const aOrder = resolveOrderValue(a.groupOrder);
          const bOrder = resolveOrderValue(b.groupOrder);
          if (aOrder !== bOrder) return aOrder - bOrder;
          return a.index - b.index;
        })
        .map(({ title, items }) => ({ title, items }));
    })(),
  ]);

  const orderedMenuItems = computed(() => sidebarSections.value.flatMap((section) => section.items));

  const pickDefaultActiveKey = (items: { key: string; order?: number }[]) => {
    if (!items.length) return '';
    const orderOne = items.find((item) => item.order === 1);
    return orderOne?.key || items[0].key;
  };

  watch(
    orderedMenuItems,
    (items) => {
      if (!items.length) return;
      const hasActive = activeKey.value && items.some((item) => item.key === activeKey.value);
      if (!hasActive) {
        const urlKey = getStoryKeyFromUrl();
        if (urlKey && items.some((item) => item.key === urlKey)) {
          activeKey.value = urlKey;
          return;
        }
        activeKey.value = pickDefaultActiveKey(items);
      }
    },
    { immediate: true },
  );

  watch(
    [anchors, activeMainTab, activeKey, ActiveComponent],
    async () => {
      await nextTick();
      const rawHash = window.location.hash.replace('#', '');
      const hash = decodeHash(rawHash);
      if (shouldResetAnchorOnStoryChange.value) {
        const firstAnchor = anchors.value[0];
        if (!firstAnchor) {
          shouldResetAnchorOnStoryChange.value = false;
        } else if (scrollToAnchor(firstAnchor.id)) {
          shouldResetAnchorOnStoryChange.value = false;
          return;
        } else {
          return;
        }
      }

      if (hash && anchors.value.some((anchor) => anchor.id === hash)) {
        if (scrollToAnchor(hash)) return;
      }
      updateActiveAnchor(false);
    },
    { immediate: true },
  );

  return () => (
    <div class="flex h-screen overflow-hidden bg-white font-sans text-gray-900">
      <Sidebar
        sections={sidebarSections.value}
        activeKey={activeKey.value}
        onUpdate:activeKey={(val) => {
          shouldResetAnchorOnStoryChange.value = true;
          activeKey.value = val;
        }}
      />

      <div class="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header class="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-10">
          <div />

          <div class="flex items-center space-x-6">
            <div
              onClick={() => (isSearchFocused.value = true)}
              class="flex w-48 cursor-text items-center justify-between rounded-full border border-transparent bg-gray-50 py-1.5 pr-3 pl-4 text-xs text-gray-400 transition-all hover:bg-gray-100"
            >
              <div class="flex items-center">
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  class="mr-2 text-gray-400"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span>搜索组件 (⌘K)</span>
              </div>
            </div>

            <div class="flex items-center space-x-4 border-l border-gray-100 pl-6">
              <button class="text-gray-400 transition-colors hover:text-gray-900">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main ref={mainRef} class="flex-1 overflow-y-auto bg-white">
          <div class="w-full max-w-none px-10 py-12 md:px-20 lg:px-32">
            <div class="mb-8 flex items-center justify-between border-b border-gray-100">
              <div>
                <h1 class="mb-2 flex items-center text-3xl font-semibold tracking-tight text-gray-900">
                  {activeDocs.value.title}
                </h1>
                <p class="text-[14px] font-normal text-gray-500">{activeDocs.value.subtitle}</p>
              </div>
              <div class="flex items-center space-x-1 self-end pb-px">
                <button
                  onClick={() => (activeMainTab.value = 'demo')}
                  class={[
                    'relative px-6 py-3 text-sm font-medium transition-all',
                    activeMainTab.value === 'demo' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900',
                  ]}
                >
                  设计方案
                  {activeMainTab.value === 'demo' && (
                    <div class="animate-in fade-in slide-in-from-bottom-1 absolute right-0 bottom-0 left-0 h-0.5 bg-blue-600" />
                  )}
                </button>
                <button
                  onClick={() => (activeMainTab.value = 'docs')}
                  class={[
                    'relative px-6 py-3 text-sm font-medium transition-all',
                    activeMainTab.value === 'docs' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900',
                  ]}
                >
                  文档详情
                  {activeMainTab.value === 'docs' && (
                    <div class="animate-in fade-in slide-in-from-bottom-1 absolute right-0 bottom-0 left-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              </div>
            </div>

            <div class="flex flex-col lg:flex-row lg:space-x-12">
              <div class="min-w-0 flex-1">
                {activeMainTab.value === 'docs' ? (
                  <div class="animate-in fade-in slide-in-from-bottom-4 max-w-4xl duration-500">
                    <h1 class="mb-8 text-4xl font-black tracking-tight text-gray-900">{activeDocs.value.title}</h1>
                    <Markdown content={activeDocs.value.description} />
                  </div>
                ) : (
                  <div class="animate-in fade-in slide-in-from-bottom-4 relative min-h-[600px] space-y-12 duration-500">
                    {ActiveComponent.value && <ActiveComponent.value />}
                  </div>
                )}
              </div>

              {/* Right Side Anchor Navigation */}
              {anchors.value.length > 0 && (
                <aside class="hidden w-64 shrink-0 lg:block">
                  <div class="sticky top-24 border-l border-gray-50 pt-4 pl-8">
                    <div class="mb-6 text-[11px] font-bold tracking-widest text-gray-400 uppercase">On this page</div>
                    <nav class="space-y-1">
                      {anchors.value.map((anchor) => (
                        <button
                          key={anchor.id}
                          onClick={() => scrollToAnchor(anchor.id)}
                          aria-current={activeAnchorId.value === anchor.id ? 'location' : undefined}
                          class={[
                            'group flex w-full items-center rounded-lg px-3 py-1.5 text-left text-[13px] leading-relaxed transition-all',
                            activeAnchorId.value === anchor.id
                              ? 'bg-blue-50 font-semibold text-blue-600'
                              : 'font-medium text-gray-500 hover:bg-blue-50 hover:text-blue-600',
                          ]}
                          style={{ paddingLeft: `${(anchor.level - 1) * 12}px` }}
                        >
                          <div
                            class={[
                              'mr-3 h-1 w-1 rounded-full transition-opacity',
                              activeAnchorId.value === anchor.id
                                ? 'bg-blue-400 opacity-100'
                                : 'bg-gray-300 opacity-0 group-hover:opacity-100',
                            ]}
                          />
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
        <div class="animate-in fade-in pointer-events-auto fixed inset-0 z-[9999] flex items-start justify-center bg-gray-900/40 px-4 pt-24 backdrop-blur-sm duration-300">
          <div
            class="animate-in slide-in-from-top-4 w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 搜索头部 */}
            <div class="flex items-center border-b border-gray-50 px-6 py-4">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                class="mr-4 text-blue-500"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
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
                class="flex-1 border-none bg-transparent text-base text-gray-900 outline-none"
              />
              <div class="flex items-center space-x-1.5">
                <kbd class="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-sans text-[10px] text-gray-400">ESC</kbd>
                <span class="text-[10px] text-gray-300">关闭</span>
              </div>
            </div>

            {/* 搜索内容区 */}
            <div class="custom-scrollbar max-h-[480px] overflow-auto py-2">
              {searchQuery.value.length === 0 ? (
                <div class="px-6 py-12 text-center">
                  <div class="mb-4 text-3xl text-gray-200">🔍</div>
                  <div class="text-sm text-gray-400">输入关键词开始检索全站内容</div>
                </div>
              ) : filteredResults.value.length === 0 ? (
                <div class="px-6 py-12 text-center text-sm text-gray-400">未找到与 "{searchQuery.value}" 相关的结果</div>
              ) : (
                <div>
                  <div class="mb-1 border-b border-gray-50 px-6 py-2 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                    搜索结果 ({filteredResults.value.length})
                  </div>
                  {filteredResults.value.map((result, index) => (
                    <button
                      key={`${result.type}-${result.key}-${result.label}`}
                      onClick={() => handleSearchSelect(result)}
                      onMouseenter={() => (searchSelectedIndex.value = index)}
                      class={[
                        'flex w-full items-start px-6 py-3.5 text-left transition-all',
                        searchSelectedIndex.value === index ? 'bg-blue-50/50' : 'hover:bg-gray-50',
                      ]}
                    >
                      <div
                        class={[
                          'mt-0.5 mr-4 rounded-lg p-1.5 transition-colors',
                          searchSelectedIndex.value === index ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-400',
                        ]}
                      >
                        {result.type === 'component' && (
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                          </svg>
                        )}
                        {result.type === 'demo' && (
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                          </svg>
                        )}
                        {result.type === 'doc-header' && (
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 7V4h16v3M9 20h6M12 4v16"></path>
                          </svg>
                        )}
                        {result.type === 'doc-content' && (
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                        )}
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center justify-between">
                          <div class="flex min-w-0 items-center gap-2">
                            <span
                              class={[
                                'min-w-0 flex-1 truncate text-[14px] font-bold',
                                searchSelectedIndex.value === index ? 'text-blue-600' : 'text-gray-900',
                              ]}
                            >
                              {renderHighlightedText(result.label, highlightQuery.value)}
                            </span>
                            <span
                              class={[
                                'shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold',
                                typeTagClasses[result.type] || 'bg-gray-100 text-gray-500',
                              ]}
                            >
                              {typeLabelMap[result.type] || result.type}
                            </span>
                          </div>
                          <span class="ml-3 shrink-0 rounded bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                            {result.key}
                          </span>
                        </div>
                        {result.snippet && (
                          <p class="mt-1 line-clamp-1 text-xs text-gray-500">
                            {renderHighlightedText(result.snippet, highlightQuery.value)}
                          </p>
                        )}
                      </div>
                      {searchSelectedIndex.value === index && (
                        <div class="ml-4 self-center">
                          <kbd class="rounded border border-blue-200 bg-blue-50 px-2 py-1 font-sans text-[10px] font-bold text-blue-500">
                            ↵
                          </kbd>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 搜索页脚 */}
            <div class="flex items-center justify-between border-t border-gray-50 bg-gray-50/50 px-6 py-3">
              <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-1.5">
                  <kbd class="rounded border border-gray-200 bg-white px-1 py-0.5 font-sans text-[9px] text-gray-400 shadow-sm">
                    ↑↓
                  </kbd>
                  <span class="text-[10px] text-gray-400">选择</span>
                </div>
                <div class="flex items-center space-x-1.5">
                  <kbd class="rounded border border-gray-200 bg-white px-1 py-0.5 font-sans text-[9px] text-gray-400 shadow-sm">
                    ↵
                  </kbd>
                  <span class="text-[10px] text-gray-400">跳转</span>
                </div>
              </div>
              <div class="flex items-center text-[10px] text-gray-400">基于 Vapor Component 深度索引</div>
            </div>
          </div>
          {/* 点击遮盖层关闭 */}
          <div class="absolute inset-0 -z-10" onClick={() => (isSearchFocused.value = false)}></div>
        </div>
      )}
    </div>
  );
});

export default App;
