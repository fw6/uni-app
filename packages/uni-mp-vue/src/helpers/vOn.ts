import { extend, isArray, isPlainObject, hasOwn, NOOP } from '@vue/shared'
import {
  callWithAsyncErrorHandling,
  ComponentInternalInstance,
  ErrorCodes,
  getCurrentInstance,
} from 'vue'

type EventValue = Function | Function[]

interface Invoker {
  (evt: MPEvent): void
  value: EventValue
}

export function vOn(value: EventValue | undefined) {
  const instance = getCurrentInstance()! as unknown as {
    $ei: number
    ctx: { $scope: Record<string, any> }
  }
  const name = 'e' + instance.$ei++
  const mpInstance = instance.ctx.$scope
  if (!value) {
    // remove
    delete mpInstance[name]
    return name
  }
  const existingInvoker = mpInstance[name] as Invoker
  if (existingInvoker) {
    // patch
    existingInvoker.value = value
  } else {
    // add
    mpInstance[name] = createInvoker(
      value,
      instance as unknown as ComponentInternalInstance
    )
  }
  return name
}

interface MPEvent extends WechatMiniprogram.BaseEvent {
  detail: Record<string, any> & {
    __args__?: unknown[]
  }
  preventDefault: () => void
  stopPropagation: () => void
  stopImmediatePropagation: () => void
}

function createInvoker(
  initialValue: EventValue,
  instance: ComponentInternalInstance | null
) {
  const invoker: Invoker = (e: MPEvent) => {
    patchMPEvent(e)
    let args: unknown[] = [e]
    if ((e as MPEvent).detail && (e as MPEvent).detail.__args__) {
      args = (e as MPEvent).detail.__args__!
    }
    callWithAsyncErrorHandling(
      patchStopImmediatePropagation(e, invoker.value),
      instance,
      ErrorCodes.NATIVE_EVENT_HANDLER,
      args
    )
  }
  invoker.value = initialValue
  return invoker
}

function patchMPEvent(event: MPEvent) {
  if (event.type && event.target) {
    event.preventDefault = NOOP
    event.stopPropagation = NOOP
    event.stopImmediatePropagation = NOOP
    if (!hasOwn(event, 'detail')) {
      event.detail = {}
    }
    if (hasOwn(event, 'markerId')) {
      event.detail = typeof event.detail === 'object' ? event.detail : {}
      event.detail.markerId = (event as any).markerId
    }

    // mp-baidu，checked=>value
    if (
      isPlainObject(event.detail) &&
      hasOwn(event.detail, 'checked') &&
      !hasOwn(event.detail, 'value')
    ) {
      event.detail.value = event.detail.checked
    }

    if (isPlainObject(event.detail)) {
      event.target = extend({}, event.target, event.detail)
    }
  }
}

function patchStopImmediatePropagation(
  e: MPEvent,
  value: EventValue
): EventValue {
  if (isArray(value)) {
    const originalStop = e.stopImmediatePropagation
    e.stopImmediatePropagation = () => {
      originalStop && originalStop.call(e)
      ;(e as any)._stopped = true
    }
    return value.map((fn) => (e: Event) => !(e as any)._stopped && fn(e))
  } else {
    return value
  }
}