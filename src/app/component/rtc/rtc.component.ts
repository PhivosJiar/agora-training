import { Component, OnInit } from '@angular/core';
import { RtcService } from 'src/app/service/rtc.service';
import AgoraRTC, { IAgoraRTCRemoteUser, ILocalVideoTrack } from "agora-rtc-sdk-ng"


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
    if (window.screen.width > 780) {
      this.visible = true;
    }
    this.setParentContainer();
  }

  async startBasicCall() {
    this.rtcService.initRTCClient()
    this.listenUserInivte();
    this.rtcService.joinRTCChannel();
    await this.rtcService.createAudioTrack();

    await this.rtcService.createVideoTrack().then(async videoTrack => {
      this.canvasPrint(undefined, videoTrack);
    });
    this.rtcService.publish().then(() => {
    });


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
    playerContainer.id = id;
    playerContainer.style.flexGrow = "1";
    playerContainer.style.flexShrink = "1";
    playerContainer.style.width = "50vw";
    playerContainer.style.height = "auto";
    return playerContainer
  }

  onResize(event: any) {
    console.log(event)
    console.log(this.visible)
    const w = event.target.innerWidth;
    if (w >= 768) {
      this.visible = true;
    } else {
      this.visible = false;
    }
  }
}
