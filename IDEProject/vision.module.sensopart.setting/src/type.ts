export interface SignalWrite {
  name: string;
  value: string;
  isError?: boolean;
  errorMessage?: string[];
}

export interface SignalRead {
  name: string;
  value: Uint8Array;
  statusConnect: boolean;
  isError?: boolean;
  errorMessage?: string[];
}


export type NullOrNum = number | null | undefined;
export type ThreeNullOrNumArray = [NullOrNum, NullOrNum, NullOrNum];
export type SixNullOrNumArray = [NullOrNum, NullOrNum, NullOrNum, NullOrNum, NullOrNum, NullOrNum];
export type SetToolWeight = {
  symbol: string;
  tool: {
    weight: NullOrNum;
    cog: ThreeNullOrNumArray;
  };
};

export type SetTCP = {
  symbol: string;
  tcp: {
    targetPose: SixNullOrNumArray;
  };
};







export const COORDINATE_BASE = 0;
export const INDEX_0 = 0;
export const INDEX_1 = 1;
export const INDEX_2 = 2;
export const INDEX_3 = 3;
export const INDEX_4 = 4;
export const INDEX_5 = 5;



export const BASE = 'Base' as const;
export const WORLD = 'World' as const;
export const USER = 'User' as const;
export const TOOL = 'Tool' as const;
export type COORDINATE_TYPE_POSX = typeof BASE | typeof WORLD | typeof TOOL | typeof USER;

export interface IPAdress {
  input1: string;
  input2: string;
  input3: string;
  input4: string;
}

export interface DeviceInfo {
  deviceID: string;
  textDisplay: string;
  writeSignals: SignalWrite[];
  readSignal: SignalRead;
  ipAddress: IPAdress;
  port: string;
  isConnected?: boolean;
  errors?: Record<string, string>;
  isSendSuccess?: boolean;
  uniqueId?: number;
}


export interface TCPClientState {
  uniqueId?: number;
  deviceID: string;
  textDisplay: string;
  writeSignals: SignalWrite[];
  readSignal: SignalRead;
  ipAddress: IPAdress;
  errors?: Record<string, string>;
  port: string;
  historySettingDevice: DeviceInfo[];
  isShowPopupDelete?: boolean;
  isShowResultConnect?: boolean;
  isShowResultDisconnect?: boolean;
  isConnected?: boolean;
  isShowResultSend?: boolean;
  isSendSuccess?: boolean;
  isFocusInput?: boolean;
}