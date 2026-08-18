import type { AnyObject, StoreOptions } from "pinia-plugin-subscription"

export type ActionFlowDefaultParameters = boolean | object | null | number | string | undefined
type ActionFlowAfterFunction = (
    args: ActionFlowDefaultParameters[]
        | {
            args: ActionFlowDefaultParameters[],
            result: ActionFlowDefaultParameters | ActionFlowDefaultParameters[]
        }
) => void
type ActionFlowBeforeFunction = (args: ActionFlowDefaultParameters[]) => void

interface ActionFlow {
    after?: ActionFlowAfterFunction | string
    before?: ActionFlowBeforeFunction | string
}

export type ActionFlows = Record<string, ActionFlow>

export interface ActionFlowStoreOptions extends StoreOptions {
    flows?: ActionFlows
}

export interface PluginStoreOptions extends AnyObject { storeOptions: ActionFlowStoreOptions }