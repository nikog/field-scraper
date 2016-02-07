'use strict';

import moment from 'moment';
import Datastore from 'nedb';
import FieldScraper from './field-scraper';
import Notifier from './notifier';

let db = new Datastore({
  filename: 'database/fields.db'
});

let preferences = {
  earliestTime: '18:00',
  latestTime: '20:00'
};

let daysToParse = 5;
let date = moment();
let fieldScraper = new FieldScraper(preferences);
let scrapersDone = [];

db.loadDatabase((err) => {
  if (err) {
    console.log(err);
  }
});

while (daysToParse > 0) {
  let weekDay = date.isoWeekday();

  if (weekDay < 5) {
    let scraperDone = fieldScraper.scrape(date.format('YYYY-MM-DD'));
    scrapersDone.push(scraperDone);

    daysToParse--;
  }

  date = date.add(1, 'days');
}

let newFields = [];

Promise.all(scrapersDone)
  .then((dates) => {
    let promises = [];

    dates.forEach((date) => {
      let previousTime;
      let dateString = moment(date.date).format('ddd DD.MM.YYYY');

      date.slots.forEach((slot) => {
        let foundPrevious = new Promise((resolve, reject) => {
          db.find({
            date: date.date,
            time: slot.time,
            field: slot.field
          }, (err, fields) => {
            if (previousTime != slot.time) {
              console.log(`On ${dateString} at ${slot.time}:`);
              previousTime = slot.time;
            }

            if (fields.length) {
              console.log(`\tField ${slot.field} is available`);
            } else {
              console.log(`\tNew! Field ${slot.field} is available`);

              resolve(slot);

              db.insert({
                date: date.date,
                time: slot.time,
                field: slot.field
              }, (err) => {
                if (err) {
                  console.log(err);
                  reject();
                }
              });
            }
          });
        });
        promises.push(foundPrevious);
      });
    });

    return Promise.all(promises);
  })
  .then((newSlots) => {
    if (!newSlots.length) {
      return;
    }

    let notifier = new Notifier();

    let message = [];
    newSlots.forEach((slot) => {
      var dateString = moment(slot.date).format('ddd DD.MM.YYYY');
      message.push(`${dateString} - ${slot.time} - Field ${slot.field}`);
    });

    notifier.push({
      title: 'New fields available',
      body: message.join('\n')
    });
  });
