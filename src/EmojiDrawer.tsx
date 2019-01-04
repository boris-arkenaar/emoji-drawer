import * as React from 'react';

class EmojiDrawer extends React.Component {
  private video;

  constructor(props) {
    super(props);
    this.video = React.createRef();
  }

  public async componentDidMount() {
    const constraints = { video: true };
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
        <video
          autoPlay
          ref={this.video}
        />
      </div>
    );
  }
}

export default EmojiDrawer;
