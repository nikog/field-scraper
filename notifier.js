'use strict';

import request from 'request-promise';
import moment from 'moment';
import config from './config.json';

const PB_API_KEY = config.PB_API_KEY;
const PB_CHANNEL_TAG = config.PB_CHANNEL_TAG;

class Notifier {
  constructor() {
    this.options = {
      uri: 'https://api.pushbullet.com/v2/pushes',
      method: 'POST',
      body: {
        type: 'note',
        channel_tag: PB_CHANNEL_TAG
      },
      json: true,
      headers: {
        'Access-Token': PB_API_KEY,
        'Content-Type': 'application/json'
      }
    };
  }

  push(content) {
    let options = Object.assign({}, this.options);
    options.body = Object.assign(
      {},
      this.options.body,
      {
        title: content.title,
        body: content.body
      }
    );

    return request(options)
      .catch((err) => {
        console.log(err);
      });
  }
}

export default Notifier;
