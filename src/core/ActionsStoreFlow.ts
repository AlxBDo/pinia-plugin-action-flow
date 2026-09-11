import type { Store } from "pinia";
import type { AnyObject, CustomConsole, StoreOnActionCallbackParameters } from "pinia-plugin-subscription";
import { isEmpty, Store as StoreClass } from 'pinia-plugin-subscription';
import type { ActionFlows, ActionFlowStoreOptions } from "../types/plugin";

export default class ActionsStoreFlow extends StoreClass {
    protected override _className: string = 'ActionsStoreFlow'
    private _flowsOnAction: Map<string, number> = new Map<string, number>()
    protected static override _requiredKeys: string[] = ['flows']

    get flows(): ActionFlows | undefined {
        return this.options.flows as ActionFlows
    }

    constructor(
        store: Store,
        options: ActionFlowStoreOptions & AnyObject,
        debug: boolean = false,
        customConsole?: CustomConsole
    ) {
        super(store, options, debug, customConsole)

        this.debugLog(`constructor - store "${this.store.$id}"`, { options, store })

        this.onAction = this.onActionCallback.bind(this)
    }


    private addFlowOnAction(name: string, promiseFlow: Promise<any>, timing: string): void {
        const actionName = this.getOnActionFlowName(name, timing)
        this._flowsOnAction.set(actionName, (this._flowsOnAction.get(actionName) ?? 0) + 1)
        promiseFlow.finally(() => {
            this._flowsOnAction.delete(actionName)
        })
    }

    private getOnActionFlowName(name: string, timing: string): string {
        return this.store.$id + name + timing
    }

    private invokeFlow(args: any[] | object, name: string, flow?: Function | string, result?: any): boolean {
        if (!flow) { return false }
        let timing = 'before'

        this.debugLog(`Invoking flow for action "${name}"`, { args, flow, result })

        if (typeof result !== 'undefined') {
            args = { args, result }
            timing = 'after'
        }

        if (typeof flow === 'string' && typeof this.store[flow] === 'function') {
            flow = this.store[flow]
        }

        const promiseFlow = new Promise((resolve) => {
            resolve((flow as Function)(args))
        })

        this.addFlowOnAction(name, promiseFlow, timing)

        return true
    }

    onActionCallback({ after, args, name }: StoreOnActionCallbackParameters): void {
        if (this.hasDeniedFirstChar(name)) { return }
        if (!(this.flows as AnyObject)[name]) { return }

        const { after: afterAction, before } = (this.flows as AnyObject)[name]
        if (!this._flowsOnAction.get(this.getOnActionFlowName(name, 'before'))) {
            this.invokeFlow(args, name, before)
        }
        if (!this._flowsOnAction.get(this.getOnActionFlowName(name, 'after'))) {
            after((result: any) => this.invokeFlow(args, name, afterAction, result ?? false))
        }
    }
}