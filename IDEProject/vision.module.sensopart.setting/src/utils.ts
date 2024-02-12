import { INITIAL_DEVICE, INITIAL_NAME_DEVICE } from './constants';
/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {  TCPClientState } from './type';



export const uniqueId = () => {
  return 'id-' + Math.random().toString(36).substring(2, 16);
};



export const getInitialState = (): TCPClientState => {
  const deviceID = uniqueId();
  const textDisplay = INITIAL_NAME_DEVICE;
  return {
    ...INITIAL_DEVICE,
    textDisplay,
    deviceID,
    historySettingDevice: [{ ...INITIAL_DEVICE, textDisplay, deviceID }],
  };
};


export function stringToArray(bufferString:string): Uint8Array {
	let uint8Array = new TextEncoder().encode(bufferString);
	return uint8Array;
}
export function arrayToString(bufferValue:Uint8Array): string {
	return new TextDecoder("utf-8").decode(bufferValue);
}
