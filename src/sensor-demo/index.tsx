import React from "react";
import ReactDOM from "react-dom";

import { SensorComponent } from "../mobile-app/components/sensor";
import { MockSensor } from "../sensors/mock-sensor";
import { DeviceSensor } from "../sensors/device-sensor";
import { AllCapabilities } from "../sensors/sensor";

import "./index.scss";

const sensor1: DeviceSensor = new DeviceSensor({
  capabilities: AllCapabilities,
});
ReactDOM.render(
  <SensorComponent sensor={sensor1} />,
  document.getElementById("demo1")
);

const sensor2: MockSensor = new MockSensor({
  autoConnect: true,
  capabilities: AllCapabilities,
  pollInterval: 500,
  deviceName: "Mocked Sensor #1"
});
ReactDOM.render(
  <SensorComponent sensor={sensor2} />,
  document.getElementById("demo2")
);

const sensor3: MockSensor = new MockSensor({
  capabilities: AllCapabilities,
  deviceName: "Mocked Sensor #2"
});
ReactDOM.render(
  <SensorComponent sensor={sensor3} />,
  document.getElementById("demo3")
);

const sensor4: MockSensor = new MockSensor({
  capabilities: {
    temperature: true
  },
  deviceName: "Mocked Sensor #3"
});
ReactDOM.render(
  <SensorComponent sensor={sensor4} />,
  document.getElementById("demo4")
);

