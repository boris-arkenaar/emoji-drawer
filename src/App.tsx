import * as React from 'react';

import EmojiDrawer from './EmojiDrawer';

import './App.css';

import logo from './logo.png';

class App extends React.Component {
  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Emoji Drawer</h1>
        </header>
        <EmojiDrawer/>
      </div>
    );
  }
}

export default App;
