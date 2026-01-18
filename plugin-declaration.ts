import { PluginSubscriberInterface } from "pinia-plugin-subscription"
import { PluginStoreOptions } from "./plugin"

declare module 'pinia-plugin-action-flow' {
    export const ActionsFlows: PluginSubscriberInterface
    export const PLUGIN_NAME: string;
}

declare module 'pinia' {
    export interface DefineStoreOptionsBase<S, Store> extends PluginStoreOptions { }
}
