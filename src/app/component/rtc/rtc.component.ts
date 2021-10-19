import { Component, OnInit } from '@angular/core';
import { RtcService } from 'src/app/service/rtc.service';
import AgoraRTC, { IAgoraRTCRemoteUser, ILocalVideoTrack } from "agora-rtc-sdk-ng"
import AgoraRTM from 'agora-rtm-sdk';

const Container = document.createElement("div");
@Component({
  selector: 'app-rtc',
  templateUrl: './rtc.component.html',
  styleUrls: ['./rtc.component.scss']
})
export class RtcComponent implements OnInit {
  uid: string = ''
  visible: boolean = false;
  constructor(
    private rtcService: RtcService
  ) { }

  ngOnInit(): void {
    this.startBasicCall();
    this.startRTM();
    if (window.screen.width > 780) {
      this.visible = true;
    }
    this.setParentContainer();
  }

  async startBasicCall() {
    await this.rtcService.initRTCClient()
    await this.rtcService.joinRTCChannel();
    this.listenUserInivte();
    await this.rtcService.createAudioTrack();
    
    await this.rtcService.createVideoTrack().then(async videoTrack => {
      this.canvasPrint(undefined, videoTrack);
    });

    this.rtcService.publish().then(() => {
    });


  }
  async startRTM() {
    
    await this.rtcService.initRTMClient();
    await this.rtcService.rtmClientLogin();
    let channel = await this.rtcService.createRTMChannel();
    
    await channel?.join();
    this.rtcService.getRTMChannel()?.on('ChannelMessage', function (message, memberId) {
      // 你的代码：收到频道消息。
      console.log(message)
    });
    this.rtcService.getRTMChannel()?.on('MemberJoined', memberId => {
      console.log(memberId)
      // 你的代码：用户已加入频道。
      })
    let rtm = await this.rtcService.getRTMClient();

  }

  listenUserInivte() {
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
  sendmessage(){
    const message = JSON.stringify({
      type: 'pin',
      userId: '阿花'
    });
    this.rtcService.sendChannelMessage({ text: message }).then(()=>{
      console.log('success')
    })
  }
}

