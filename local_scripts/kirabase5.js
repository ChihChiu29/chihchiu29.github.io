let COMPANY_ID = '-MeNcbDasiIykiow2Hfb';

let BRANCH_ID_XY = "-NJv97D1S0vDwmdQR4lM";  // 信義店
let BRANCH_ID_ST = "-N3JQxh1vIZe9tECk0Pg";  // 台北三創店
let BRANCH_ID_XM = "-NLRXZWFIRJBhOSk1d_h"; // 西門店
let BRANCH_ID_GX = "-N04NZLqRzkSAM-EjB-5";  // 高雄店

function log(content) {
  console.log(`${new Date().toTimeString()} ${JSON.stringify(content)}`);
}

function getIntBetween(lowerBoundInclusive, upperBoundNonInclusive) {
  return Math.floor(Math.random() * (
    upperBoundNonInclusive - lowerBoundInclusive)) + lowerBoundInclusive;
}

function now() {
  return new Date().getTime();
}

function fetchIgnoreError(url, option) {
  return fetch(url, content).catch((err) => {
    log(err);
  });
}

// Only phone and email (both) are used for checking; name is not relevant.
testInfo = {
  name: "羅言",
  phone: "+8860917123456",
  email: "4kmusicmake@gmail.com",
  gender: 1,
}

hsuanInfo = {
  name: "Hsuan Pao",
  phone: "+8860916196678",
  email: "shelly98982002@yahoo.com.tw",
  gender: 1,
};

chengguoInfo = {
  name: "Pao Ta",
  phone: "+8860958874478",
  email: "needmanyfood1@gmail.com",
  gender: 2,
};

babaInfo = {
  name: "鲍傑",
  phone: "+8860916196678",
  email: "powordisland@gmail.com",
  gender: 2,
};

mamaInfo = {
  name: "邱鳳椿",
  phone: "+8860916196678",
  email: "chiou8989@gmail.com",
  gender: 2,
};

zhiqiuInfo = {
  name: "Zhi Qiu",
  phone: "+8860905888213",
  email: "shelly2204@gmail.com",
  gender: 2,
};

/* Example output:
{
    "default": {
        "2024-03-01": {
            "times": {
                "11:00": [ 1, 2 ]
                ...
            },
            "dinerTime": 105,
            "maxBookingSize": 2,
            "minBookingSize": 1,
            "status": "full"
        }
    }
}
*/
function getAvailableTimeslots(date /*2024-02-04*/, companyId, branchId) {
  return fetch(
    `https://inline.app/api/booking-capacitiesV3?companyId=${companyId}%3Ainline-live-2&branchId=${branchId}&dateRange=${date}`, {
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "X-Client-Fingerprint": Math.floor(Math.random() * 10000000000).toString(),
      "X-Client-Session-Id": Math.floor(Math.random() * 10000000000).toString(),
    },
  })
}

function book(date, timeslot, info, companyId, branchId) {
  return fetch('https://inline.app/api/reservations/booking', {
    method: "POST",
    mode: "cors",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "X-Client-Fingerprint": "845c4b42827e8899a9c1280356b9bb8e",
      // "X-Client-Fingerprint": Math.floor(Math.random() * 10000000000).toString(),
      // "X-Client-Session-Id": "69389b66-2dd7-4d7c-9a61-2001b81e3a1e",
      // "X-Client-Session-Id": Math.floor(Math.random() * 10000000000).toString(),
      "X-Client-Session-Id": "eeaa51a7-a6c5-4c97-8b3b-8c2f063ae138",
      // backup
      // X-Client-Fingerprint: 845c4b42827e8899a9c1280356b9bb8e
      // X-Client-Session-Id: df4a4258-0f96-4f4b-9b40-a1644c40b078
    },
    body: JSON.stringify({
      "language": "zh-tw",
      "company": companyId + ':inline-live-2',
      "branch": branchId,

      "purposes": ["朋友聚餐"],
      "diningPurposes": [],

      "email": info.email,
      "phone": info.phone,
      "gender": info.gender,
      "name": info.name,

      "familyName": "",
      "givenName": "",
      "phoneticFamilyName": "",
      "phoneticGivenName": "",
      "note": "",
      "groupSize": 2,
      "kids": 0,

      "date": date,
      "time": timeslot,

      "referer": "inline.app",

      "numberOfKidChairs": 0,
      "numberOfKidSets": 0,
      "skipPhoneValidation": false
    }),
  });
}

