let _inIframe = false;
try {
  _inIframe = window.top !== window.self;
} catch (e) {
  _inIframe = true;
}

export const inIframe = () => _inIframe;
