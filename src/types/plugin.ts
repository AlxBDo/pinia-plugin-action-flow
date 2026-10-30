import type { AnyObject, StoreOptions } from "pinia-plugin-subscription/types"

export type ActionFlowDefaultParameters = boolean | object | null | number | string | undefined
type ActionFlowAfterFunction = (
    args: ActionFlowDefaultParameters[]
        | {
            args: ActionFlowDefaultParameters[],
            result: ActionFlowDefaultParameters | ActionFlowDefaultParameters[]
        }
) => void | Promise<void>
type ActionFlowBeforeFunction = (args: ActionFlowDefaultParameters[]) => void | Promise<void>

interface ActionFlow {
    after?: ActionFlowAfterFunction | string
    before?: ActionFlowBeforeFunction | string
    onError?: ((error: unknown) => void | Promise<void>) | string
}

export type ActionFlows = Record<string, ActionFlow>

export interface ActionFlowStoreOptions extends StoreOptions {
    flows?: ActionFlows
}

export interface PluginStoreOptions extends AnyObject { storeOptions: ActionFlowStoreOptions }