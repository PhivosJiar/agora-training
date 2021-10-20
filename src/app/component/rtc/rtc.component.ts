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
      await rtc.client!.subscribe(user, mediaType);

      if (mediaType === "video") {
        this.canvasPrint(user);
      }

      // 表示本次订阅的是音频。
      if (mediaType === "audio") {

        const remoteAudioTrack = user.audioTrack;

        remoteAudioTrack!.play();
      }
    });

    rtc.client?.on("user-left",async (user)=>{
      const playerContainer = document.getElementById(<string>user.uid);
      playerContainer && playerContainer.remove();
      console.log('user left')
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
    if(this.visible){
      playerContainer.style.width = "50vw";
      
    }else{
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
      const childCanvas:any = document.getElementsByClassName("childCanvas");
      for(let i=0 ; i< childCanvas.length ;i++){
        childCanvas[i].style.width="50vw";
      }
    } else {
      this.visible = false;
      Container.style.flexDirection = "column";
      const childCanvas:any = document.getElementsByClassName("childCanvas");
      for(let i=0 ; i< childCanvas.length ;i++){
        childCanvas[i].style.width="100vw";
      }
    }
  }
}
