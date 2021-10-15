import { Component, OnInit } from '@angular/core';
import { RtcService } from 'src/app/service/rtc.service';
import AgoraRTC from "agora-rtc-sdk-ng"

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

@Component({
  selector: 'app-rtc',
  templateUrl: './rtc.component.html',
  styleUrls: ['./rtc.component.scss']
})
export class RtcComponent implements OnInit {

  uid : string = ''
  constructor(
    private rtcService:RtcService
  ) { }

  ngOnInit(): void {
    this.startBasicCall()
  }

  async startBasicCall() {
    this.rtcService.initRTCClient()
    this.uid = new Date().toISOString();
    this.rtcService.joinRTCChannel(this.uid);
    await this.rtcService.createAudioTrack();
    await this.rtcService.createVideoTrack();

    
    let rtc = this.rtcService.getRtc();
    rtc.client!.on("user-published", async (user, mediaType) => {
      // 开始订阅远端用户。
      await rtc.client!.subscribe(user, mediaType);
      console.log("subscribe success");
    
      // 表示本次订阅的是视频。
      if (mediaType === "video") {
        // 订阅完成后，从 `user` 中获取远端视频轨道对象。
        const remoteVideoTrack = user.videoTrack;
        // 动态插入一个 DIV 节点作为播放远端视频轨道的容器。
        console.log(user)
        const playerContainer = document.createElement("div");
        // 给这个 DIV 节点指定一个 ID，这里指定的是远端用户的 UID。
        playerContainer.id = user.uid.toString();
        playerContainer.style.width = "640px";
        playerContainer.style.height = "480px";
        document.body.append(playerContainer);
    
        // 订阅完成，播放远端音视频。
        // 传入 DIV 节点，让 SDK 在这个节点下创建相应的播放器播放远端视频。
        remoteVideoTrack!.play(playerContainer);
    
        // 也可以只传入该 DIV 节点的 ID。
        // remoteVideoTrack.play(playerContainer.id);
      }
    
      // 表示本次订阅的是音频。
      if (mediaType === "audio") {
        // 订阅完成后，从 `user` 中获取远端音频轨道对象。
        const remoteAudioTrack = user.audioTrack;
        // 播放音频因为不会有画面，不需要提供 DOM 元素的信息。
        remoteAudioTrack!.play();
      }
    });
    // let listen = await this.rtcService.listenPublish();
    // console.log(listen)

        this.rtcService.publish();
  }
  
  
}