// const TIMESLOTS = [
//     "11:00",
//     "11:30",
//     "12:00",
//     "12:30",
//     "13:00",
//     "13:30",
//     "14:00",
//     "14:30",
//     "17:00",
//     "17:30",
//     "18:00",
//     "18:30",
//     "19:00",
//     "19:30",
// ];

const TIMESLOTS = [
  // "11:00",
  "13:00",
  "17:00",
  "19:00",
];

class SequenceActionThrottler {
  queue = [];
  delayBetweenActionsMs = 0;
  previousActionTime = 0;
  sheduled = false;

  // Params:
  //  - delayMs: next action won't start until it's at least delayMs later than previous task's start time.
  //  - delayStartMs: the queue won't run until this much time later.
  constructor(delayMs, delayStartUntil = -1) {
    this.delayBetweenActionsMs = delayMs;
    if (delayStartUntil === -1) {
      this.previousActionTime = now();
    } else {
      this.previousActionTime = delayStartUntil;
    }
  }

  // Enqueues an action, also kicks off execution if not already.
  enqueue(action) {
    this.queue.push(action);
    this.maybeExecuteNext();
  }

  cancel() {
    this.queue = [];
  }

  maybeExecuteNext() {
    if (this.sheduled) {
      // No need to do anything, this function will be invoked in the future.
      return;
    }

    const saveThis = this;
    const delta = now() - this.previousActionTime;
    if (delta > this.delayBetweenActionsMs) {
      const nextAction = this.queue.shift();
      if (nextAction) {
        nextAction();
        saveThis.previousActionTime = now();
        saveThis.maybeExecuteNext();
      }
    } else {
      setTimeout(() => {
        saveThis.sheduled = false;
        saveThis.maybeExecuteNext();
      }, this.delayBetweenActionsMs - delta);
      this.sheduled = true;
    }
  }
}

// let bookFunction = bookChecked;
function bookScheduler(scheduler, date, timeslot, info, companyId, branchId) {
  scheduler.enqueue(
    () => {
      log(`executing for: ${date} - ${timeslot}`);
      book(date, timeslot, info, companyId, branchId).then((fetchResponse) => {
        if (fetchResponse.ok) {
          log(`SUCCESS for: ${date} - ${timeslot}`);
          fetchResponse.json().then((data) => log(data));
        }
      })
    }
  );
  log(`scheduled for: ${date} - ${timeslot}`);
}

// const QPS_LIMIT = 1 / 15;
let QPS_LIMIT = 3;
function bookSchedulerAll(date, info, companyId, branchId, startDateTimeString, numberOfTries = 10, timeslots = TIMESLOTS) {
  const startDateTimeInt = Math.max(new Date(startDateTimeString).getTime(), now());
  const scheduler = new SequenceActionThrottler(1000 / QPS_LIMIT, startDateTimeInt);
  for (let i = 0; i < numberOfTries; i++) {
    for (let timeslot of timeslots) {
      bookScheduler(scheduler, date, timeslot, info, companyId, branchId);
    }
  }
  return scheduler;
}

// TEST
// response = bookChecked('2024-03-03', '11:30', testInfo, COMPANY_ID, BRANCH_ID_XM, MAGIC_KEY_XM);

// TEST 1: will not book anything and will keep trying.
// bookSchedulerAll("2024-03-10", testInfo, COMPANY_ID, BRANCH_ID_XY, '2024-03-02 17:30', 1 * 60 * QPS_LIMIT / TIMESLOTS.length /* 5 min of trying */);

// TEST 2: can book something (and no retry)
// bookSchedulerAll("2024-03-01", testInfo, COMPANY_ID, BRANCH_ID_XY, MAGIC_KEY_XY, '2024-03-01 00:00', 60);

// ACTUAL
// bookSchedulerAll("2024-03-08", babaInfo, COMPANY_ID, BRANCH_ID_ST, MAGIC_KEY_ST, '2024-03-02 00:00', 60 * 4 /* 4 min */);
bookSchedulerAll("2024-03-09", mamaInfo, COMPANY_ID, BRANCH_ID_ST, '2024-03-03 00:00', 4 * 60 * QPS_LIMIT / TIMESLOTS.length /* 5 min of trying */);
