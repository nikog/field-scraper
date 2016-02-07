'use strict';

import request from 'request-promise';
import cheerio from 'cheerio';
import http from 'http';
import config from './config.json';

const URI = config.URI;

class FieldScraper {
  constructor(preferences) {
    this.url = URI;

    this.pref = {
      earliestTime: preferences.earliestTime,
      latestTime: preferences.latestTime
    };

    this.requestOptions = {
      uri: this.url,
      transform: (body) => {
        return cheerio.load(body);
      }
    };
  }

  scrape(date) {
    let options = Object.assign({}, this.requestOptions);
    options.qs = Object.assign(
      {},
      options.qs,
      {
        pvm: date
      }
    );

    return request(options)
      .then(($) => {
        let freeSlots = [];

        $('.t1b0000vam').each((i, elem) => {
          let $fields;
          let $element = cheerio(elem);
          let time = $element.text().trim();

          if (time < this.pref.earliestTime || time > this.pref.latestTime) {
            return;
          }

          $fields = $element.parent().next();

          $fields.find('.t1b1111').each((i, elem) => {
            let fieldName;
            let textContent;
            let reserved = false;
            let validField = true;
            let $field = cheerio(elem);

            reserved = $field.find('b').length
              && $field.find('b').text().includes('Varattu');

            if (reserved) {
              return;
            }

            textContent = $field.contents().filter((i, elem) => {
              return elem.type === 'text' && elem.data;
            });

            if (!textContent.length) {
              return;
            }

            fieldName = textContent[0].data.match(/(\w\d)/);

            if (!fieldName) {
              return;
            }

            freeSlots.push({
              field: fieldName[1],
              time: time,
              date: date
            });
          });
        });

        return {
          date: date,
          slots: freeSlots
        };
      })
      .catch((err) => {
        console.log(err);
      });
  }
}

export default FieldScraper;
