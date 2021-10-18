import { Component, OnInit } from '@angular/core';
import { RtcService } from 'src/app/service/rtc.service';
import AgoraRTC, { IAgoraRTCRemoteUser, ILocalVideoTrack } from "agora-rtc-sdk-ng"

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

@Component({
  selector: 'app-rtc',
  templateUrl: './rtc.component.html',
  styleUrls: ['./rtc.component.scss']
})
export class RtcComponent implements OnInit {

  uid: string = ''
  user: any = []
  constructor(
    private rtcService: RtcService
  ) { }

  ngOnInit(): void {
    this.startBasicCall()
  }

  async startBasicCall() {
    this.rtcService.initRTCClient()
    this.listenUserInivte();
    this.rtcService.joinRTCChannel();
    await this.rtcService.createAudioTrack();
    await this.rtcService.createVideoTrack().then(async videoTrack => {
      this.canvasPrint(undefined,videoTrack);
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
        this.canvasPrint(user)
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
      // const remoteVideoTrack = user.videoTrack;

      // const playerContainer = document.createElement("div");
      // playerContainer.id = user.uid.toString();
      // playerContainer.style.width = "640px";
      // playerContainer.style.height = "480px";
      // document.body.append(playerContainer);

      // remoteVideoTrack!.play(playerContainer);

      const playerContainer = document.getElementById(`canvasOthers`);
        playerContainer && user.videoTrack?.play(playerContainer);
    } else {
      const playerContainer = document.getElementById(`canvasMe`);
      // playerContainer && user.videoTrack?.play(playerContainer);
      // const playerContainer = document.createElement("div");
      // // 给这个 DIV 节点指定一个 ID，这里指定的是远端用户的 UID。
      // playerContainer.id = 'canvas-me';
      // playerContainer.style.width = "640px";
      // playerContainer.style.height = "480px";
      // document.body.append(playerContainer);
      playerContainer && localVideoTrack!.play(playerContainer);
    }
  }

}
