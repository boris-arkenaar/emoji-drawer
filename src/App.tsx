import * as React from 'react';

import AddN from './AddN';

import './App.css';

import logo from './logo.svg';

class App extends React.Component {
  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.tsx</code> and save to reload.
        </p>
        <AddN n={-101} />
        <AddN n={-100} />
        <AddN n={-99} />
        <AddN n={-49} />
        <AddN n={-11} />
        <AddN n={-10} />
        <AddN n={-9} />
        <AddN n={-5} />
        <AddN n={-1} />
        <AddN n={0} />
        <AddN n={1} />
        <AddN n={5} />
        <AddN n={9} />
        <AddN n={10} />
        <AddN n={11} />
        <AddN n={49} />
        <AddN n={99} />
        <AddN n={100} />
        <AddN n={101} />
      </div>
    );
  }
}

export default App;
