import { defineStore } from "pinia";
import { ref } from "vue";
import type { ActionFlowDefaultParameters } from "../../types/plugin"


function afterSetMyState(value: ActionFlowDefaultParameters) {
    console.log('After setting myState to:', value)
}

const storeOptions = {
    flows: { setMyState: { before: 'beforeSetMyState', after: afterSetMyState } }
}

export const useOnActionStore = defineStore('onActionStore', () => {
    const myState = ref<string>()

    function setMyState(value: string) {
        myState.value = value
        return { myState }
    }

    function beforeSetMyState(args: string[]) {
        args[0] = args[0].toUpperCase()
    }

    return { myState, setMyState, beforeSetMyState }
}, {
    storeOptions
})