import * as posenet from '@tensorflow-models/posenet';
import * as React from 'react';

import './EmojiDrawer.css';

interface IEmojiDrawerState {
  bodyPart?: string,
  emoji?: number,
  videoWidth: number,
  videoHeight: number
}

const minScore = 0.5;
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
  public state: IEmojiDrawerState = {
    videoWidth: 0,
    videoHeight: 0
  };

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

  private trackBodyPart = async () => {
    if (this.state.videoWidth) {
      const bodyPartIndex = this.state.bodyPart
        ? bodyParts.indexOf(this.state.bodyPart)
        : 0;
      const pose = await this.net.estimateSinglePose(this.video.current, 0.5, true, 16);
      const {position: {x, y}, score} = pose.keypoints[bodyPartIndex];
      this.draw(x, y, score);
    }

    requestAnimationFrame(this.trackBodyPart);
  }

  private draw = (x, y, score) => {
    const { videoWidth, videoHeight } = this.state;
    const emoji = this.state.emoji || emojis[0];

    this.ctx.clearRect(0, 0, videoWidth, videoHeight);
    this.ctx.save();
    this.ctx.scale(-1, 1);
    this.ctx.translate(-videoWidth, 0);
    this.ctx.drawImage(this.video.current, 0, 0, videoWidth, videoHeight);
    this.ctx.restore();
    if (score > minScore) {
      this.ctx.fillText(String.fromCodePoint(emoji), x-10, y+10);
    }
  }

  private getSizes = () => {
    console.log('resized');
    const videoWidth = this.canvas.current.offsetWidth;
    const videoHeight = this.canvas.current.offsetHeight;
    console.log({ videoWidth, videoHeight });
    this.setState({ videoWidth, videoHeight });
  }

  constructor(props) {
    super(props);
    this.canvas = React.createRef();
    this.video = React.createRef();
  }

  public async componentDidMount() {
    console.log('mount');
    this.net = await posenet.load(0.75);
    this.ctx = this.canvas.current.getContext('2d');
    window.addEventListener('resize', this.getSizes);
    this.getSizes();
    this.trackBodyPart();
  }

  public componentWillUnmount() {
    this.net.dispose();
    window.removeEventListener('resize', this.getSizes);
  }

  public async componentDidUpdate(prevProps, prevState) {
    const { videoWidth, videoHeight } = this.state;
    if (videoWidth === prevState.videoWidth && videoHeight === prevState.videoHeight) {
      return;
    }

    const constraints = { video: { width: videoWidth, height: videoHeight } };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const videoTracks = stream.getVideoTracks();
      console.log('videoTracks', videoTracks);
      console.log('Using video device: ' + videoTracks[0].label);
      if (this.video.current) {
        this.video.current.srcObject = stream;
      }
    } catch (error) {
      console.error(error);
    }
  }

  public render() {
    const { videoWidth, videoHeight } = this.state;
    return (
      <div className="EmojiDrawer">
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
        <div className="video-container">
          <p className="loading">Loading video feed...</p>
          <video
            style={{ display: 'none' }}
            autoPlay
            height={videoHeight}
            ref={this.video}
            width={videoWidth}
          />
        </div>
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
