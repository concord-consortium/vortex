const win = window as any;

const DialogTitle = "Data Collector";

export const confirm = (message: string, onOk: () => void, onCancel?: () => void) => {
  if (win.navigator.notification) {
    win.navigator.notification.confirm(message, (button: number) => {
      if (button === 1) {
        onOk();
      } else {
        onCancel?.();
      }
    }, DialogTitle);
  } else {
    if (window.confirm(message)) {
      onOk();
    } else {
      onCancel?.();
    }
  }
};

export const alert = (message: string) => {
  if (win.navigator.notification) {
    win.navigator.notification.alert(message, () => undefined, DialogTitle);
  } else {
    window.alert(message);
  }
};
