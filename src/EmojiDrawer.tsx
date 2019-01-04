import * as posenet from '@tensorflow-models/posenet';
import * as React from 'react';

interface IEmojiDrawerState {
  bodyPart?: string,
  emoji?: number
}

const videoWidth = 600;
const videoHeight = 500;
const bodyParts = [
  'nose',
  'leftEye',
  'rightEye',
  'leftEar',
  'rightEar',
  'leftShoulder',
  'rightShoulder',
  'leftElbow',
  'rightElbow',
  'leftWrist',
  'rightWrist',
  'leftHip',
  'rightHip',
  'leftKnee',
  'rightKnee',
  'leftAnkle',
  'rightAnkle'
];
const emojis = Array(79)
  .fill(0)
  .map((value, index) => index + 128512);

class EmojiDrawer extends React.Component {
  public state: IEmojiDrawerState = {};

  private canvas;
  private ctx;
  private net;
  private video;

  private handleBodyPartChange = (event) => {
    const bodyPart = event.target.value;
    this.setState({ bodyPart });
  }

  private handleEmojiChange = (event) => {
    const emoji = event.target.value;
    this.setState({ emoji });
  }

  private handleTrackNoseClick = async () => {
    const bodyPartIndex = this.state.bodyPart
      ? bodyParts.indexOf(this.state.bodyPart)
      : 0;
    this.ctx = this.canvas.current.getContext('2d');
    const pose = await this.net.estimateSinglePose(this.video.current, 0.5, true, 16);
    const nosePos = pose.keypoints[bodyPartIndex].position;
    this.draw(nosePos.y, nosePos.x, 3, 'aqua');
    requestAnimationFrame(this.handleTrackNoseClick);
  }

  private draw = (y, x, r, color) => {
    const emoji = this.state.emoji || emojis[0];

    this.ctx.clearRect(0, 0, videoWidth, videoHeight);
    this.ctx.save();
    this.ctx.scale(-1, 1);
    this.ctx.translate(-videoWidth, 0);
    this.ctx.drawImage(this.video.current, 0, 0, videoWidth, videoHeight);
    this.ctx.restore();

    this.ctx.font = '20px sans-serif';
    this.ctx.fillStyle = color;
    this.ctx.fillText(String.fromCodePoint(emoji), x-10, y+10);
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
        <select onChange={this.handleBodyPartChange}>
          { bodyParts.map((bodyPart) => (
            <option
              key={bodyPart}
              value={bodyPart}
            >
              { bodyPart }
            </option>
          ))}
        </select>
        <select onChange={this.handleEmojiChange}>
          { emojis.map((emoji) => (
            <option
              key={emoji}
              value={emoji}
            >
              { String.fromCodePoint(emoji) }
            </option>
          ))}
        </select>
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
