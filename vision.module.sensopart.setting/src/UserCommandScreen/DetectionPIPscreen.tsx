import React from 'react';

import {
  Context, IModulePackageManager, ICommunicationManager, ModuleScreen, IModuleChannel, Message, SixNumArray, ModuleScreenProps, FrameworkModuleStatus,
  TcpCommunicationMonitoringData,
  TcpCommunicationResult,
  TcpCommunicationType
  , IDartDatabase
} from 'dart-api';


import styles from "../assets/PIPstyles/styles.scss";
import {
  arrayToString,
} from '../utils';

import { VisionJob } from '../components/VisionJob';
import ShootPose from '../components/ShootPose';
import VisionPose from "../components/VisionPose";
import PickingPose from '../components/PickingPose';
import StatusIcon from "../assets/images/status_icon_circle.svg";


import {

  getInitialState,
} from '../utils';
import { IPAdress, TCPClientState } from '../type';
import { Button, FormControl, FormGroup, FormLabel, TextField, ThemeProvider } from "@mui/material";
import { messages } from '../messages'

const TABLE_VISIONDB_NAME = 'VisionDB';
const TABLE_VISIONDB_COLUMNS = ['visionDBId', 'CalibrationPoseData', 'VisionInputData'];


interface VisionData {
  tcpState: TCPClientState;
  VisionJob: number;
  ShootPose: SixNumArray;
  VisionPose: SixNumArray;
  PickingPose: SixNumArray;
}
interface VisionDataState {
  visionData: VisionData;
}


export default class PipScreenForTaskEditor extends ModuleScreen {
  private communicationManager!: ICommunicationManager;
  private modulePackageManager!: IModulePackageManager;


  private VisionInputDB: IDartDatabase | null;
  constructor(props: ModuleScreenProps) {
    super(props);
    this.VisionInputDB = this.moduleContext.getSystemLibrary(Context.DART_DATABASE) as IDartDatabase;

    this.state = {


      visionData: {
        tcpState: getInitialState(),
        VisionJob: 1,
        ShootPose: [0, 0, 90, 0, 90, 0],
        VisionPose: [100, 100, 100, 0, 0, 0],
        PickingPose: [100, 100, 10, 0, 0, 0]

      } as VisionData

    }
    this.onConnectAddress = this.onConnectAddress.bind(this);
    this.onDisconnectAddress = this.onDisconnectAddress.bind(this);
    this.onChangeIpAddress = this.onChangeIpAddress.bind(this)
    this.onChangePort = this.onChangePort.bind(this)
    this.getVisionPoseParam = this.getVisionPoseParam.bind(this)
    this.getShootPoseParam = this.getShootPoseParam.bind(this)
    this.getPickingPoseParam = this.getPickingPoseParam.bind(this)

  }



  componentDidMount() {

    this.communicationManager = this.moduleContext.getSystemManager(Context.COMMUNICATION_MANAGER) as ICommunicationManager;
    this.modulePackageManager = this.moduleContext.getSystemManager(Context.MODULE_PACKAGE_MANAGER) as IModulePackageManager;


    this.InitState();
  }
  componentWillUnmount(): void {

    this.onDisconnectAddress()
      this.onBlur()
  }

  InitState = () => {
    const initialData = {}



    this.VisionInputDB?.query(TABLE_VISIONDB_NAME, TABLE_VISIONDB_COLUMNS, {}).then((queryResult) => {
      if (queryResult?.length === 0) {

      }
      else {

        if (queryResult[0].data.VisionInputData !== JSON.stringify(initialData)) {

          this.setState({

            visionData: JSON.parse(queryResult[0].data.VisionInputData)

          });
        }
      }

    })


  };



