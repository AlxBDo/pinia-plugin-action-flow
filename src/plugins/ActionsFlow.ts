import ActionsStoreFlow from "../core/ActionsStoreFlow";
import { PluginSubscriber } from "pinia-plugin-subscription";
import { PluginConsole } from "../utils/pluginConsole";
import type { ActionsStoreFlowOptions, PluginStoreOptions } from "../types/plugin";
import { pluginName } from "../utils/constantes";


class ActionsFlow extends PluginSubscriber<ActionsStoreFlow> {
    constructor() {
        super(
            pluginName,
            ActionsStoreFlow.customizeStore.bind(ActionsStoreFlow),
            PluginConsole
        )
    }
}

export default new ActionsFlow();

declare module 'pinia' {
    export interface DefineStoreOptionsBase<S, Store> extends PluginStoreOptions { }
}