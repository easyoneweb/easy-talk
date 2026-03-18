import { AppState, type AppStateStatus } from 'react-native';
import { pollNewMessages } from '@/api/messages';
import type { Message } from '@/types/api';
import { POLLING } from '@/config/constants';

type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';
type MessageCallback = (messages: Message[]) => void;

export class LongPollingManager {
  private token: string;
  private lastKnownMessageId: number;
  private abortController: AbortController | null = null;
  private isRunning = false;
  private onMessages: MessageCallback;
  private onStateChange?: (state: ConnectionState) => void;
  private appStateSubscription: ReturnType<
    typeof AppState.addEventListener
  > | null = null;

  constructor(
    token: string,
    lastKnownMessageId: number,
    onMessages: MessageCallback,
    onStateChange?: (state: ConnectionState) => void,
  ) {
    this.token = token;
    this.lastKnownMessageId = lastKnownMessageId;
    this.onMessages = onMessages;
    this.onStateChange = onStateChange;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange,
    );

    this.poll();
  }

  stop(): void {
    this.isRunning = false;
    this.abortController?.abort();
    this.abortController = null;
    this.appStateSubscription?.remove();
    this.appStateSubscription = null;
    this.onStateChange?.('disconnected');
  }

  updateLastKnownMessageId(id: number): void {
    this.lastKnownMessageId = id;
  }

  private handleAppStateChange = (state: AppStateStatus): void => {
    if (state === 'active' && this.isRunning) {
      this.abortController?.abort();
      this.poll();
    } else if (state === 'background' || state === 'inactive') {
      this.abortController?.abort();
    }
  };

  private async poll(): Promise<void> {
    while (this.isRunning) {
      this.abortController = new AbortController();

      try {
        this.onStateChange?.('connected');

        const messages = await pollNewMessages(
          this.token,
          this.lastKnownMessageId,
          this.abortController.signal,
        );

        if (!this.isRunning) break;

        if (messages.length > 0) {
          const maxId = Math.max(...messages.map((m) => m.id));
          this.lastKnownMessageId = maxId;
          this.onMessages(messages);
        }
      } catch (error: unknown) {
        if (!this.isRunning) break;

        if (error instanceof Error && error.name === 'AbortError') {
          continue;
        }

        const axiosError = error as { response?: { status: number } };
        if (axiosError.response?.status === 304) {
          continue;
        }

        this.onStateChange?.('reconnecting');
        await this.delay(POLLING.RECONNECT_DELAY_MS);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
