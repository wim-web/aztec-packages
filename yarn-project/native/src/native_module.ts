import bindings from 'bindings';

import { type MessageReceiver } from './msgpack_channel.js';

interface NativeClassCtor {
  new (...args: unknown[]): MessageReceiver;
}

let nativeModule: Record<string, NativeClassCtor> = {};

if ((process as any).isBun) {
  let mod = { exports: {} };
  (process as any).dlopen(mod, new URL(import.meta.resolve('../build/nodejs_module.node')).pathname);
  nativeModule = mod.exports;
} else {
  nativeModule = bindings('nodejs_module');
}

export const NativeWorldState: NativeClassCtor = nativeModule.WorldState;
export const NativeLMDBStore: NativeClassCtor = nativeModule.LMDBStore;
