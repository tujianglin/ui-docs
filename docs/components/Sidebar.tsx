import { defineComponent, type PropType } from 'vue';

export interface MenuItem {
  key: string;
  label: string;
}

export interface SidebarSection {
  title: string;
  items: MenuItem[];
}

export default defineComponent({
  name: 'Sidebar',
  props: {
    sections: {
      type: Array as PropType<SidebarSection[]>,
      required: true,
    },
    activeKey: {
      type: String,
      required: true,
    },
  },
  emits: ['update:activeKey'],
  setup(props, { emit }) {
    return () => (
      <aside class="flex h-full w-72 flex-col overflow-y-auto border-r border-gray-100 bg-white">
        {/* Logo/Title Area */}
        <div class="border-b border-gray-100 bg-white px-6 py-6">
          <div class="flex items-center space-x-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white shadow-sm">
              V
            </div>
            <div>
              <h1 class="text-sm leading-none font-bold text-gray-900">Vapor Docs</h1>
              <span class="text-[10px] font-medium text-gray-400">VERSION 0.1.0</span>
            </div>
          </div>
        </div>

        <nav class="flex-1 space-y-8 px-4 py-6">
          {props.sections.map((section) => (
            <div key={section.title} class="space-y-2">
              <h3 class="px-4 text-[11px] font-bold tracking-widest text-gray-400 uppercase">{section.title}</h3>
              <div class="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => emit('update:activeKey', item.key)}
                    class={[
                      'group relative flex w-full items-center px-6 py-2.5 text-left text-sm font-medium transition-all duration-200',
                      props.activeKey === item.key
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-900',
                    ]}
                  >
                    {item.label}
                    {props.activeKey === item.key && <div class="absolute top-0 right-0 bottom-0 w-1 rounded-l bg-blue-500" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Area */}
        <div class="mt-auto border-t border-gray-100 bg-white p-6 shadow-sm">
          <div class="mb-3 text-[10px] font-bold text-gray-400 uppercase">Links</div>
          <div class="flex items-center space-x-4">
            <a href="#" class="text-gray-400 transition-colors hover:text-blue-500">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
            </a>
            <a href="#" class="text-gray-400 transition-colors hover:text-blue-500">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </a>
          </div>
        </div>
      </aside>
    );
  },
});
