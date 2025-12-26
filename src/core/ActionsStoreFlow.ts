import type { Store } from "pinia";
import type { AnyObject, CustomConsole } from "pinia-plugin-subscription";
import { isEmpty, Store as StoreClass } from 'pinia-plugin-subscription';
import type { ActionFlows, PluginStoreOptions } from "../types/plugin";

export default class ActionsStoreFlow extends StoreClass {
    protected override _className: string = 'StoreExtension'
    private _flowsOnAction: Map<string, boolean> = new Map<string, boolean>()
    protected static override _requiredKeys: string[] = ['flows']

    get flows(): ActionFlows | undefined {
        return this.options.flows as ActionFlows
    }

    constructor(
        store: Store,
        options: PluginStoreOptions & AnyObject,
        debug: boolean = false,
        customConsole?: CustomConsole
    ) {
        super(store, options, debug, customConsole)

        this.debugLog(`constructor - store "${this.store.$id}"`, [
            'options:', options,
            'store:', store
        ])

        this.onAction = this.onActionCallback.bind(this)
    }


    private addFlowOnAction(name: string, args: any[] | object): void {
        const actionName = this.getOnActionFlowName(name, args)
        this._flowsOnAction.set(actionName, true)
        setTimeout(() => { this._flowsOnAction.set(actionName, false) }, 250)
    }

    private getOnActionFlowName(name: string, args: any[] | object): string {
        return name + JSON.stringify(args)
    }

    private invokeFlow(args: any[] | object, name: string, flow?: Function | string, result?: any): boolean {
        if (!flow) { return false }

        this.debugLog(`Invoking flow for action "${name}"`, [
            'args:', args,
            'result:', result,
            'flow:', flow
        ])

        if (!isEmpty(result)) {
            args = { args, result }
        }

        if (typeof flow === 'function') {
            flow(args)
        } else if (typeof flow === 'string' && typeof this.store[flow] === 'function') {
            this.store[flow](args)
        }

        this.addFlowOnAction(name, args)

        return true
    }

    onActionCallback({ after, args, name }): void {
        if (!(this.flows as AnyObject)[name] || this._flowsOnAction.get(this.getOnActionFlowName(name, args))) { return }

        const { after: afterAction, before } = (this.flows as AnyObject)[name]
        this.invokeFlow(args, name, before)
        after((result: any) => this.invokeFlow(args, name, afterAction, result))
    }
}