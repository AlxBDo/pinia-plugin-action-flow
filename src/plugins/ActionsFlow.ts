import ActionsStoreFlow from "../core/ActionsStoreFlow";
import { PluginSubscriber } from "pinia-plugin-subscription";
import { PluginConsole } from "../utils/pluginConsole";
import type { PluginStoreOptions } from "../types/plugin";
import { pluginName } from "../utils/constants";


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