import { Injectable } from '@angular/core';
import AgoraRTC, { ClientRole, IAgoraRTCClient, IBufferSourceAudioTrack, ICameraVideoTrack, ILocalAudioTrack, ILocalVideoTrack, IMicrophoneAudioTrack, UID } from "agora-rtc-sdk-ng"
import AgoraRTM, { RtmChannel, RtmClient, RtmMessage } from 'agora-rtm-sdk';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tokenize } from '@angular/compiler/src/ml_parser/lexer';
import { NullTemplateVisitor } from '@angular/compiler';

const API_DOMAIN = 'https://agora-token-go.herokuapp.com/'
const FETCH_RTC_TOKEN = 'fetch_rtc_token';
const FETCH_RTM_TOKEN = 'fetch_rtm_token';

@Injectable({
  providedIn: 'root'
})
export class RtcService {

  constructor(
    private http: HttpClient
  ) { }

  private rtc: {
    client: IAgoraRTCClient | null,
    localAudioTrack: IMicrophoneAudioTrack | null,
    localVideoTrack: ICameraVideoTrack | null,
    localScreenVideoTrack: ILocalVideoTrack | null,
    localScreenAudioTrack: ILocalAudioTrack | null,
    uid: UID | null
  } = {
      // 用来放置本地客户端。
      client: null,
      // 用来放置本地音视频频轨道对象。
      localAudioTrack: null,
      localVideoTrack: null,
      localScreenAudioTrack: null,
      localScreenVideoTrack: null,
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
    appId: '2997bf2437a74c5489878c5ec224b34d',
    // 如果你的项目开启了 App 证书进行 Token 鉴权，这里填写生成的 Token 值。
    channel: 'channel',
    token: null
  }
  setUrl(url:string){
    return API_DOMAIN + url
  }
  getToken(): void {
    let url = this.setUrl(FETCH_RTC_TOKEN);
    let rtmUrl = this.setUrl(FETCH_RTM_TOKEN);
    let now = Number(Date.now() % 1000000)
    this.rtc.uid = now;
    this.http.post<any>(url, {
      uid: now,
      channelName: this.Agora.channel,
    }, {
      headers: {
        'Content-Type': 'application/json; charset=UTF-8'
      }
    }).subscribe(async res => {
      await this.joinRTCChannel(res.token)
      await this.publish();
    });
    this.http.post<any>('http://localhost:8082/fetch_rtm_token',{
      uid:now.toString(),
    }, {
      headers: {
        'Content-Type': 'application/json; charset=UTF-8'
      }
    }).subscribe(async res => {
      this.rtmClientLogin(now.toString(),res.token)
    });
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

  async joinRTCChannel(token: string): Promise<UID | null | undefined> {
    console.log(this.rtc.uid)
    if (!this.rtc.client) {
      return;
    }

    await this.rtc.client.join(this.Agora.appId, this.Agora.channel, token, this.rtc.uid);
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

  async rtmClientLogin(uid:string,token:string) {
    let now = Date.now().toString();
    const config = {
      uid: uid,
      token: token
    }
    console.log(config)
    await this.rtm.client!.login(config)
  }

  async sendChannelMessage(message: RtmMessage) {
    if (!this.rtm.channel) {
      return;
    }
    await this.rtm.channel.sendMessage(message);
  }



  createRTMChannel(channelName: string): RtmChannel | undefined {
    if (!this.rtm.client) {
      return;
    }
    this.rtm.channel = this.rtm.client.createChannel(channelName);
    return this.rtm.channel
  }
  getRtc() {
    return this.rtc;
  }

  getRTMClient() {
    return this.rtm;
  }

  getRTMChannel() {
    return this.rtm.channel
  }

  removeTrack() {
    this.rtc.localAudioTrack?.close();
    this.rtc.localVideoTrack?.close();
  }
  leaveRTCChannel() {
    this.rtc.client?.leave();
  }

  async shareScreen(): Promise<any> {
    const screenShare = await AgoraRTC.createScreenVideoTrack({
      encoderConfig: "720p_3"
    }, "auto")
    if (Array.isArray(screenShare)) {
      [this.rtc.localScreenVideoTrack, this.rtc.localScreenAudioTrack] = screenShare
      this.shareScreenPublish();
      return this.rtc.localScreenVideoTrack;
    } else {
      this.rtc.localScreenVideoTrack = screenShare;
      this.rtc.localScreenAudioTrack = null;
      this.shareScreenPublish();
      return this.rtc.localScreenVideoTrack;
    }
  }
  async shareScreenPublish() {
    this.rtc.client?.unpublish();
    if (this.rtc.localScreenVideoTrack && this.rtc.localScreenAudioTrack) {
      await this.rtc.client!.publish([this.rtc.localScreenVideoTrack, this.rtc.localScreenAudioTrack]);
    } else if (this.rtc.localScreenVideoTrack && !this.rtc.localScreenAudioTrack) {
      await this.rtc.client!.publish([this.rtc.localScreenVideoTrack]);
    }
  }
  async shareScreenUnPublish(){
    this.rtc.client!.unpublish();
  }
  getlocalScreenVideoTrack(){
    return this.rtc.localScreenVideoTrack;
  }
}
