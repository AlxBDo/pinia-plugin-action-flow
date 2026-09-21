# Pinia Plugin Action Flow

A powerful Pinia plugin that enables you to define custom callbacks (flows) that execute before and after store actions. This plugin allows you to add cross-cutting concerns like logging, validation, and side effects to your Pinia actions in a clean and declarative way.

## Features

- **Before Hooks**: Execute logic before an action runs
- **After Hooks**: Execute logic after an action completes
- **Flexible Configuration**: Define flows using functions or method names
- **Type-Safe**: Full TypeScript support with proper type definitions
- **Non-Intrusive**: Works seamlessly with existing Pinia stores
- **Debug Support**: Optional debug logging for development

## Installation

```bash
npm install pinia-plugin-action-flow
# or
yarn add pinia-plugin-action-flow
```

## Setup

1. Import the plugin and create your Pinia app:

```typescript
import { createPinia } from 'pinia'
import { ActionsFlows } from 'pinia-plugin-action-flow'
import { createPlugin } from 'pinia-plugin-subscription'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

pinia.use(
  createPlugin([ActionsFlows])
)

app.use(pinia)
```

2. Configure your store with action flows using the `storeOptions` property:

```typescript
import { defineStore } from "pinia"

export const useMyStore = defineStore('myStore', () => {
  // store implementation
}, {
  storeOptions: {
    flows: {
      // define your action flows here
    }
  }
})
```

## Usage

### Basic Example

Define before and after hooks for your actions:

```typescript
import { defineStore } from "pinia"
import { ref } from "vue"

const storeOptions = {
  flows: {
    setMyState: {
      before: 'beforeSetMyState',      // Reference to a store method
      after: afterSetMyStateCallback    // Or use a direct function
      onError: customErrorFunction
    }
  }
}

export const useOnActionStore = defineStore('onActionStore', () => {
  const myState = ref<string>()

  function setMyState(value: string) {
    myState.value = value
  }

  function beforeSetMyState(args: string[]) {
    console.log('Before setting myState with args:', args)
    // Modify arguments before the action executes
    args[0] = args[0].toUpperCase()
  }

  return { myState, setMyState, beforeSetMyState }
}, {
  storeOptions
})

function afterSetMyStateCallback(
  value: ActionFlowDefaultParameters[] 
    | { args: ActionFlowDefaultParameters[], result: ActionFlowDefaultParameters | ActionFlowDefaultParameters[] }
) {
  console.log('After setting myState to:', value)
}

function customErrorFunction(error: unknown) {
  //...
}
```

### Using the Store

```typescript
import { useOnActionStore } from '@/stores/onAction'

const store = useOnActionStore()

// When you call the action, the flows are automatically triggered
store.setMyState('hello')
// Logs:
// > "Before setting myState with args: ['hello']"
// > Value is now: "HELLO"
// > "After setting myState to: ['HELLO']"

console.log(store.myState) // "HELLO"
```

## Configuration

### Action Flow Types

```typescript
interface ActionFlow {
  before?: Function | string   // Callback before action execution
  after?: Function | string    // Callback after action execution
}

type ActionFlows = Record<string, ActionFlow>
```

### Before Hooks

The `before` hook receives the action arguments and can modify them before the action executes:

```typescript
{
  flows: {
    myAction: {
      before: (args: any[]) => {
        // args is the array of arguments passed to the action
        console.log('Action will be called with:', args)
        // You can modify arguments
        args[0] = args[0].toUpperCase()
      }
    }
  }
}
```

**Using a Store Method:**

```typescript
{
  flows: {
    myAction: {
      before: 'beforeMyAction'  // Must be a method in your store
    }
  }
}

// In your store:
function beforeMyAction(args: string[]) {
  console.log('Before my action:', args)
}
```

### After Hooks

The `after` hook receives an object containing both the original arguments and the action result:

```typescript
{
  flows: {
    myAction: {
      after: (payload: { args: any[], result: any }) => {
        console.log('Action arguments:', payload.args)
        console.log('Action result:', payload.result)
      }
    }
  }
}
```

If the action doesn't return a result, the `args` will be passed directly without the wrapper object.

## Advanced Example

Here's a more comprehensive example with multiple flows:

```typescript
import { defineStore } from "pinia"
import { ref } from "vue"

interface User {
  id: number
  name: string
}

export const useUserStore = defineStore('userStore', () => {
  const users = ref<User[]>([])
  const loading = ref(false)
  const errors = ref<string[]>([])

  // Actions
  function addUser(name: string) {
    const newUser: User = {
      id: users.value.length + 1,
      name
    }
    users.value.push(newUser)
    return newUser
  }

  function deleteUser(id: number) {
    users.value = users.value.filter(u => u.id !== id)
  }

  // Before/After hooks
  function beforeAddUser(args: ActionFlowDefaultParameters[]) {
    console.log('Adding user:', args[0])
    if (!args[0] || args[0].trim() === '') {
      console.warn('User name cannot be empty')
      args[0] = 'Unknown User'
    }
  }

  function afterAddUser(
    payload: ActionFlowDefaultParameters[]
      | {
          args: ActionFlowDefaultParameters[],
          result: ActionFlowDefaultParameters | ActionFlowDefaultParameters[]
  }) {
    console.log('User added:', payload.result)
    // Trigger analytics, notifications, etc.
  }

  function beforeDeleteUser(args: number[]) {
    loading.value = true
    console.log('Deleting user with id:', args[0])
  }

  function afterDeleteUser() {
    loading.value = false
    console.log('User deleted')
  }

  return {
    users,
    loading,
    errors,
    addUser,
    deleteUser,
    beforeAddUser,
    afterAddUser,
    beforeDeleteUser,
    afterDeleteUser
  }
}, {
  storeOptions: {
    flows: {
      addUser: {
        before: 'beforeAddUser',
        after: 'afterAddUser'
      },
      deleteUser: {
        before: 'beforeDeleteUser',
        after: 'afterDeleteUser'
      }
    }
  }
})
```

## API Reference

### Plugin Exports

```typescript
import { ActionsFlows, PLUGIN_NAME } from 'pinia-plugin-action-flow'

// ActionsFlows: The plugin instance to use with pinia.use()
// PLUGIN_NAME: The plugin identifier string ('pinia-plugin-action-flow')
```

### Store Options

Extend your `defineStore` options with:

```typescript
interface PluginStoreOptions {
  storeOptions: {
    flows?: ActionFlows
  }
}
```

## Use Cases

- **Validation**: Validate action arguments before execution
- **Logging**: Log all action calls and results for debugging
- **Analytics**: Track user interactions and store mutations
- **Side Effects**: Trigger API calls, notifications, or other operations
- **Caching**: Implement caching logic around actions
- **Access Control**: Check permissions before allowing actions to execute
- **Transformation**: Transform data before or after action execution

## Performance Considerations

- Flows are debounced with a 250ms timeout to prevent duplicate execution
- Each action flow is tracked to avoid re-triggering during nested calls
- Use the plugin judiciously for performance-critical applications

## Debugging

Enable debug logging by passing debug configuration when initializing your store:

```typescript
// The plugin includes built-in debug support through pinia-plugin-subscription
// Check the Pinia DevTools for flow execution details
```

## TypeScript Support

The plugin is fully typed with TypeScript. Action flows support both function references and string method names with proper type inference:

```typescript
// Type-safe flow definition
const storeOptions = {
  flows: {
    myAction: {
      before: (args: any[]) => void,      // Function callback
      after: 'myAfterMethod'               // Method name (string)
    }
  }
} as const
```

## License

See [LICENSE](./LICENSE) file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
