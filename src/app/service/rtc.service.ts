import { Injectable } from '@angular/core';
import AgoraRTC, { IAgoraRTCClient, IBufferSourceAudioTrack, ICameraVideoTrack, ILocalAudioTrack, ILocalVideoTrack, IMicrophoneAudioTrack, UID } from "agora-rtc-sdk-ng"

@Injectable({
  providedIn: 'root'
})
export class RtcService {

  constructor() { }

  private rtc: {
    client: IAgoraRTCClient | null,
    localAudioTrack: IMicrophoneAudioTrack | null,
    localVideoTrack: ICameraVideoTrack | null,
    uid: UID | null
  } = {
      // 用来放置本地客户端。
      client: null,
      // 用来放置本地音视频频轨道对象。
      localAudioTrack: null,
      localVideoTrack: null,
      uid: null
    };
  public Agora = {
    // 替换成你自己项目的 App ID。
    appId: '18e175f4a5704f588c910d176ca51752',
    // 如果你的项目开启了 App 证书进行 Token 鉴权，这里填写生成的 Token 值。
    channel: "test",
    token: null
  }

  initRTCClient(): IAgoraRTCClient {
    // 设置 SDK 的日志输出级别。选择一个级别，你就可以看到在该级别及该级别以上所有级别的日志信息。
    AgoraRTC.setLogLevel(2);
    if (!this.rtc.client) {
      this.rtc.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    }
    return this.rtc.client;
  }

  async joinRTCChannel(uid: string): Promise<UID | null | undefined> {
    if (!this.rtc.client) {
      return;
    }
    this.rtc.uid = await this.rtc.client.join(this.Agora.appId, this.Agora.channel, this.Agora.token, uid);
    return this.rtc.uid;
  }

  async createAudioTrack(): Promise<ILocalAudioTrack | null | undefined> {
    if (!this.rtc.client) {
      return;
    }
    this.rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    return this.rtc.localAudioTrack;
  }

  async createVideoTrack(): Promise<ILocalVideoTrack | null | undefined> {
    if (!this.rtc.client) {
      return;
    }
    this.rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
    return this.rtc.localVideoTrack;
  }

  async publish() {
    if (!this.rtc.client) {
      return;
    }
    if (this.rtc.localAudioTrack && this.rtc.localVideoTrack) {
      await this.rtc.client.publish([this.rtc.localAudioTrack, this.rtc.localVideoTrack]);
    }
  }

  async listenPublish(){
    this.rtc.client?.on("user-published", async (user,mediaType) => {
      await this.rtc.client!.subscribe(user, mediaType);

      return [user,mediaType]
    })
  }

  getRtc(){
    return this.rtc;
  }
}
