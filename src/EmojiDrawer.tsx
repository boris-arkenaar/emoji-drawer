import * as posenet from '@tensorflow-models/posenet';
import * as React from 'react';

import './EmojiDrawer.css';

interface ICamera {
  deviceId: string,
  label: string
}

interface IEmojiDrawerState {
  bodyPart?: string,
  emoji?: number,
  deviceId?: string
  videoWidth: number,
  videoHeight: number,
  cameras: ICamera[],
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
    videoHeight: 0,
    cameras: []
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

  private handleCameraChange = (event) => {
    const deviceId = event.target.value;
    this.setState({ deviceId });
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

    const devices = await navigator.mediaDevices.enumerateDevices();
    console.log('devices', devices);
    const cameras = devices
      .filter((device) => device.kind === 'videoinput')
      // Turn it into plain objects
      .map(({ deviceId, label }) => ({ deviceId, label }));
    console.log('cameras', cameras);
    const deviceId = cameras.length && cameras[0].deviceId;
    this.setState({ cameras, deviceId });
  }

  public componentWillUnmount() {
    this.net.dispose();
    window.removeEventListener('resize', this.getSizes);
  }

  public async componentDidUpdate(prevProps, prevState) {
    const { videoWidth, videoHeight, deviceId } = this.state;
    const widthChanged = videoWidth !== prevState.videoWidth;
    const heightChanged = videoHeight !== prevState.videoHeight;
    const deviceChanged = deviceId !== prevState.deviceId;
    if (!(videoWidth && deviceId)
      || !(widthChanged || heightChanged || deviceChanged)
    ) {
      return;
    }

    const constraints = {
      video: {
        width: videoWidth,
        height: videoHeight,
        deviceId
      }
    };

    try {
      console.log('cameras before', this.state.cameras);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const videoTracks = stream.getVideoTracks();
      const camera = this.state.cameras.find((camera) => camera.deviceId === this.state.deviceId);
      if (camera && !camera.label) {
        const cameras = this.state.cameras.map((camera) => {
          console.log('test', camera);
          console.log('test2', { ...camera });
          return camera.deviceId === this.state.deviceId
            ? {
              ...camera,
              label: videoTracks[0].label
            } : camera;
        });
        this.setState({ cameras });
        console.log('cameras after', cameras);
      }
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
    const { videoWidth, videoHeight, cameras } = this.state;
    return (
      <div className="EmojiDrawer">
        <section className="controls">
          <label>
            <span>🦶:</span>
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
          </label>
          <label className="emoji">
            <span>😶:</span>
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
          </label>
          <label>
            <span>📷:</span>
            <select onChange={this.handleCameraChange}>
              { cameras.map((camera, index) => (
                <option
                  key={camera.deviceId}
                  value={camera.deviceId}
                >
                  { camera.label ? camera.label.split(' ')[0] : `Camera ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
        </section>
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
