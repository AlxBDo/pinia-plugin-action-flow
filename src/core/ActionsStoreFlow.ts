import type { Store } from "pinia";
import type { StoreClassConstructorParams, StoreOnActionCallbackParameters } from "pinia-plugin-subscription/types";
import { Store as StoreClass, traceGroups } from 'pinia-plugin-subscription/helpers';
import type { ActionFlows } from "../types/plugin";

export default class ActionsStoreFlow extends StoreClass {
    protected override _className: string = 'ActionsStoreFlow'
    private _flowsOnAction: Map<string, number> = new Map<string, number>()
    protected static override _requiredKeys: string[] = ['flows']

    get flows(): ActionFlows | undefined {
        return this.options.flows as ActionFlows
    }

    constructor(
        store: Store,
        options: StoreClassConstructorParams
    ) {
        super(store, options)

        this.trace('ActionsFlow:Initialize', this.store.$id, () => ({
            flowNames: Object.keys(this.flows ?? {})
        }))

        this.onAction = this.onActionCallback.bind(this)
    }


    private addFlowOnAction(name: string, promiseFlow: Promise<any>, timing: string): Promise<any> {
        const actionName = this.getOnActionFlowName(name, timing)
        this._flowsOnAction.set(actionName, (this._flowsOnAction.get(actionName) ?? 0) + 1)
        return promiseFlow.finally(() => {
            this._flowsOnAction.delete(actionName)
        })
    }

    private getOnActionFlowName(name: string, timing: string): string {
        return this.store.$id + name + timing
    }

    private invokeFlow(args: any[] | object, name: string, flow?: Function | string, result?: any): Promise<any> | undefined {
        if (!flow) { return }
        let timing = 'before'

        if (typeof result !== 'undefined') {
            args = { args, result }
            timing = 'after'
        }

        this.trace(`ActionsFlow:Invoke:${timing}`, this.store.$id, () => ({
            groupId: timing === 'after' ? traceGroups.onActionAfter(this.store.$id) : this.store.$id
        }))

        if (typeof flow === 'string' && typeof this.store[flow] === 'function') {
            flow = this.store[flow]
        }

        const promiseFlow = new Promise((resolve) => {
            resolve((flow as Function)(args))
        })

        return this.addFlowOnAction(name, promiseFlow, timing)
    }

    onActionCallback({ after, args, name, onError }: StoreOnActionCallbackParameters): Promise<any> | void {
        if (this.hasDeniedFirstChar(name)) { return }
        const actionFlow = this.flows?.[name]
        if (!actionFlow) { return }

        const { after: afterAction, before, onError: onErrorAction } = actionFlow

        const beforeFlow = !this._flowsOnAction.get(this.getOnActionFlowName(name, 'before'))
            ? this.invokeFlow(args, name, before)
            : undefined
        if (afterAction && !this._flowsOnAction.get(this.getOnActionFlowName(name, 'after'))) {
            after((result: any) => this.invokeFlow(args, name, afterAction, result ?? false))
        }
        if (onErrorAction && typeof onError === 'function') {
            onError((error: unknown) => {
                if (typeof onErrorAction === 'string' && typeof this.store[onErrorAction] === 'function') {
                    return this.store[onErrorAction](error)
                } else if (typeof onErrorAction === 'function') {
                    return onErrorAction(error)
                }
            })
        }
        return beforeFlow
    }
}