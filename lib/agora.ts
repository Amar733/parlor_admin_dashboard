import type { IAgoraRTC } from 'agora-rtc-sdk-ng';

let agoraInstance: IAgoraRTC | null = null;

export const getAgoraRTC = async (): Promise<IAgoraRTC> => {
  if (typeof window === 'undefined') {
    throw new Error('Agora SDK can only be loaded in the browser');
  }

  if (agoraInstance) {
    return agoraInstance;
  }

  const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
  agoraInstance = AgoraRTC;
  return AgoraRTC;
};
