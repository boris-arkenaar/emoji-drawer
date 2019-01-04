import * as enzyme from 'enzyme';
import * as React from 'react';

import EmojiDrawer from './EmojiDrawer';

it('renders the correct text when no enthusiasm level is given', () => {
  const emojiDrawer = enzyme.shallow(<EmojiDrawer />);
  expect(emojiDrawer.find("h2").text()).toContain('Emoji Drawer');
});
