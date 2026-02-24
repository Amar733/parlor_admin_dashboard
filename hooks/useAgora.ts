import { useState  } from 'react';
import { getAgoraRTC } from '@/lib/agora';
import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  UID
} from 'agora-rtc-sdk-ng';


export const useAgora = (client: IAgoraRTCClient | undefined) => {
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | undefined>(undefined);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | undefined>(undefined);

  const [joinState, setJoinState] = useState(false);

  const [remoteUsers, setRemoteUsers] = useState<IAgoraUser[]>([]);

  async function createLocalTracks() {
    const AgoraRTC = await getAgoraRTC();
    const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
    // Start with video disabled as per requirement
    await cameraTrack.setEnabled(false);
    setLocalAudioTrack(microphoneTrack);
    setLocalVideoTrack(cameraTrack);
    return [microphoneTrack, cameraTrack];
  }

  async function join(appid: string, channel: string, token: string, uid?: string | number) {
    if (!client) return;

    if (client.connectionState === 'CONNECTED' || client.connectionState === 'CONNECTING') {
        console.log("Agora client is already connected/connecting");
        return;
    }

    try {
      // Add event listeners
      client.on("user-published", handleUserPublished);
      client.on("user-unpublished", handleUserUnpublished);

      await client.join(appid, channel, token, uid || null);
      
      // Create and publish tracks
      const [microphoneTrack, cameraTrack] = await createLocalTracks();
      await client.publish([microphoneTrack]);

      setJoinState(true);
    } catch (error) {
      console.error("Error joining Agora channel:", error);
      throw error;
    }
  }

  async function leave() {
    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
    }
    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
    }
    
    setRemoteUsers([]);
    setJoinState(false);
    
    if (client) {
      client.removeAllListeners();
      try {
        await client.leave();
      } catch (err) {
        // Ignore errors if already left
        console.warn("Agora leave check:", err);
      }
    }
  }

  // --- Remote User Handling ---

  const handleUserPublished = async (user: any, mediaType: "audio" | "video") => {
    await client?.subscribe(user, mediaType);

    setRemoteUsers((prev) => {
      // Check if user already exists in list
      const existingUser = prev.find(u => u.uid === user.uid);
      
      if (existingUser) {
        // Update existing user tracks
        return prev.map(u => 
          u.uid === user.uid ? { ...u, [mediaType === 'video' ? 'videoTrack' : 'audioTrack']: user[mediaType === 'video' ? 'videoTrack' : 'audioTrack'] } : u
        );
      } else {
        // Add new user
        return [...prev, {
            uid: user.uid,
            videoTrack: user.videoTrack,
            audioTrack: user.audioTrack,
            hasAudio: user.hasAudio,
            hasVideo: user.hasVideo
        }];
      }
    });

     // Manually play audio for remote users upon subscription
     if (mediaType === 'audio') {
        user.audioTrack?.play();
     }
  };

  const handleUserUnpublished = (user: any, mediaType: "audio" | "video") => {
     // Optional: You could update state to set track to undefined without removing user completely
     // For this simple case, we might rely on the video player component handling undefined tracks
  };

  return {
    localAudioTrack,
    localVideoTrack,
    joinState,
    leave,
    join,
    remoteUsers
  };
};

export interface IAgoraUser {
    uid: UID;
    videoTrack?: IRemoteVideoTrack;
    audioTrack?: IRemoteAudioTrack;
    hasAudio: boolean;
    hasVideo: boolean;
}