  componentDidUpdate(prevProps: Readonly<ModuleScreenProps>, prevState: Readonly<VisionData>, snapshot?: any): void {


    const obj1 = {
      isConnected: prevState.visionData.tcpState.isConnected,
      readSignal: prevState.visionData.tcpState.readSignal,
    };
    const obj2 = {
      isConnected: this.state.visionData.tcpState.isConnected,
      readSignal: this.state.visionData.tcpState.readSignal,
    };
    if (obj1.isConnected !== obj2.isConnected) {
      if (!obj2.readSignal.isError && obj2.isConnected) {
        this.communicationManager.tcpIp.tcpClientMessageReceived.register(this.moduleContext, this.readSingal);
      } else {
        this.communicationManager.tcpIp.tcpClientMessageReceived.unregister(this.moduleContext, this.readSingal);
      }
    }
    if (this.state.visionData !== prevState) {

    if (JSON.stringify(this.state.visionData) !== JSON.stringify(prevState.visionData)) {
      const { uniqueId } = this.state.visionData.tcpState;
      this.dataChange();  
      
      this.onBlur() 
   
    }

  }


  dataChange = () => {

    if (this.channel !== undefined) {
      const data: Record<string, any> = {};
      data['TaskEditorSavedVisionData'] = this.state.visionData;
      this.channel.send('dataChanged', data);
    }
  };



  onBind(message: Message, channel: IModuleChannel): boolean {
    this.channel = channel;
    const initialData = {}
    this.VisionInputDB?.query(TABLE_VISIONDB_NAME, TABLE_VISIONDB_COLUMNS, {}).then((queryResult) => {
      if (queryResult?.length === 0) {

      }
      else {

        if (queryResult[0].data.VisionInputData === JSON.stringify(initialData)) {

          this.VisionInputDB?.update(TABLE_VISIONDB_NAME, {}, {
            VisionInputData: JSON.stringify(this.state.visionData),

          })

        }
        else {
          this.setState({

            visionData: JSON.parse(queryResult[0].data.VisionInputData)

          });
        }
      }
    })



    // make get_current_data
    channel.receive('get_current_data', () => {

      const data: Record<string, any> = {};


      data['TaskEditorSavedVisionData'] = this.state.visionData;


      channel.send('get_current_data', data);

    });
    return true;


  }


  onConnectAddress = () => {
    const { port, ipAddress } = this.state.visionData.tcpState;
    const { input1, input2, input3, input4 } = ipAddress;
    const ip = [input1, input2, input3, input4].join('.');

    this.modulePackageManager
      .loadFrameworkModule('com.dart.module.default.tcp', 'TCP')
      .then(({ uniqueId }: { status: FrameworkModuleStatus; uniqueId: number }) => {
        this.communicationManager.tcpIp.open(uniqueId, TcpCommunicationType.CLIENT, ip, +port).then(
          ({ result }: TcpCommunicationResult) => {
            if (result === 1) {
              this.setState((prevState: VisionDataState) => ({
                visionData: {
                  ...prevState.visionData,
                  tcpState: {
                    ...prevState.visionData.tcpState,
                    isConnected: true,
                    uniqueId: uniqueId
                  },
                },
              }));



            } else {
              this.setState((prevState: VisionDataState) => ({
                visionData: {
                  ...prevState.visionData,
                  tcpState: {
                    ...prevState.visionData.tcpState,
                    isShowResultConnect: true
                  },
                },
              }));



            }
          },
          () => {
            this.setState((prevState: VisionDataState) => ({
              visionData: {
                ...prevState.visionData,
                tcpState: {
                  ...prevState.visionData.tcpState,
                  isShowResultConnect: true,
                },
              },
            }));


          },
        );
      });
  };

  onDisconnectAddress = () => {
    const { uniqueId } = this.state.visionData.tcpState;

    if (uniqueId) {
      this.communicationManager.tcpIp.close(uniqueId).then(
        ({ result }: TcpCommunicationResult) => {
          if (result === 1) {

            this.setState((prevState: VisionDataState) => ({
              visionData: {
                ...prevState.visionData,
                tcpState: {
                  ...prevState.visionData.tcpState,
                  isConnected: false
                },
              },
            }));



          } else {

            this.setState((prevState: VisionDataState) => ({
              visionData: {
                ...prevState.visionData,
                tcpState: {
                  ...prevState.visionData.tcpState,
                  isShowResultDisconnect: true
                },
              },
            }));




          }
        },
        () => {

          this.setState((prevState: VisionDataState) => ({
            visionData: {
              ...prevState.visionData,
              tcpState: {
                ...prevState.visionData.tcpState,
                isShowResultDisconnect: true
              },
            },
          }));



        },
      );
    }
  };



  onChangeIpAddress = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, number: keyof IPAdress) => {
    const { value } = e.target;

    this.setState((prevState: VisionDataState) => ({
      visionData: {
        ...prevState.visionData,
        tcpState: {
          ...prevState.visionData.tcpState,
          ipAddress: { ...prevState.visionData.tcpState.ipAddress, [`${number}`]: value },
        },
      },
    }));
  };


