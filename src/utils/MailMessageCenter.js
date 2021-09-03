class MailMessageCenter {
  static messageQueue = {};
  static windowIds = [];
  /**
   * 监听topic
   * @param {*} message
   * @param {*} handler
   * @param {*} scope
   * @param {*} onlyOne
   */
  static subscribe(message, handler, scope, onlyOne) {
    let uuid = MailMessageCenter.guid();
    if (message && handler) {
      if (!MailMessageCenter.messageQueue[message]) {
        MailMessageCenter.messageQueue[message] = [];
      }
      if (onlyOne) {
        return MailMessageCenter.messageQueue[message]= [{
          uuid: uuid,
          scope: scope,
          handler: handler
        }];
      }
      MailMessageCenter.messageQueue[message].push({
        uuid: uuid,
        scope: scope,
        handler: handler
      });
    }
    return uuid;
  }

  /**
   * 移除整个topic
   * @param {*} message
   */
  static unsubscribe(message) {
    if (MailMessageCenter.messageQueue[message]) {
      delete MailMessageCenter.messageQueue[message];
    }
  }

  /**
   * 移除topic下特定的监听
   * @param {*} message
   * @param {*} uuid
   */
  static removeListener(message, uuid) {
    if (!uuid) {
      return
    }
    let listenerQueue = MailMessageCenter.messageQueue[message]
    if (listenerQueue) {
      let idx = 0;
      while (idx < listenerQueue.length) {
        let item = listenerQueue[idx];
        if (item.uuid === uuid) {
          listenerQueue.splice(idx, 1);
        }
        idx++;
      }
    }

    MailMessageCenter.messageQueue[message] = listenerQueue || [];
  }

  /**
   * 批量移除topic下特定的监听
   * @param {*} message
   * @param {*} uuid
   */
  static removeListenerInBulk(msgUuidList) {
    if(msgUuidList && msgUuidList instanceof Array){
      for(let item of msgUuidList){
        MailMessageCenter.removeListener(item.message, item.uuid)
      }
    }
  }

  static getEventEmitter(message) {
    return {
      eventName: message,
      eventHandler: MailMessageCenter.messageQueue[message]
    };
  }

  static publish(message, args, ignoreRepublish, senderWindowId) {
    if (MailMessageCenter.messageQueue[message]) {
      for (var objectIndex = 0; objectIndex < MailMessageCenter.messageQueue[message].length; objectIndex++) {
        var item = MailMessageCenter.messageQueue[message][objectIndex];
        item.handler && item.handler.apply(item.scope ? item.scope : window, args);
      }
      return MailMessageCenter.messageQueue[message].length;
    }
    return 0;
  }

  /**
   * 生成全局唯一标识符
   * @returns {string}
   */
  static guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    })
  }
}
export default MailMessageCenter;
