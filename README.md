Emoji Drawer
============

This application lets you choose a body part and an emoji. It displays a camera
feed from the device it is running on. Whenever the selected body part is
detected in the video feed the selected emoji is drawn on top of that body
part.

Go to the [live demo](https://boris-arkenaar.github.io/emoji-drawer/) to see it
in action.

Known Issues
------------

- On mobile in portrait mode the video is stretched out. This makes the
    detection of body parts less reliable. In landscape mode it
    looks good however.
- The camera feed does not work in Safari on iOS, while it should be possible.

Development
-----------

Clone this repo.

`yarn` to install dependencies.

`yarn start` to run the application on
[localhost:3000](http://localhost:3000/).

`yarn build` to create a production build.

`yarn deploy` to build and deploy to
[GitHub Pages](https://boris-arkenaar.github.io/emoji-drawer/).

Credits
-------

This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).

The logo of this application is an icon made by
[turkkub](https://www.flaticon.com/authors/turkkub) from
[www.flaticon.com](https://www.flaticon.com)
