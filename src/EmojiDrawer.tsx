import * as posenet from '@tensorflow-models/posenet';
import * as React from 'react';

import './EmojiDrawer.css';

interface ICamera {
  deviceId: string,
  label: string
}

interface IEmojiDrawerState {
  bodyPartIndex: number,
  cameraIndex: number,
  cameras: ICamera[],
  emoji: string,
  error: boolean,
  loading: boolean,
  videoHeight: number,
  videoWidth: number
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
  .map((value, index) => String.fromCodePoint(index + 128512));

class EmojiDrawer extends React.Component {
  public state: IEmojiDrawerState = {
    bodyPartIndex: 0,
    cameraIndex: -1,
    cameras: [],
    emoji: emojis[0],
    error: false,
    loading: true,
    videoHeight: 0,
    videoWidth: 0
  };

  private canvas;
  private ctx;
  private net;
  private stream;
  private video;

  private handleBodyPartChange = (event) => {
    this.setState({ bodyPartIndex: event.target.value });
  }

  private handleEmojiChange = (event) => {
    this.setState({ emoji: event.target.value });
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

  private getSizes = () => {
    console.log('resized');
    const canvas = this.canvas.current;
    const videoHeight = canvas.offsetHeight;
    const videoWidth = canvas.offsetWidth;
    console.log({ videoWidth, videoHeight });
    this.setState({ loading: true, videoHeight, videoWidth });
  }

  private getCameras = async () => {
    const { cameraIndex } = this.state;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('devices', devices);
      const cameras = devices
        .filter((device) => device.kind === 'videoinput')
        // Turn it into plain objects
        .map(({ deviceId, label }) => ({ deviceId, label }));
      console.log('cameras', cameras);
      if (cameras.length) {
        const newCameraIndex = cameraIndex === -1 ? 0 : cameraIndex;
        this.setState({ cameraIndex: newCameraIndex, cameras });
      } else {
        this.setState({ loading: false });
      }
    } catch (error) {
      console.error(error);
      this.setState({ error: true, loading: false });
    }
  }

  private getStream = async (videoWidth, videoHeight, deviceId) => {
    const constraints = {
      audio: false,
      video: {
        deviceId: { exact: deviceId },
        height: videoHeight,
        width: videoWidth
      }
    };

    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.getCameras();
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
      this.setState({ error: true, loading: false });
    }
  }

  private trackBodyPart = async () => {
    const { bodyPartIndex, videoWidth } = this.state;
    if (videoWidth) {
      const video = this.video.current;

      try {
        const pose = await this.net.estimateSinglePose(video, 0.5, true, 16);
        const { score, position: {x, y} } = pose.keypoints[bodyPartIndex];
        this.draw(x, y, score);
      } catch (error) {
        console.error(error);
      }
    }

    requestAnimationFrame(this.trackBodyPart);
  }

  private draw = (x, y, score) => {
    const { emoji, videoHeight, videoWidth } = this.state;
    const video = this.video.current;

    this.ctx.clearRect(0, 0, videoWidth, videoHeight);
    this.ctx.save();
    this.ctx.scale(-1, 1);
    this.ctx.translate(-videoWidth, 0);
    this.ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    this.ctx.restore();
    if (score > minScore) {
      this.ctx.font = '30px sans-serif'
      this.ctx.textAlign = 'start';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(emoji, x, y);
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

  public componentDidUpdate(prevProps, prevState) {
    const {
      cameraIndex,
      cameras,
      videoHeight,
      videoWidth
    } = this.state;
    const cameraChanged = cameraIndex !== prevState.cameraIndex;
    const heightChanged = videoHeight !== prevState.videoHeight;
    const widthChanged = videoWidth !== prevState.videoWidth;
    const somethingChanged = cameraChanged || heightChanged || widthChanged;

    if (videoWidth && cameras.length && somethingChanged) {
      this.getStream(videoWidth, videoHeight, cameras[cameraIndex].deviceId);
    }
  }

  public render() {
    const {
      cameras,
      error,
      loading,
      videoHeight,
      videoWidth
    } = this.state;

    return (
      <div className="EmojiDrawer">
        <section className="controls">
          <label>
            <span>🦶:</span>
            <select onChange={this.handleBodyPartChange}>
              { bodyParts.map((bodyPart, index) => (
                <option
                  key={index}
                  value={index}
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
                  { emoji }
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
            <p className="loading">This browser does not appear to support using the camera.</p>
          )}
          { !loading && !error && !cameras.length && (
            <p className="loading">This device does not appear to have a camera.</p>
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
