import React from "react";
import ReactDOM from "react-dom";

import NextApp from './NextApp';
import registerServiceWorker from './registerServiceWorker';

// Wrap the rendering in a function:
const render = Component => {
  ReactDOM.render(
    // Wrap App inside AppContainer
      <Component/>,
    document.getElementById('root')
  );
};

// Do this once
registerServiceWorker();

// Render once
render(NextApp);

