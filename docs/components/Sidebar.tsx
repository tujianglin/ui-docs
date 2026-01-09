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
      <aside class="w-72 border-r border-gray-100 h-full overflow-y-auto bg-white flex flex-col">
        {/* Logo/Title Area */}
        <div class="px-6 py-6 border-b border-gray-100 bg-white">
          <div class="flex items-center space-x-3">
             <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                V
             </div>
             <div>
                <h1 class="text-sm font-bold text-gray-900 leading-none">Vapor Docs</h1>
                <span class="text-[10px] text-gray-400 font-medium">VERSION 0.1.0</span>
             </div>
          </div>
        </div>

        <nav class="flex-1 py-6 px-4 space-y-8">
          {props.sections.map((section) => (
            <div key={section.title} class="space-y-2">
              <h3 class="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{section.title}</h3>
              <div class="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => emit('update:activeKey', item.key)}
                    class={[
                      'w-full text-left px-6 py-2.5 transition-all duration-200 text-sm font-medium flex items-center group relative',
                      props.activeKey === item.key
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                    ]}
                  >
                    {item.label}
                    {props.activeKey === item.key && (
                      <div class="absolute right-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Area */}
        <div class="p-6 border-t border-gray-100 bg-white shadow-sm mt-auto">
            <div class="text-[10px] font-bold text-gray-400 uppercase mb-3">Links</div>
            <div class="flex items-center space-x-4">
                <a href="#" class="text-gray-400 hover:text-blue-500 transition-colors">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                </a>
                <a href="#" class="text-gray-400 hover:text-blue-500 transition-colors">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </a>
            </div>
        </div>
      </aside>
    );
  },
});
