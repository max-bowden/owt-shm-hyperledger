/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

/*eslint-disable no-unused-vars*/

/*eslint-disable no-undef*/

var NS = 'com.mb00541.owtshm';


/**
 *
 * @param {com.mb00541.owtshm.SaveFieldData} vibrationReading
 * @transaction
 */
function saveFieldData(vibrationReading) {
  var NS = 'com.mb00541.owtshm';

  var owt = vibrationReading.owt;

  console.log('Saving VibrationReading to asset registry');
  

  console.log('Adding field data ' + vibrationReading.valueHz + 'HZ to owt ' + owt.$identifier);

  if (owt.vibrationReadings) {
    console.log('Pusing vibration data to OWT...');

    owt.vibrationReadings.push(vibrationReading.toSave);
    console.log('Pushed vibration data to OWT...');
  } else {
    console.log("no readings exist yet");
    owt.vibrationReadings = [vibrationReading.toSave];
  }

  if (!checkSmaDeviation(owt)) {
    raiseAlarm({owt: owt, vibrationReading: vibrationReading.toSave});
  }


  return getAssetRegistry(NS + '.VibrationReading')
  .then(function (owtRegistry) {
    // add the vibration reading to the owt
    return owtRegistry.add(vibrationReading.toSave);
  }).then(function () {
    return getAssetRegistry(NS + '.Owt');
  }).then(function (owtRegistry) {
    // add the vibration reading to the owt
    return owtRegistry.update(owt);
  }); 
}


/*
 * This is where the smart contract happens. 
 * 1. Calculate the allowable deviation from the OWT's last average
 * 2. Calculate the new average
 * 3. Check if the new average is within the allowable deviation of the last average (owt.meanOfLastNReadings)
 * 4. Call RaiseAlarm transaction if it is
 */
function checkSmaDeviation(owt) {
  var averageOverLastReadings = 3;
  var vibrationReadings = owt.vibrationReadings;
  if (!vibrationReadings)
    return true;
  if (vibrationReadings.length < averageOverLastReadings)
    return true;

  var lastNReadingsTotal = 0;
  var i;
  for (i = vibrationReadings.length-1; i > vibrationReadings.length - averageOverLastReadings - 1; i--) {
    lastNReadingsTotal += vibrationReadings[i].valueHz;
  }

  var lastNReadingsMean = parseFloat(lastNReadingsTotal) / averageOverLastReadings;
  var allowableDeviation = owt.meanOfLastNReadings * 0.1; // allow 10% deviation, else there's a structural defect

  if (owt.meanOfLastNReadings === -1) { // is the first three readings for the OWT
    owt.meanOfLastNReadings = lastNReadingsMean;
    return true;
  } else if (lastNReadingsMean < owt.meanOfLastNReadings - allowableDeviation || lastNReadingsMean > owt.meanOfLastNReadings + allowableDeviation) {
    owt.meanOfLastNReadings = lastNReadingsMean;
    return false;
  } else {
    owt.meanOfLastNReadings = parseFloat(lastNReadingsMean);
    return true;
  }
}

/**
  * Helper function for SaveFieldData - contains smart contract logic for detecting structural defects.
 */
function raiseAlarm(alarmInfo) {
  console.log("entered raiseAlarm");
  var alarm = getFactory().newResource(NS, 'SmaDeviationAlarm', generateId());
  alarm.owt = alarmInfo.owt;
  alarm.raisedAt = new Date();
  alarm.raisedBy = alarmInfo.vibrationReading;

  // send email here

  return getAssetRegistry(NS + '.SmaDeviationAlarm')
    .then(function (alarmRegistry) {
      // add the alarm
      return alarmRegistry.add(alarm);
    });
}

/**
 *
 * @param {com.mb00541.owtshm.SetupDemo} setupDemo
 * @transaction
 */
function setupDemo(setupDemo) {
  var factory = getFactory();

  var owts = [
    factory.newResource(NS, 'Owt', 'OWT_1'),
    factory.newResource(NS, 'Owt', 'OWT_2')
  ];

  var vibrationReadings = [
    factory.newResource(NS, 'VibrationReading', generateId()),
    factory.newResource(NS, 'VibrationReading', generateId()),
    factory.newResource(NS, 'VibrationReading', generateId()),
    factory.newResource(NS, 'VibrationReading', generateId())
  ];

  return getAssetRegistry(NS + '.Owt')
    .then(function (owtRegistry) {
      owts.forEach(function (owt) {
        owt.id = owt.getIdentifier();
        owt.farm = Math.floor(Math.random() * 1000, 1);
        owt.meanOfLastNReadings = -1;
      });
      return owtRegistry.addAll(owts);
    });
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateId() {
  return (new Date().getTime().toString() + Math.random()).toString().replace('.', '');
}

/*eslint-enable no-unused-vars*/
/*eslint-enable no-undef*/