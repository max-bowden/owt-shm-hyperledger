#include "contiki.h"
#include "sensors.h"
#include "dev/acc-sensor.h"
#include <stdio.h>
#include "math.h"

// get pointer to sensor
struct sensors_sensor *accelerometer_sensor;
accelerometer_sensor = sensors_find("Acc");

// Used for print formatting in Contiki
unsigned short d1(float f) // Integer part
{
  return((unsigned short)f);
}

// Used for print formatting in Contiki
unsigned short d2(float f) // Fractional part
{
  return(1000*(f-d1(f)));
}


float getAcelerometerReading() { 
	float hz = calculateHz(	accelerometer_sensor.value(ACC_X), 
							accelerometer_sensor.value(ACC_Y), 
							accelerometer_sensor.value(ACC_Z));
	return hz;
}

float calculateMean(float arr[], const int n) {
    float sum = 0.0;

    int i;
    for(i=0; i<n; i++)
    {
        sum += arr[i];
    }

    return sum/n;
}

float calculateStandardDeviation(float x[], int n)
{   
    int i;
 
    /*  Compute  variance  */
    // 1. Compute mean
    float mean = calculateMean(x, n), diffFromMean[n], squaredDiffFromMeanSum = 0.0,  variance;

    // 2. Calcuate difference between all elements and mean in "squaredDiffFromMeanSum[]"
    for (i = 0; i < n; i++) 
        diffFromMean[i] = fabs(x[i] - mean);

    // 3. Square each difference and add to total sum
    for(i = 0; i < n; i++) 
        squaredDiffFromMeanSum+=(diffFromMean[i]*diffFromMean[i]);

    // 4. Average the sum of the squared differnces
    variance = (squaredDiffFromMeanSum / (float)n);

    /* Calculate standard deviation  */
    // 5. Take squareroot of varience 
    return sqrt(variance);
}

void transmitData(float data[]) {
  printf("transmitting data: [");
  int i;
  for(i=0;i<(sizeof(data)/sizeof(data[0]));i++)
    printf("%d.%d, ", d1(data[i]), d2(data[i])); 
  printf("]...\n");
  
  // Send to blockchain network
  // POST to owtshm.com/api/com.mb00541.owtshm.SaveFieldData
  // Request body: 
}

float* aggregateEveryOtherValue(float data[], const int n) {
  if(n%2!=0)
    return -1; // only accept even N
  
  float result[n/2];

  int i;
  for(i=0;i<n/2;i++) {
    float aggregatedValue = (data[i] + data[++i])/2;
    result[i/2] = aggregatedValue;
  }

  return result;
}

/*---------------------------------------------------------------------------*/
PROCESS(sensor_aggreate_proc, "Sensor data aggreation process");
AUTOSTART_PROCESSES(&sensor_aggreate_proc);
/*---------------------------------------------------------------------------*/
PROCESS_THREAD(sensor_aggreate_proc, ev, data)
{  
  static struct etimer sampleIntervalTimer;

  const int BUFF_SZ = 12; // buffer length
  const int HIGH_ACTIVITY_THRESHOLD = 13; // in hz

  float aggregateBuffer[BUFF_SZ]; // buffer containing accelerometer readings
  static int bufferCursor = 0; // current buffer index  

  PROCESS_BEGIN();
  SENSORS_ACTIVATE(accelerometer_sensor);
  etimer_set(&sampleIntervalTimer, CLOCK_CONF_SECOND);
  
  accelerometer_sensor.configure(ACC_CONF_SENSITIVITY, ACC_2G);
  accelerometer_sensor.configure(ACC_CONF_DATA_RATE, ACC_100HZ);

  printf("entering control loop\n");
  while(1) {
    // sleep inbetween samples to reduce power consumption
    PROCESS_WAIT_EVENT_UNTIL(etimer_expired(&sampleIntervalTimer));

    if(bufferCursor >= BUFF_SZ) { // buffer is full
      float bufferStandardDeviation = calculateStandardDeviation(aggregateBuffer, BUFF_SZ);
      
      if(bufferStandardDeviation >= HIGH_ACTIVITY_THRESHOLD) {
        // high activity detected
   	// so aggreate every other value in the buffer        
        transmitData(aggregateEveryOtherValue(aggregateBuffer, BUFF_SZ));       
      } else {
        // no interesting activity detected 
	// so just send mean away
        float mean[] = { calculateMean(aggregateBuffer, BUFF_SZ) }; // must be array
        transmitData(mean);
      }

      // reset buffer
      bufferCursor = 0;
    } else {   
      // buffer is not full
      // so append current value & increment cursor
      aggregateBuffer[bufferCursor++] = getAcelerometerReading();
    }

    etimer_reset(&sampleIntervalTimer);
  } // end while

  PROCESS_END();
}
/*---------------------------------------------------------------------------*/

/* Accelerometer specific code courtesy of https://github.com/ejoerns/contiki-inga/wiki/Accelerometer */