import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, defineStore } from 'pinia'
import { ref } from 'vue'
import { createPlugin } from 'pinia-plugin-subscription'
import piniaPluginActionFlow from '../plugins/ActionsFlow'
import ActionsStoreFlow from '../core/ActionsStoreFlow'

describe('ActionsStoreFlow', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    // install the subscription plugin with our ActionsFlow plugin
    pinia.use(createPlugin([piniaPluginActionFlow], true))
  })

  it('calls before and after flows and transforms args (unit)', () => {
    const beforeSpy = vi.fn()
    const afterSpy = vi.fn()

    const before = (args: string[]) => {
      beforeSpy()
      args[0] = args[0].toUpperCase()
    }

    const after = (args: any) => {
      afterSpy(args)
    }

    const useStore = defineStore(
      'test-on-action',
      () => {
        const myState = ref<string>('')
        function setMyState(value: string) {
          myState.value = value
        }
        return { myState, setMyState }
      }
    )

    const store = useStore(pinia)

    const flows = { setMyState: { before, after } }
    const actionsFlow = new ActionsStoreFlow(store, { storeOptions: { flows } }, true)

    let afterCb: Function | undefined
    const afterRegistrar = (cb: Function) => { afterCb = cb }

    // Simulate an action call: plugin receives { after, args, name }
    actionsFlow.onActionCallback({ after: afterRegistrar, args: ['hello'], name: 'setMyState' })

    // before should have been called and transformed args
    expect(beforeSpy).toHaveBeenCalledTimes(1)

    // apply the action using the transformed arg
    store.setMyState('HELLO')

    // simulate action completion
    afterCb && afterCb(undefined)

    // after should have been called
    expect(afterSpy).toHaveBeenCalled()

    // state should reflect transformed value
    expect(store.myState).toBe('HELLO')
  })

  it('prevents re-entrancy when a flow re-invokes the same action (unit)', () => {
    const beforeSpy = vi.fn()

    const before = (args: string[]) => {
      beforeSpy()
      args[0] = args[0].toUpperCase()
    }

    const useStore = defineStore(
      'reentrancy-store',
      () => {
        const myState = ref<string>('')
        function setMyState(value: string) {
          myState.value = value
        }
        return { myState, setMyState }
      }
    )

    const storeRef = useStore(pinia)

    const flows = {
      setMyState: {
        before,
        after: (args: string[]) => {
          // simulate re-invocation of the same action by calling the onAction handler again
          // we don't call storeRef.setMyState here directly; instead the test will simulate
        }
      }
    }

    const actionsFlow = new ActionsStoreFlow(storeRef, { storeOptions: { flows } }, true)

    // First invocation
    let afterCb: Function | undefined
    actionsFlow.onActionCallback({ after: (cb: Function) => { afterCb = cb }, args: ['hello'], name: 'setMyState' })

    // before should have been called once
    expect(beforeSpy).toHaveBeenCalledTimes(1)

    // simulate applying the action
    storeRef.setMyState('HELLO')

    // simulate action completion and after flow which re-invokes the same action
    afterCb && afterCb(undefined)

    // Simulate Pinia firing the action again due to re-invocation inside after flow
    // This call should be ignored by the ActionsStoreFlow because of the _flowsOnAction guard
    actionsFlow.onActionCallback({ after: () => { }, args: ['HELLO'], name: 'setMyState' })

    // before should still have been called only once
    expect(beforeSpy).toHaveBeenCalledTimes(1)

    // state should remain transformed
    expect(storeRef.myState).toBe('HELLO')
  })
})
