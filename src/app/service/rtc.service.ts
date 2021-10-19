import { Injectable } from '@angular/core';
import AgoraRTC, { IAgoraRTCClient, IBufferSourceAudioTrack, ICameraVideoTrack, ILocalAudioTrack, ILocalVideoTrack, IMicrophoneAudioTrack, UID } from "agora-rtc-sdk-ng"
import AgoraRTM, { RtmChannel, RtmClient, RtmMessage } from 'agora-rtm-sdk';
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

  private rtm: {
    client: RtmClient | null,
    channel: RtmChannel | null,
    uid: UID | null
  } = {
      client: null,
      channel: null,
      uid: null,
    }

  public Agora = {
    // 替换成你自己项目的 App ID。
    appId: '18e175f4a5704f588c910d176ca51752',
    // 如果你的项目开启了 App 证书进行 Token 鉴权，这里填写生成的 Token 值。
    channel: "channel",
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

  initRTMClient(): RtmClient {
    if (!this.rtm.client) {
      this.rtm.client = AgoraRTM.createInstance(this.Agora.appId)
    }
    return this.rtm.client;
  }

  async joinRTCChannel(): Promise<UID | null | undefined> {
    if (!this.rtc.client) {
      return;
    }
    this.rtc.uid = await this.rtc.client.join(this.Agora.appId, this.Agora.channel, this.Agora.token, this.rtc.uid);
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

  async listenPublish() {
    this.rtc.client?.on("user-published", async (user, mediaType) => {
      await this.rtc.client!.subscribe(user, mediaType);

      return [user, mediaType]
    })
  }

  async rtmClientLogin() {

    const config = {
      uid: Date.toString(),
      token: undefined
    }
    await this.rtm.client!.login(config)
  }

  async sendChannelMessage(message: RtmMessage) {
    if (!this.rtm.channel) {
      return;
    }
    await this.rtm.channel.sendMessage(message);
  }

  createRTMChannel(): RtmChannel | undefined {
    if (!this.rtm.client) {
      return;
    }
    this.rtm.channel = this.rtm.client.createChannel('testchannel');
    return this.rtm.channel
  }
  getRtc() {
    return this.rtc;
  }

  getRTMClient(){
    return this.rtm;
  }
}
