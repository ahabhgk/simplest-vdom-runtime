let currentHooksComponent = null
let currentIndex = 0

const rerenderQueue = []
const resolvedPromise = Promise.resolve()
function enqueueRender(update) {
  rerenderQueue.push(update)
  resolvedPromise.then(() => {
    const deduped = [...new Set(rerenderQueue)] // 去重，去掉没必要的更新
    rerenderQueue.length = 0
    deduped.forEach(job => job())
  })
}

const hooksComponent = {
  patch(internals, { n1, n2, container }) {
    if (n1 == null) {
      const instance = n2.instance = {
        subTree: null,
        hooks: {
          list: [],
          pendingEffects: [],
        },
        vnode: n2,
        update: () => {
          currentHooksComponent = instance
          currentIndex = 0
          // this: extends hooksComponent
          const renderResult = this.render(instance.vnode.props)
          currentHooksComponent = null

          instance.vnode.children = [renderResult]
          renderResult.parent = instance.vnode
          internals.patch(instance.subTree, renderResult, container)
          instance.subTree = renderResult

          invokePendingEffects(instance)
        },
      }
    } else {
      const instance = n2.instance = n1.instance
      instance.vnode = n2
    }
    enqueueRender(n2.instance.update)
  },

  unmount(internals, { vnode, doRemove }) {
    vnode.children.forEach(c => unmount(c, doRemove))
  },

  getNode(internals, { vnode }) {
    return vnode.instance.subTree.node
  }
}

export const createHooksComponent = (render) => ({ ...hooksComponent, render })

function getHookState(index) {
  const { hooks } = currentHooksComponent
  if (index >= hooks.list.length) {
    hooks.list.push({});
  }
  return hooks.list[index];
}

/**
 * type Dispatcher = <A>(action: A) => void
 * interface ReducerHookState<State, Action> {
 *   component: Component,
 *   value: [State, Dispatcher<Action>]
 * }
 */
export function useReducer(reducer, initialState, init) {
  const hookState = getHookState(currentIndex++);
  if (!hookState.component) {
    hookState.component = currentHooksComponent;
    hookState.value = [
      init ? init(initialState) : initialState,
      (action) => {
        const nextState = reducer(hookState.value[0], action);
        if (hookState.value[0] !== nextState) {
          hookState.value = [nextState, hookState.value[1]];
          hookState.component.update();
        }
      },
    ];
  }
  return hookState.value;
}

export function useState(initialState) {
  return useReducer(
    (arg, f) => (typeof f === 'function' ? f(arg) : f),
    typeof initialState === 'function' ? initialState() : initialState,
  );
}

/**
 * type Cleanup = () => void
 * interface EffectHookState {
 *   effect: () => (void | Cleanup),
 *   args: any[],
 * }
 */
export function useEffect(effect, args) {
  const hookState = getHookState(currentIndex++);
  if (argsChanged(hookState.args, args)) {
    hookState.effect = effect;
    hookState.args = args;
    currentHooksComponent.hooks.pendingEffects.push(hookState);
  }
}

const afterPaint = requestAnimationFrame;
function invokePendingEffects(instance) {
  const { hooks } = instance
  afterPaint(() => {
    hooks.pendingEffects.forEach(invokeCleanup);
    hooks.pendingEffects.forEach(invokeEffect);
    hooks.pendingEffects = [];
  });
}

function invokeCleanup(effectState) {
  if (typeof effectState.cleanup === 'function') effectState.cleanup();
}

function invokeEffect(effectState) {
  effectState.cleanup = effectState.effect();
}

function argsChanged(oldArgs, newArgs) {
  return !oldArgs || newArgs.some((arg, index) => arg !== oldArgs[index]);
}

/**
 * interface MemoHookState {
 *   value: any,
 *   args: any[],
 * }
 */
export function useMemo(factory, args) {
  const hookState = getHookState(currentIndex++);
  if (argsChanged(hookState.args, args)) {
    hookState.args = args;
    hookState.value = factory();
  }
  return hookState.value;
}

export function useCallback(callback, args) {
  return useMemo(() => callback, args);
}

export function useRef(initialValue) {
  return useMemo(() => ({ current: initialValue }), []);
}
