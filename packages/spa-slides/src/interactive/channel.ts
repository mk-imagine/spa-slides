export interface DeckChannel {
  send(message: object): void;
  close(): void;
}

/**
 * A message channel between every window showing one deck: the audience window and the speaker
 * view's two preview frames, each running its own copy of it.
 *
 * Messages go out on a BroadcastChannel and as a storage event, because neither reaches everywhere
 * (docs/interactivity-spike-4.md): from disk in WebKit only the storage event crosses, and only from
 * the speaker view to the audience window. Most messages therefore arrive twice, so what is sent
 * should be safe to apply twice. `name` scopes them to one deck and one purpose, since every deck
 * opened from disk shares one storage area.
 */
export function openChannel(name: string, receive: (message: unknown) => void): DeckChannel {
  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(name);
    channel.onmessage = (event: MessageEvent) => receive(event.data);
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === name && event.newValue !== null) receive(JSON.parse(event.newValue));
  };
  window.addEventListener('storage', onStorage);
  return {
    send(message) {
      channel?.postMessage(message);
      // The nonce makes every write a change, since an unchanged value raises no storage event.
      const value = JSON.stringify({ ...message, nonce: Math.random() });
      try {
        localStorage.setItem(name, value);
      } catch {
        // Storage can be disabled outright (a locked-down browser profile). The BroadcastChannel
        // still carries the message wherever it reaches, so this only narrows where it is shared.
      }
    },
    close() {
      channel?.close();
      channel = null;
      window.removeEventListener('storage', onStorage);
    },
  };
}
