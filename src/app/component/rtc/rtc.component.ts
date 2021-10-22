import { Component, OnInit } from '@angular/core';
import { RtcService } from 'src/app/service/rtc.service';
import AgoraRTC, { IAgoraRTCRemoteUser, ILocalVideoTrack } from "agora-rtc-sdk-ng"
import AgoraRTM, { RtmClient } from 'agora-rtm-sdk';

const Container = document.createElement("div");
@Component({
  selector: 'app-rtc',
  templateUrl: './rtc.component.html',
  styleUrls: ['./rtc.component.scss']
})
export class RtcComponent implements OnInit {
  uid: string = ''
  token: string = '';
  visible: boolean = false;
  constructor(
    private rtcService: RtcService
  ) { }
  ngOnInit(): void {
    this.startBasicCall();
    this.startRTM();
    console.log(navigator.userAgent)
    //偵測視窗大小
    if (window.screen.width > 780) {
      this.visible = true;
    }

    //set Canvas Container
    this.setParentContainer();
  }

  async startBasicCall() {

    await this.rtcService.initRTCClient();
    this.listenUserInvite();

    await this.rtcService.createAudioTrack();

    await this.rtcService.createVideoTrack().then(async videoTrack => {
      this.canvasPrint(undefined, videoTrack);
    });

    await this.rtcService.getToken();

  }
  async startRTM() {

    await this.rtcService.initRTMClient();
    // this.rtcService.rtmClientLogin();

  }

  listenUserInvite() {
    let rtc = this.rtcService.getRtc();
    rtc.client!.on("user-published", async (user, mediaType) => {
      // 开始订阅远端用户。
      await rtc.client!.subscribe(user, mediaType);
      // 表示本次订阅的是视频。

      if (mediaType === "video") {
        this.canvasPrint(user);
      }

      // 表示本次订阅的是音频。
      if (mediaType === "audio") {
        // 订阅完成后，从 `user` 中获取远端音频轨道对象。
        const remoteAudioTrack = user.audioTrack;
        // 播放音频因为不会有画面，不需要提供 DOM 元素的信息。
        remoteAudioTrack!.play();
      }
    });

    rtc.client!.on("user-left", async user => {
      const playerContainer = document.getElementById(<string>user.uid);
      playerContainer && playerContainer.remove();
      console.log('user left')
    })

    rtc.client!.on("user-unpublished", async (user, mediaType) => {
      const playerContainer = document.getElementById(<string>user.uid);
      playerContainer && playerContainer.remove();
    })

  }

  canvasPrint(user?: IAgoraRTCRemoteUser, localVideoTrack?: ILocalVideoTrack | null | undefined) {
    if (user != null) {
      let playerContainer = this.setContainer(user.uid.toString())
      Container.append(playerContainer);
      playerContainer && user.videoTrack!.play(playerContainer);
    } else {
      let playerContainer = this.setContainer('canvas.me')
      Container.append(playerContainer);
      playerContainer && localVideoTrack!.play(playerContainer);
    }
  }

  setParentContainer() {
    if (this.visible) {
      Container.id = "container"
      Container.style.width = "100vw"
      Container.style.height = "100vh"
      Container.style.display = "flex"
      Container.style.flexDirection = "row"
      Container.style.flexWrap = "wrap"
      document.body.append(Container);
    } else {
      Container.id = "container"
      Container.style.width = "100vw"
      Container.style.height = "100vh"
      Container.style.display = "flex"
      Container.style.flexDirection = "column"
      Container.style.flexWrap = "wrap"
      document.body.append(Container);
    }
  }

  setContainer(id: string) {
    const playerContainer = document.createElement("div");
    if (this.visible) {
      playerContainer.style.width = "50vw";
    } else {
      playerContainer.style.width = "100vw";
    }
    playerContainer.id = id;
    playerContainer.className = 'childCanvas'
    playerContainer.style.flexGrow = "1";
    playerContainer.style.flexShrink = "1";
    return playerContainer
  }
  /**
   * 監聽畫面變動
   * 
   * 
   */
  onResize(event: any) {
    const w = event.target.innerWidth;
    if (w >= 768) {
      this.visible = true;
      Container.style.flexDirection = "row";
      const childCanvas: any = document.getElementsByClassName("childCanvas");
      for (let i = 0; i < childCanvas.length; i++) {
        childCanvas[i].style.width = "50vw";
      }
    } else {
      this.visible = false;
      Container.style.flexDirection = "column";
      const childCanvas: any = document.getElementsByClassName("childCanvas");
      for (let i = 0; i < childCanvas.length; i++) {
        childCanvas[i].style.width = "100vw";
      }
    }
  }
  sendmessage() {
    let rtmClient = this.rtcService.getRTMClient();
    const message = JSON.stringify({
      type: 'pin',
      userId: rtmClient.uid
    });
    this.rtcService.sendChannelMessage({ text: message }).then(() => {
      console.log('success')
    })
  }

  async joinRTMChannel(channelName: string) {
    this.leaveRTMChannel();
    let channel = await this.rtcService.createRTMChannel(channelName);

    await channel?.join();
    this.rtcService.getRTMChannel()?.on('ChannelMessage', function (message, memberId) {
      console.log(message)
    });
    this.rtcService.getRTMChannel()?.on('MemberJoined', memberId => {
      console.log(memberId)
    })


  }

  leaveRTMChannel() {
    this.rtcService.getRTMChannel()?.leave().then(() => {
      console.log('leave success')
    });
  }

  async leaveRTCChannel() {
    this.rtcService.removeTrack();
    let clinet = this.rtcService.getRtc().client?.remoteUsers.forEach(user => {
      this.removeCanvas(<string>user.uid)
    })

    this.rtcService.leaveRTCChannel();
  }

  async shareScreen() {
    let playerContainer = this.setContainer('shareScreen')
    Container.append(playerContainer);
    await this.rtcService.shareScreen().then(ScreenVideoTrack => {
      console.log(ScreenVideoTrack)
      playerContainer && ScreenVideoTrack!.play(playerContainer);


    });
    if (this.rtcService.getlocalScreenVideoTrack()) {
      this.rtcService.getlocalScreenVideoTrack()!.on('track-ended', () => {
        this.removeCanvas('shareScreen')
        this.rtcService.shareScreenUnPublish()
        this.rtcService.publish();
      })
    }
  }

  removeCanvas(Dom_id:string){
    const playerContainer = document.getElementById(Dom_id);
    playerContainer && playerContainer.remove();
  }
}

