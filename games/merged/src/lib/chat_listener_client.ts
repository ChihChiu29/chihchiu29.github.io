var CHAT_LISTENER = {
  RETRY_INTERVAL_SEC: 30 * 1000,

  // Starts a new listener to new non-empty messages.
  // Check details from `chat_listener_server.js`.
  startListening: function (listenerCallback: (who: string, rawMsg: string, msgArray: string[], extraInfo: QExtraInfo) => void) {
    let ws = new WebSocket('ws://localhost:8187');
    ws.onmessage = function (rawEvent) {
      let event = JSON.parse(rawEvent.data) as QEvent;
      const msgArray = event.msg.split(' ').filter((x) => x);
      if (!msgArray.length) {
        return;
      }
      console.log(`${event.who}: ${event.msg}, ${msgArray}, ${JSON.stringify(event.extraInfo)}`);
      listenerCallback(event.who, event.msg, msgArray, event.extraInfo);
    };
    ws.onopen = function () {
      console.log('connected!');
    }
    ws.onerror = function (err) {
      // No need to call start listening since `onclose` will be called after `onerror` when server is closed.
      console.log(err);
    };
    ws.onclose = function () {
      console.log('closed!');
      CHAT_LISTENER.startListening(listenerCallback);
    }
  }
};
