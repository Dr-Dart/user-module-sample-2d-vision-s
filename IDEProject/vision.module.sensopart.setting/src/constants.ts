


import { DeviceInfo } from './type';
import { TwoNumArray } from 'dart-api';
export const KEYS_ADDRESS = ['input1', 'input2', 'input3', 'input4', 'port'];
export const INITIAL_NAME_DEVICE = '(Empty)';

export const INITIAL_DEVICE: DeviceInfo = {
  deviceID: '',
  textDisplay: '',
  writeSignals: [],
  readSignal: {
    name: 'Input',
    value: new Uint8Array(0),
    statusConnect: false,
  },
  ipAddress: {
    input1: '192',
    input2: '168',
    input3: '137',
    input4: '104',
  },
  isConnected: false,
  port: '2006',
};


export const MAX_COORDINATE = 99999.999;
export const MAX_ROTATION = 360;
export const MOVE_L = {
  targetVelocity: [1000, 1000] as TwoNumArray,
  targetAcceleration: [100, 500] as TwoNumArray,
  solutionSpace: 2,
  targetTime: 0,
  moveMode: 0,
  moveReference: 0,
  blendingRadius: 0,
  blendingType: 0,
  fTargetVelNum: 100,
  fTargetAccNum: 100,
};