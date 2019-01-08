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
  videoWidth: number,
  videoHeight: number,
  cameras: ICamera[],
  cameraIndex: number,
  loading: boolean,
  error: boolean
}

const minScore = 0.5;
const bodyParts = [
  'nose',
  'left eye',
  'right eye',
  'left ear',
  'right ear',
  'left shoulder',
  'right shoulder',
  'left elbow',
  'right elbow',
  'left wrist',
  'right wrist',
  'left hip',
  'right hip',
  'left knee',
  'right knee',
  'left ankle',
  'right ankle'
];
const emojis = Array(79)
  .fill(0)
  .map((value, index) => index + 128512);

class EmojiDrawer extends React.Component {
  public state: IEmojiDrawerState = {
    videoWidth: 0,
    videoHeight: 0,
    cameras: [],
    cameraIndex: -1,
    loading: true,
    error: false
  };

  private canvas;
  private ctx;
  private net;
  private video;
  private stream;

  private handleBodyPartChange = (event) => {
    const bodyPart = event.target.value;
    this.setState({ bodyPart });
  }

  private handleEmojiChange = (event) => {
    const emoji = event.target.value;
    this.setState({ emoji });
  }

  private handleSwitchCameraClick = () => {
    const { cameras, cameraIndex } = this.state;
    console.log('switch?', cameras);
    const nextCameraIndex = cameras.length > 1
      ? (cameraIndex + 1) % cameras.length
      : cameraIndex;
    console.log('switch!', nextCameraIndex);
    this.setState({ cameraIndex: nextCameraIndex });
  }

  private trackBodyPart = async () => {
    if (this.state.videoWidth) {
      const bodyPartIndex = this.state.bodyPart
        ? bodyParts.indexOf(this.state.bodyPart)
        : 0;

      try {
        const pose = await this.net.estimateSinglePose(this.video.current, 0.5, true, 16);
        const {position: {x, y}, score} = pose.keypoints[bodyPartIndex];
        this.draw(x, y, score);
      } catch (error) {
        console.error(error);
      }
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
      this.ctx.font = '30px sans-serif'
      this.ctx.textAlign = 'start';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(String.fromCodePoint(emoji), x, y);
    }
  }

  private getSizes = () => {
    console.log('resized');
    const videoWidth = this.canvas.current.offsetWidth;
    const videoHeight = this.canvas.current.offsetHeight;
    console.log({ videoWidth, videoHeight });
    this.setState({ videoWidth, videoHeight, loading: true });
  }

  public getCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('devices', devices);
      const cameras = devices
        .filter((device) => device.kind === 'videoinput')
        // Turn it into plain objects
        .map(({ deviceId, label }) => ({ deviceId, label }));
      console.log('cameras', cameras);
      if (cameras.length) {
        this.setState({ cameras, cameraIndex: 0 });
      } else {
        this.setState({ loading: false });
      }
    } catch (error) {
      console.error(error);
      this.setState({ loading: false, error: true });
    }
  }

  constructor(props) {
    super(props);
    this.canvas = React.createRef();
    this.video = React.createRef();
  }

  public async componentDidMount() {
    window.addEventListener('resize', this.getSizes);
    this.getSizes();
    this.getCameras();
    this.ctx = this.canvas.current.getContext('2d');
    this.net = await posenet.load(0.75);
    this.trackBodyPart();
  }

  public componentWillUnmount() {
    this.net.dispose();
    window.removeEventListener('resize', this.getSizes);
  }

  public async componentDidUpdate(prevProps, prevState) {
    const { videoWidth, videoHeight, cameraIndex } = this.state;
    const widthChanged = videoWidth !== prevState.videoWidth;
    const heightChanged = videoHeight !== prevState.videoHeight;
    const cameraChanged = cameraIndex !== prevState.cameraIndex;

    if (!(videoWidth
      && this.state.cameras.length
      && (widthChanged || heightChanged || cameraChanged)
    )) {
      return;
    }

    const currentCamera = this.state.cameras[cameraIndex];
    const constraints = {
      audio: false,
      video: {
        width: videoWidth,
        height: videoHeight,
        deviceId: { exact: currentCamera.deviceId }
      }
    };

    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    try {
      console.log('cameras before', this.state.cameras);
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.getCameras();
      const videoTracks = this.stream.getVideoTracks();
      console.log('videoTracks', videoTracks);
      console.log('Using video device: ' + videoTracks[0].label);
      const video = this.video.current;
      if (video) {
        video.srcObject = this.stream;
        video.load();
        video.onloadedmetadata = () => {
          video.play();
          this.setState({ loading: false });
        };
      }
    } catch (error) {
      console.error(error);
      this.setState({ loading: false, error: true });
    }
  }

  public render() {
    const {
      videoWidth,
      videoHeight,
      loading,
      error,
      cameras
    } = this.state;
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
          <button onClick={this.handleSwitchCameraClick}>
            <span>Switch camera</span>
          </button>
        </section>
        <div className="video-container">
          { loading && (
            <p className="loading">Loading video feed...</p>
          )}
          { !loading && error && (
            <p className="loading">This browser does not appear to support using the camera, or the device has none.</p>
          )}
          { !loading && !error && !cameras.length && (
            <p className="loading">This device does not appear to have any camera.</p>
          )}
          <video
            style={{ display: 'none' }}
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
