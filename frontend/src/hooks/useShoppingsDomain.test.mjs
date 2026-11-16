import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Exercise the hook's actual callbacks with deterministic renders and requests.
const source = readFileSync(new URL('./useShoppingsDomain.js', import.meta.url), 'utf8')
  .replace(/^import .*;\n/gm, '').replaceAll('export ', '') + '\nglobalThis.domainHook = useShoppingsDomain;';
const seed = [
  { id: 1, status: 'ACTIVE', start_time: '2026-11-16T12:00:00Z' },
  { id: 2, status: 'PAUSED', start_time: '2026-11-16T11:00:00Z' },
  { id: 3, status: 'ACTIVE', start_time: '2026-11-16T10:00:00Z' },
];

function setup() {
  const slots = [];
  let cursor = 0;
  const activeMissionIdRef = { current: 1 };
  const V = {
    useState(initial) {
      const i = cursor++;
      slots[i] ||= { value: initial };
      return [slots[i].value, (next) => { slots[i].value = typeof next === 'function' ? next(slots[i].value) : next; }];
    },
    useRef(initial) { const i = cursor++; slots[i] ||= { current: initial }; return slots[i]; },
    useCallback(fn, deps) {
      const i = cursor++;
      if (!slots[i] || deps.some((value, index) => !Object.is(value, slots[i].deps[index]))) slots[i] = { fn, deps };
      return slots[i].fn;
    },
  };
  const context = vm.createContext({ V, toFormUserId: String });
  vm.runInContext(source, context);
  const render = () => { cursor = 0; return context.domainHook({ activeMissionIdRef }); };
  const initial = render();
  initial.setShoppings(seed);
  initial.setActiveShopping(seed[0]);
  return { render, activeMissionIdRef };
}

test('clicking tab 2 or 3 updates the live selection before an effect can run', () => {
  const { render, activeMissionIdRef } = setup();
  let domain = render();
  domain.selectShoppingTab(2);
  assert.equal(activeMissionIdRef.current, 2);
  domain = render();
  assert.equal(domain.activeShopping.id, 2);
  domain.selectShoppingTab(3);
  assert.equal(activeMissionIdRef.current, 3);
  assert.equal(render().activeShopping.id, 3);
});

test('a delayed refresh started on tab 1 keeps the latest clicked tab and loads its fresh data', async () => {
  const { render } = setup();
  const oldRender = render();
  let finish;
  const response = new Promise((resolve) => { finish = resolve; });
  const inFlight = (async () => {
    const list = await response;
    oldRender.setShoppings(list);
    oldRender.setActiveShopping(oldRender.resolveSelectedShopping(list));
  })();
  oldRender.selectShoppingTab(2);
  render().selectShoppingTab(3);
  const updated = seed.map((item) => ({ ...item, client_count: 7 }));
  finish(updated);
  await inFlight;
  assert.equal(render().activeShopping.id, 3);
  assert.equal(render().activeShopping.client_count, 7);
});

test('repeated refreshes and reordered lists preserve a paused selected shopping', () => {
  const { render } = setup();
  const firstRender = render();
  firstRender.selectShoppingTab(2);
  for (let i = 0; i < 5; i++) {
    const updated = [...seed].reverse().map((item) => ({ ...item, name: `Updated ${i}` }));
    firstRender.setShoppings(updated);
    firstRender.setActiveShopping(firstRender.resolveSelectedShopping(updated));
    assert.equal(render().activeShopping.id, 2);
    assert.equal(render().activeShopping.name, `Updated ${i}`);
  }
});

test('an explicit tab click takes priority over the previous live selection', () => {
  const { render } = setup();
  render().selectShoppingTab(3);
  const domain = render();
  assert.equal(domain.resolveSelectedShopping(seed, 2).id, 2);
});

test('falls back only when the selected shopping has closed or disappeared', () => {
  const { render } = setup();
  render().selectShoppingTab(3);
  const domain = render();
  assert.equal(domain.resolveSelectedShopping(seed.map((item) => item.id === 3 ? { ...item, status: 'COMPLETED' } : item)).id, 1);
  assert.equal(domain.resolveSelectedShopping(seed.filter((item) => item.id !== 3)).id, 1);
  assert.equal(domain.resolveSelectedShopping([]), null);
});
