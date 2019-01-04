import * as posenet from '@tensorflow-models/posenet';
import * as React from 'react';

const videoWidth = 600;
const videoHeight = 500;

class EmojiDrawer extends React.Component {
  private canvas;
  private ctx;
  private net;
  private video;

  private handleTrackNoseClick = async () => {
    this.ctx = this.canvas.current.getContext('2d');
    const pose = await this.net.estimateSinglePose(this.video.current, 0.5, true, 16);
    const nosePos = pose.keypoints[0].position;
    this.draw(nosePos.y, nosePos.x, 3, 'aqua');
    requestAnimationFrame(this.handleTrackNoseClick);
  }

  private draw = (y, x, r, color) => {
    this.ctx.clearRect(0, 0, videoWidth, videoHeight);
    this.ctx.save();
    this.ctx.scale(-1, 1);
    this.ctx.translate(-videoWidth, 0);
    this.ctx.drawImage(this.video.current, 0, 0, videoWidth, videoHeight);
    this.ctx.restore();

    this.ctx.font = '20px sans-serif';
    this.ctx.fillStyle = color;
    this.ctx.fillText('😀', x-10, y+10);
  }

  constructor(props) {
    super(props);
    this.canvas = React.createRef();
    this.video = React.createRef();
  }

  public async componentDidMount() {
    this.net = await posenet.load(0.75);
    const constraints = { video: { facingMode: 'user', width: videoWidth, height: videoHeight } };
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const videoTracks = stream.getVideoTracks();
      console.log('Using video device: ' + videoTracks[0].label);
      if (this.video.current) {
        this.video.current.srcObject = stream;
      }
    } catch (error) {
      console.error(error);
    }
  }

  public render() {
    return (
      <div>
        <h2>Emoji Drawer</h2>
        <button onClick={this.handleTrackNoseClick}>Track nose</button>
        <video
          style={{ display: 'none' }}
          autoPlay
          height={videoHeight}
          ref={this.video}
          width={videoWidth}
        />
        <canvas
          height={videoHeight}
          ref={this.canvas}
          width={videoWidth}
        />
      </div>
    );
  }
}

export default EmojiDrawer;
