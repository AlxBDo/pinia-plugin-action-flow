import ActionsStoreFlow from "../core/ActionsStoreFlow";
import { PluginSubscriber } from "pinia-plugin-subscription/helpers";
import { pluginName } from "../utils/constants";
import type { ActionFlows } from "../types/plugin";


class ActionsFlow extends PluginSubscriber<ActionsStoreFlow> {
    constructor() {
        super(
            pluginName,
            ActionsStoreFlow.customizeStore.bind(ActionsStoreFlow)
        )
    }
}

export default new ActionsFlow();

declare module 'pinia-plugin-subscription/types' {
    interface StoreOptionsExtensions {
        flows?: ActionFlows
    }
}