  onChangePort = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { value } = e.target;
    this.setState({
      visionData: {
        ...this.state.visionData,
        tcpState: {
          ...this.state.visionData.tcpState,
          isFocusInput: true,
          port: value,
        },
      },
    })
  };

  onBlur = () => {
    this.VisionInputDB?.update(TABLE_VISIONDB_NAME, {}, {
      VisionInputData: JSON.stringify(this.state.visionData),
    });

    this.VisionInputDB?.query(TABLE_VISIONDB_NAME, TABLE_VISIONDB_COLUMNS, {}).then((queryResult) => {

    });
  };






  readSingal = (res: TcpCommunicationMonitoringData) => {
    const { uniqueId } = this.state.visionData.tcpState;
    if (res.uniqueId !== uniqueId) {


    }
    if (res.uniqueId === uniqueId) {



      if (res?.data) {
        this.setState((prevState: VisionDataState) => ({

          visionData: {
            ...prevState.visionData,
            tcpState: {
              ...prevState.visionData.tcpState,
              readSignal: {
                ...prevState.visionData.tcpState.readSignal,
                statusConnect: true,
                value: arrayToString(res.data),
              },
            },
          },
        }));

        res.data = new Uint8Array(0);

      }
    }
  };


  getShootPoseParam = (newNumbers: SixNumArray) => {
    this.setState
      (
        (prevState: VisionDataState) =>
        (
          {
            visionData:
            {
              ...prevState.visionData,
              ShootPose: newNumbers,
            },
          }
        )
      )
  };




  getVisionPoseParam = (newNumbers: SixNumArray) => {
    this.setState((prevState: VisionDataState) => ({
      visionData: {
        ...prevState.visionData,
        VisionPose: newNumbers,
      },
    }), () => {
      this.onBlur();
    })
  };


  getPickingPoseParam = (newNumbers: SixNumArray) => {
    this.setState((prevState: VisionDataState) => ({
      visionData: {
        ...prevState.visionData,
        PickingPose: newNumbers,
      },
    }));

  };

  updateVisionJob = (jobNumber: number) => {
    this.setState((prevState: VisionDataState) => ({
      visionData: {
        ...prevState.visionData,
        VisionJob: jobNumber,
      },
    }));
  };

  sendCmdTcp = (tcpMsg: string) => {
    this.onClickBtnSend(tcpMsg);

  }

  onClickBtnSend = (message: string) => {

    if (this.state.visionData.tcpState.uniqueId) {
      this.communicationManager.tcpIp
        .sendToServer(this.state.visionData.tcpState.uniqueId, this.encodeASCIIToUint8(message))
        .then((value: boolean) => {

        })
        .catch(() => {

        });
    }
    else {

    }
  };

  encodeASCIIToUint8(text: string): Uint8Array {
    const encoded = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      encoded[i] = text.charCodeAt(i);
    }
    return encoded;
  }

  resetReceivedMsg = () => { };

  render() {

    return (


      <ThemeProvider theme={this.systemTheme}>
      
            <div className={styles["pip-vision-container"]}>
              <div className={styles["ip-address-port-wrapper"]}>
                <div className={styles["ip-address-port-wrap"]}>
                  <div className={styles["ip-address-port-content"]}>
                    <FormControl className={`${styles["ip-address-port-form"]} ${styles["ip-address"]}`}>
                      <div className={styles["status-wrapper"]}>
                        <StatusIcon className={`${styles["status-icon"]} ${styles["disabled"]}`} />
                        <FormLabel>{messages.connect_form_label_001}</FormLabel>
                      </div>
                      <FormGroup row={true}>
                        <TextField value={this.state.visionData.tcpState.ipAddress.input1}
                          onChange={(e) => this.onChangeIpAddress(e, 'input1')}
                          onBlur={this.onBlur}
                          type={"number"} size={"small"}
                        />
                        <TextField value={this.state.visionData.tcpState.ipAddress.input2}
                          onChange={(e) => this.onChangeIpAddress(e, 'input2')}
                          onBlur={this.onBlur}
                          type={"number"} size={"small"}
                        />
                        <TextField value={this.state.visionData.tcpState.ipAddress.input3}
                          onChange={(e) => this.onChangeIpAddress(e, 'input3')}
                          onBlur={this.onBlur}
                          type={"number"} size={"small"}
                        />
                        <TextField value={this.state.visionData.tcpState.ipAddress.input4}
                          onChange={(e) => this.onChangeIpAddress(e, 'input4')}
                          onBlur={this.onBlur}
                          type={"number"} size={"small"}
                        />
                      </FormGroup>
                    </FormControl>
                    <FormControl className={`${styles["ip-address-port-form"]} ${styles["port"]}`}>
                      <FormLabel>{messages.connect_form_label_002}</FormLabel>
                      <FormGroup row={true}>
                        <TextField value={this.state.visionData.tcpState.port} onChange={(e) => this.onChangePort(e)} type={"number"} size={"small"} />
                      </FormGroup>
                    </FormControl>
                  </div>
                  <div className={styles["connect-btn-wrapper"]}>
                    <Button
                      onClick={(_) => this.onConnectAddress()}
                      disabled={this.state.visionData.tcpState.isConnected}
                    >{messages.btn_connect}
                    </Button>
                    <Button
                      onClick={() => this.onDisconnectAddress()}
                      disabled={!this.state.visionData.tcpState.isConnected}
                    >{messages.btn_disconnect}
                    </Button>
                  </div>
                </div>
              </div>

              <VisionJob className ={styles} moduleContext={this.moduleContext} IVisionJob={this.state.visionData.VisionJob} sendMessageTCP={this.sendCmdTcp} receivedMsg={this.state.visionData.tcpState.readSignal.value}  updateVisionJob={this.updateVisionJob} onUpdateDB = {this.onBlur}/>
              <ShootPose moduleContext={this.moduleContext} IshootPose={this.state.visionData.ShootPose} onPoseChange={this.getShootPoseParam} onUpdateDB={this.onBlur} />
                  <VisionPose moduleContext={this.moduleContext} IvisionPose={this.state.visionData.VisionPose} onPoseChange={this.getVisionPoseParam}  sendMessageTCP={this.sendCmdTcp} receivedMsg={this.state.visionData.tcpState.readSignal.value} />
              <PickingPose moduleContext={this.moduleContext} IpickingPose={this.state.visionData.PickingPose} onPoseChange={this.getPickingPoseParam} onUpdateDB={this.onBlur} />
            </div>

         


      </ThemeProvider>




    );
  }


}



