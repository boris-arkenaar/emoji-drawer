import * as React from 'react';

interface IProps {
  n: number
}

const addN = (n: number) => (m: number) => m + n;

class AddN extends React.Component<IProps> {
  public render() {
    const {n} = this.props;
    const addSpecific = addN(n);
    const numbers = [-101, -100, -99, -50, -49, -11, -10, -9, -1, 0, 1, 9, 10, 11, 49, 50, 99, 100, 101]
    return (
      <div>
        <h2>Add {n} to...</h2>
        <ul>
          { numbers.map((specific) => (
            <li key={specific}>...{specific} resolves to {addSpecific(specific)}</li>
          ))}
        </ul>
      </div>
    );
  }
}

export default AddN;
