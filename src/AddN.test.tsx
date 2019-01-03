import * as React from 'react';
import * as enzyme from 'enzyme';
import AddN from './AddN';

it('renders the correct text when no enthusiasm level is given', () => {
  const addN = enzyme.shallow(<AddN n={5} />);
  expect(addN.find("li").first().text()).toContain('-96');
});
