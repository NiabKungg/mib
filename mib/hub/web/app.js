// Entry point: registers every component module globally on the Vue app,
// defines the shell (icon rail / top bar / routed main / mobile tab bar)
// and mounts it. `Vue` is the global exposed by vendor/vue.global.prod.js.

import { route } from './js/router.js';
import { state, clock, initConnection } from './js/store.js';
import { fmtClock, fmtCountdown, fmtTime, telegramStatus } from './js/format.js';

import * as icons from './js/icons.js';
import * as common from './js/components/common.js';
import * as topology from './js/components/topology.js';
import * as run from './js/components/run.js';
import * as feed from './js/components/feed.js';
import * as llm from './js/components/llm.js';
import * as brief from './js/components/brief.js';

import { LiveView } from './js/views/live.js';
import { BriefsListView, BriefView } from './js/views/briefs.js';
import { ItemsView } from './js/views/items.js';
import { RunsListView, RunView } from './js/views/runs.js';
import { SourcesView } from './js/views/sources.js';
import { SettingsView } from './js/views/settings.js';

const NotFound = {
  name: 'NotFound',
  template: `<empty-state icon="x-circle" title="Page not found" hint="Check the address, or pick a section from the rail."/>`,
};

const VIEWS = {
  live: LiveView,
  briefs: BriefsListView,
  brief: BriefView,
  items: ItemsView,
  runs: RunsListView,
  run: RunView,
  sources: SourcesView,
  settings: SettingsView,
  notfound: NotFound,
};

const NAV = [
  { name: 'live', path: '/', icon: 'live', label: 'Live' },
  { name: 'briefs', path: '/briefs', icon: 'briefs', label: 'Briefs' },
  { name: 'items', path: '/items', icon: 'items', label: 'Items' },
  { name: 'runs', path: '/runs', icon: 'runs', label: 'Runs' },
  { name: 'sources', path: '/sources', icon: 'sources', label: 'Sources' },
  { name: 'settings', path: '/settings', icon: 'settings', label: 'Settings' },
];

// Sections that share a nav highlight with a detail route.
const NAV_ALIAS = { brief: 'briefs', run: 'runs' };

const App = {
  name: 'App',
  setup() {
    initConnection();
    return { route, state, clock, NAV };
  },
  computed: {
    currentView() {
      return VIEWS[this.route.name] || NotFound;
    },
    activeNav() {
      return NAV_ALIAS[this.route.name] || this.route.name;
    },
    clockTime() {
      return fmtClock(this.clock, this.state.tz);
    },
    nextBrief() {
      const list = this.state.schedule.next || [];
      return list.find((x) => x.kind === 'brief') || null;
    },
    tgStatus() {
      return telegramStatus(this.state.telegram);
    },
  },
  methods: {
    isActive(n) {
      return this.activeNav === n.name;
    },
    fmtCountdown,
    fmtTime,
  },
  template: `
  <div class="shell">
    <aside class="rail">
      <div class="rail__brand"><icon name="logo" :size="20"/></div>
      <nav class="rail__nav">
        <a v-for="n in NAV" :key="n.name" :href="'#'+n.path" class="rail__link" :class="{active: isActive(n)}">
          <icon :name="n.icon" :size="19"/>
          <span class="rail__tip">{{ n.label }}</span>
        </a>
      </nav>
    </aside>

    <header class="topbar">
      <div class="topbar__brand">
        <span class="brand-mark">MIB</span><span class="brand-name">Morning Intelligence Brief</span>
      </div>
      <div class="topbar__status">
        <status-pill v-for="w in state.workers" :key="w.id"
          :status="w.online ? (w.busy ? 'warn' : 'ok') : 'muted'" :pulse="w.online && w.busy"
          :label="(w.host || w.id) + ' ' + (w.online ? (w.busy ? 'busy' : 'online') : 'offline')"/>
        <status-pill :status="state.llm.online ? (state.llm.busy ? 'warn' : 'ok') : 'muted'" :pulse="state.llm.online && state.llm.busy"
          :label="'Brain ' + (state.llm.online ? (state.llm.busy ? 'busy' : 'ready') : 'offline')"/>
        <status-pill :status="tgStatus.v" :pulse="tgStatus.pulse" :label="'Telegram ' + tgStatus.label"/>
      </div>
      <div class="topbar__right">
        <span class="conn-dot" :class="state.connected" :title="'Live updates: ' + state.connected"></span>
        <div class="clock">
          <div class="clock__time tabular">{{ clockTime }}</div>
          <div v-if="nextBrief" class="clock__countdown tabular">Next brief {{ fmtTime(nextBrief.at, state.tz) }} &middot; {{ fmtCountdown(nextBrief.at, clock) }}</div>
        </div>
      </div>
    </header>

    <main class="main">
      <component :is="currentView" v-bind="route.params" :key="route.name + JSON.stringify(route.params)"/>
    </main>

    <nav class="tabbar">
      <a v-for="n in NAV" :key="n.name" :href="'#'+n.path" class="tabbar__link" :class="{active: isActive(n)}">
        <icon :name="n.icon" :size="19"/>{{ n.label }}
      </a>
    </nav>

    <toast-stack/>
  </div>`,
};

const app = Vue.createApp(App);
icons.register(app);
common.register(app);
topology.register(app);
run.register(app);
feed.register(app);
llm.register(app);
brief.register(app);
app.mount('#app');
