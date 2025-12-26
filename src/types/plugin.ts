import type { AnyObject, StoreOptions } from "pinia-plugin-subscription"


interface ActionFlow {
    after?: Function | string
    before?: Function | string
}

export type ActionFlows = Record<string, ActionFlow>

export interface ActionsStoreFlowOptions extends StoreOptions {
    flows?: ActionFlows
}

export interface PluginStoreOptions extends AnyObject { storeOptions: ActionsStoreFlowOptions }