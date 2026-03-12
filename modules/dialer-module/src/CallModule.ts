import { NativeModule, requireNativeModule } from 'expo';

declare class CallModule extends NativeModule {
  requestCallLogPermission(): Promise<boolean>;
  getCallLogs(limit: number, offset: number): Promise<{ logs: any[]; hasMore: boolean }>;
  deleteCallLog(id: string): Promise<boolean>;
  makeCall(phoneNumber: string): Promise<boolean>;
  requestDefaultDialer(): Promise<boolean>;
  isDefaultDialer(): Promise<boolean>;
  answerCall(): void;
  rejectCall(): void;
  disconnectCall(): void;
  toggleMute(muted: boolean): void;
  toggleSpeaker(speaker: boolean): void;
  toggleHold(hold: boolean): void;
  sendDtmf(digit: string): void;
  playDtmfTone(digit: string): void;
  mergeCalls(): void;
  silenceRingtone(): void;
  handlePowerButton(): void;
  getActiveCall(): { number: string; state: number; isMuted: boolean; audioRoute: number; callCount: number } | null;
  moveTaskToBack(): void;
  openAppSettings(): void;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<CallModule>('CallModule');
