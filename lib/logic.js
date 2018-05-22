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
  console.log("Entered saveFieldData");
  
  var owt = vibrationReading.owt;

  console.log('Adding field data ' + vibrationReading.toSave.valueHz + 'HZ to owt ' + owt.$identifier);

  if (owt.vibrationReadings) {
    owt.vibrationReadings.push(vibrationReading.toSave);
  } else {
    console.log("no readings exist yet");
    owt.vibrationReadings = [vibrationReading.toSave];
  }

    
  if (!checkSmaDeviation(owt)) {
    console.log("Deviation detected!");
    raiseSmaAlarm({owt: owt, vibrationReading: vibrationReading.toSave});
  } else {
     console.log("No deviation detected!");
  }
  
  // then update mean
  owt.meanOfLastThreeReadings = calculateMeanOfLastThreeReadings(owt);

  // finally update the VibrationReading and Owt asset reistries
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
 * Return the mean of the last three readings of OWT
 *
 */
function calculateMeanOfLastThreeReadings(owt) {
  if (owt.vibrationReadings.length < 3)
    return -1;

  var lastThreeReadingsTotal = 0;
  var i;
  for (i = owt.vibrationReadings.length-1; i > owt.vibrationReadings.length - 3 - 1; i--) {
    lastThreeReadingsTotal += parseFloat(owt.vibrationReadings[i].valueHz);
  }

  return parseFloat(lastThreeReadingsTotal) / 3;
}

/*
 * Return TRUE if no deviation, else FALSE
 *
 * This is where the smart contract happens - part two 
 * 1. Calculate the allowable deviation from the OWT's last average
 * 2. (Return) Check if the new average is within the allowable deviation of the last average (owt.meanOfLastThreeReadings)
 */
function checkSmaDeviation(owt) {
  if (owt.meanOfLastThreeReadings === -1) 
	return true;
	
  var allowableDeviation = owt.meanOfLastThreeReadings * 0.1; // allow 10% deviation, else there's a structural defect
  var latestReading = owt.vibrationReadings[owt.vibrationReadings.length-1].valueHz;

  if (latestReading< (owt.meanOfLastThreeReadings - allowableDeviation)
	  || latestReading > (owt.meanOfLastThreeReadings + allowableDeviation)) {
    // outside 10% threshold
    return false;
  } else {
	// within 10% threshold
    return true;
  }
}

/**
  * Helper function for SaveFieldData
  * Create a new Alarm asset and add it to the Alarm registry
 */
function raiseSmaAlarm(alarmInfo) {
  console.log("entered raiseSmaAlarm");
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
 * @param {com.mb00541.owtshm.AddAlarmResponse} responseInfo
 * @transaction
 */
function addAlarmResponse(responseInfo) {
    console.log("entered addAlarmResponse");
    var alarmResponse = getFactory().newResource(NS, 'AlarmResponse', generateId());
    alarmResponse.createdAt = new Date();
    alarmResponse.operatorId = responseInfo.operatorId;
    alarmResponse.details = responseInfo.details;
    alarmResponse.action = responseInfo.action;

    responseInfo.forAlarm.response = alarmResponse;

    return getAssetRegistry(NS + '.AlarmResponse')
      .then(function (alarmResponseRegistry) {
        // add the alarm
        return alarmResponseRegistry.add(alarmResponse);
      }).then(function() {
          return getAssetRegistry(NS + ".SmaDeviationAlarm");
      }).then(function (smaDeviationAlarmRegistry) {
          smaDeviationAlarmRegistry.update(responseInfo.forAlarm);
      });
}

/**
 *
 * @param {com.mb00541.owtshm.SaveIotNodeHeartbeat} iotNodeHeartbeat
 * @transaction
 */
function saveIotNodeHeartbeat(iotNodeHeartbeat) {
	return getAssetRegistry(NS + '.IotNodeHeartbeat')
      .then(function (iotNodeHeartbeatRegistry) {
        // add the IotNodeHeartbeat
        return iotNodeHeartbeatRegistry.add(iotNodeHeartbeat.toSave);
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

  var iotNodes = [
    factory.newResource(NS, 'IotNode', 'IOT_NODE_1'),
    factory.newResource(NS, 'IotNode', 'IOT_NODE_2')
  ];
  
  owts.forEach(function (owt) {
        owt.id = owt.getIdentifier();
        owt.farm = Math.floor(Math.random() * 1000, 1);
        owt.meanOfLastThreeReadings = -1;
      });
	  
  var serialNumber = 0;
  iotNodes.forEach(function(iotNode) {
	  iotNode.location = owts[serialNumber++];	
	  iotNode.serialNumber = serialNumber.toString();
  });

  return getAssetRegistry(NS + '.Owt')
    .then(function (owtRegistry) {
    return owtRegistry.addAll(owts);
  }).then(function() {
        return getParticipantRegistry(NS + ".IotNode");
  }).then(function (iotNodeReistry) {
      return iotNodeReistry.addAll(iotNodes);
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
