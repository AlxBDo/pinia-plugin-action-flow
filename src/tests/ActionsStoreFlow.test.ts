import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, defineStore, type Pinia } from 'pinia'
import { createApp, ref } from 'vue'
import { createPlugin } from 'pinia-plugin-subscription'
import piniaPluginActionFlow from '../plugins/ActionsFlow'

describe('ActionsStoreFlow', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    pinia.use(createPlugin([piniaPluginActionFlow]))
    // Pinia only moves queued plugins into the active list once installed on an app
    createApp({}).use(pinia)
  })

  it('invokes before/after flows through a real Pinia dispatch and transforms args', () => {
    const beforeSpy = vi.fn()
    const afterSpy = vi.fn()

    const before = (args: string[]) => {
      beforeSpy(args)
      args[0] = (args[0] ?? '').toUpperCase()
    }
    const after = (args: any) => afterSpy(args)

    const useStore = defineStore('real-dispatch-store', () => {
      const myState = ref<string>('')
      function setMyState(value: string) {
        myState.value = value
      }
      return { myState, setMyState }
    }, {
      storeOptions: { flows: { setMyState: { before, after } } }
    })

    const store = useStore(pinia)
    store.setMyState('hello')

    // args is mutated in place by the before flow, so by now it holds the transformed value
    expect(beforeSpy).toHaveBeenCalledWith(['HELLO'])
    expect(store.myState).toBe('HELLO')

    // after flow runs asynchronously (invoked from a resolved Promise), wait for microtasks to flush
    return Promise.resolve().then(() => {
      expect(afterSpy).toHaveBeenCalled()
    })
  })

  it('resolves the before/after target from a store method name', () => {
    const afterSpy = vi.fn()

    const useStore = defineStore('method-name-store', () => {
      const myState = ref<string>('')
      function setMyState(value: string) {
        myState.value = value
      }
      function beforeSetMyState(args: string[]) {
        args[0] = (args[0] ?? '').toUpperCase()
      }
      return { myState, setMyState, beforeSetMyState }
    }, {
      storeOptions: { flows: { setMyState: { before: 'beforeSetMyState', after: afterSpy } } }
    })

    const store = useStore(pinia)
    store.setMyState('hello')

    expect(store.myState).toBe('HELLO')
  })

  it('ignores actions/properties whose name starts with "$" or "_" (security guard)', () => {
    const flowSpy = vi.fn()

    const useStore = defineStore('denied-first-char-store', () => {
      const myState = ref<string>('initial')
      return { myState }
    }, {
      // flows keyed on internal-looking names must never be triggered by dispatched actions
      storeOptions: { flows: { $patch: { before: flowSpy }, _internal: { before: flowSpy } } }
    })

    const store = useStore(pinia)
    store.$patch({ myState: 'changed' })

    expect(flowSpy).not.toHaveBeenCalled()
    expect(store.myState).toBe('changed')
  })

  it('prevents re-entrancy while a flow for the same action is still pending', async () => {
    const beforeSpy = vi.fn()
    let releaseAfter: (() => void) | undefined

    const useStore = defineStore('reentrancy-store', () => {
      const myState = ref<string>('')
      function setMyState(value: string) {
        myState.value = value
      }
      return { myState, setMyState }
    }, {
      storeOptions: {
        flows: {
          setMyState: {
            before: (args: string[]) => {
              beforeSpy()
              args[0] = (args[0] ?? '').toUpperCase()
            },
            // keeps the guard "locked" until the test explicitly releases it
            after: () => new Promise<void>((resolve) => { releaseAfter = resolve })
          }
        }
      }
    })

    const store = useStore(pinia)

    store.setMyState('hello')
    expect(beforeSpy).toHaveBeenCalledTimes(1)

    // re-invoking the same action while the "after" flow is still pending must be ignored:
    // the action itself still runs, but its before/after flow is skipped (no uppercase transform)
    store.setMyState('world')
    expect(beforeSpy).toHaveBeenCalledTimes(1)
    expect(store.myState).toBe('world')

    releaseAfter?.()
    // flush the promise chain (resolve(promise) adoption + .finally callback needs a few microtask ticks)
    await new Promise((resolve) => setTimeout(resolve, 0))

    // once the pending flow settles, the guard is released and the action can run again
    store.setMyState('again')
    expect(beforeSpy).toHaveBeenCalledTimes(2)
    expect(store.myState).toBe('AGAIN')
  })

  it('does not crash when args contain a circular reference', () => {
    const beforeSpy = vi.fn()

    const useStore = defineStore('circular-args-store', () => {
      const myState = ref<any>(null)
      function setMyState(value: any) {
        myState.value = value
      }
      return { myState, setMyState }
    }, {
      storeOptions: { flows: { setMyState: { before: beforeSpy } } }
    })

    const store = useStore(pinia)
    const circular: any = {}
    circular.self = circular

    expect(() => store.setMyState(circular)).not.toThrow()
    expect(beforeSpy).toHaveBeenCalled()
  })
})
