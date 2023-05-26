
import { Button, Divider, FormControl, FormControlLabel, FormGroup, FormLabel, Radio, RadioGroup, TextField } from "@mui/material";
import {
    Context,
    FrameworkModuleStatus,
    ICommunicationManager,
    IModulePackageManager,
    ModuleContext,
    TcpCommunicationMonitoringData,
    TcpCommunicationResult,
    TcpCommunicationType
    //   ModuleContext
} from 'dart-api';
import React, { useEffect, useState } from 'react';



import { IPAdress } from '../type';
import {
    getInitialState,
    arrayToString,
} from '../utils';
import styles from "../assets/styles/styles.scss";
import SensoPartLogo from "../assets/images/sensopart-logo.png";
import { VisionJob } from "./VisionJobMain";
import { Command } from "./Command";
import { CalibrationPoto } from "./CalibrationSenso";
import { messages } from '../messages'

const MAX_RX_LENGTH_4062 = 4062;

export interface VisionViewProps {
    width: number;
    height: number;
    imagefile?: Uint8Array;
    isColor: boolean;
}

export function VisionSettings(props: { moduleContext: ModuleContext }) {


    const [tcpState, setTcpState] = useState(getInitialState());

    const [receivedData, setReceivedData] = useState<string>("");
    const [Mode, setMode] = useState<string>("trigger");
    const handleModeChange = (newMode: string) => {

        if (newMode === "free-run") {
            onClickTriggerBtn("SAP11009000000011")
        } else if (newMode === "trigger") {
            onClickFreeRunBtn("SAP11009000000010")
        }
    };


    const handleChangeMode = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
        setMode(value)
        handleModeChange(value);
    };

    let isImgDataStart: boolean = false;




    const { moduleContext } = props;
    const modulePackageManager = moduleContext.getSystemManager(Context.MODULE_PACKAGE_MANAGER) as IModulePackageManager;
    const communicationManager = moduleContext.getSystemManager(Context.COMMUNICATION_MANAGER) as ICommunicationManager;


    useEffect(() => {
    }, [tcpState.uniqueId])

    useEffect(() => {
    }, [receivedData])

    useEffect(() => {
    }, [tcpState.readSignal.value])

    useEffect(() => {
        if (tcpState.isConnected) {
            communicationManager.tcpIp.tcpClientMessageReceived.register(moduleContext, readSignalValue);
        }
        return () => {
            tcpState.uniqueId && communicationManager.tcpIp.close(tcpState.uniqueId);
            communicationManager.tcpIp.tcpClientMessageReceived.unregister(moduleContext, readSignalValue);
        }
    }, [tcpState.isConnected])
    const onConnectAddress = () => {
        const { input1, input2, input3, input4 } = tcpState.ipAddress;
        const portNum = tcpState.port;
        const ip = [input1, input2, input3, input4].join('.');

        modulePackageManager
            .loadFrameworkModule('com.dart.module.default.tcp', 'TCP')
            .then(({ uniqueId }: { status: FrameworkModuleStatus; uniqueId: number }) => {

                communicationManager.tcpIp.open(uniqueId, TcpCommunicationType.CLIENT, ip, +portNum).then(
                    ({ result }: TcpCommunicationResult) => {

                        if (result === 1) {
                            setTcpState({
                                ...tcpState,
                                uniqueId: uniqueId,
                                isConnected: true,
                            });

                        } else {
                            setTcpState({
                                ...tcpState,
                                isShowResultConnect: true
                            });

                        }
                    },
                    () => {

                        setTcpState({
                            ...tcpState,
                            isShowResultConnect: true
                        });

                    },
                );
            });
    };
    const onDisconnectAddress = () => {
        const { uniqueId } = tcpState;

        if (uniqueId) {
            communicationManager.tcpIp.close(uniqueId).then(
                ({ result }: TcpCommunicationResult) => {

                    if (result === 1) {
                        setTcpState({
                            ...tcpState,
                            isConnected: false
                        });
                    } else {
                        setTcpState({
                            ...tcpState,
                            isShowResultDisconnect: true
                        });
                    }
                },
                () => {
                    setTcpState({
                        ...tcpState,
                        isShowResultDisconnect: true
                    });
                },
            );
        }

        isImgDataStart = false;
    };

    function encodeASCIIToUint8(text: string): Uint8Array {
        const encoded = new Uint8Array(text.length);
        for (let i = 0; i < text.length; i++) {
            encoded[i] = text.charCodeAt(i);
        }
        return encoded;
    }
    let sumRxLength = 0;
    const recievedDataArray = new Uint8Array(new ArrayBuffer(1440 * 1080));


    const readSignalValue = (res: TcpCommunicationMonitoringData) => {
        const { readSignal } = tcpState;
        const { uniqueId } = tcpState;


        if (res.uniqueId !== uniqueId) {


        }
        if (res.uniqueId === uniqueId) {


            if (res.data && readSignal.value !== res.data) {


                if (new TextDecoder().decode(res.data).slice(0, 4) === 'GIMP') {

                    isImgDataStart = true;
                    sumRxLength = 0;

                }
                else if (new TextDecoder().decode(res.data).slice(0, 4) === 'SAPF039') {

                }

                else {

                    if (isImgDataStart) {
                        if (
                            sumRxLength / MAX_RX_LENGTH_4062 <
                            Math.floor(res.totalLength / MAX_RX_LENGTH_4062)
                        ) {
                            recievedDataArray.set(res.data, sumRxLength);
                            sumRxLength += MAX_RX_LENGTH_4062;

                        } else {


                            recievedDataArray.set(res.data.slice(0, res.totalLength % MAX_RX_LENGTH_4062), sumRxLength);
                            sumRxLength += res.totalLength % MAX_RX_LENGTH_4062;

                        }


                    } else {


                    }
                }

                setTcpState((tcpState) => ({
                    ...tcpState,
                    readSignal: {
                        ...tcpState.readSignal,
                        statusConnect: true,
                        value: res.data,
                    }
                }));

                setReceivedData(arrayToString(res.data));
                res.data = new Uint8Array(0);

            }
            else if (res.data && readSignal.value !== res.data) {


            }
        }
    };

    const onClickBtnSend = (message: string) => {

        if (tcpState.uniqueId) {
            communicationManager.tcpIp
                .sendToServer(tcpState.uniqueId, encodeASCIIToUint8(message))
                .then((value: boolean) => {

                })
                .catch(() => {

                });
        }
        else {

        }
    };

    const resetReceivedMsg = () => {



        setReceivedData("");



    }

    const sendCmdTcp = (tcpMsg: string) => {
        onClickBtnSend(tcpMsg);


    }

    const onClickAutoFocusBtn = (tcpMsg: string) => {

        onClickBtnSend(tcpMsg);

    }

    const onClickAutoExposureBtn = (tcpMsg: string) => {

        onClickBtnSend(tcpMsg);

    }
    const onClickTriggerBtn = (tcpMsg: string) => {

        onClickBtnSend(tcpMsg);

    }
    const onClickFreeRunBtn = (tcpMsg: string) => {

        onClickBtnSend(tcpMsg);

    }
    const onChangeIpAddress = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, number: keyof IPAdress) => {
        const { value } = e.target;
        setTcpState({
            ...tcpState,
            ipAddress: { ...tcpState.ipAddress, [`${number}`]: value },
        });
    };
    const onChangePort = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { value } = e.target;
        setTcpState({
            ...tcpState,
            port: value,
        });
    };

    return (

        <div >
           
                    <div className={styles["vision-container"]}>
                        {/* <VisionSetting moduleContext={this.moduleContext} /> */}
                        <div className={styles["vision-wrapper"]}>
                            <div className={styles["vision-content"]}>
                                <div className={styles["left-container"]}>
                                    <div className={styles["camera-view-wrapper"]}>
                                        {/* camera view area */}
                                        {/* <CameraView width={1440} height={1080} imagefile={fullImgData} isColor={false}/> */}

                                    </div>

                                    <div className={styles["camera-btn-wrapper"]}>
                                        <Button onClick={() => onClickAutoFocusBtn("AFC11100500")} color={"secondary"} size={"small"} className={styles["camera-btn"]}>Auto Focus</Button>
                                        <Button onClick={() => onClickAutoExposureBtn("ASH11")} color={"secondary"} size={"small"} className={styles["camera-btn"]}>Auto Exposure</Button>
                                    </div>
                                </div>
                                <div className={styles["right-container"]}>
                                    {/* <TCPConnection/> */}
                                    <div className={styles["device-connect-wrapper"]}>
                                        <div className={styles["device-connect-wrap"]}>
                                            <div className={styles["device-connect-img-wrapper"]}>
                                                <img src={SensoPartLogo} alt="SENSOPART LOGO" />
                                            </div>
                                            <div className={styles["device-connect-box"]}>
                                                <TextField defaultValue={"Sensopart Visor Robotic"} size={"small"} fullWidth={false} InputProps={{ readOnly: true }} />
                                                <div className={styles["connect-btn-wrapper"]}>
                                                    <Button size={"small"}
                                                        onClick={(_) => onConnectAddress()}
                                                        disabled={tcpState.isConnected}
                                                    >Connect</Button>
                                                    <Button size={"small"}
                                                        onClick={() => onDisconnectAddress()}
                                                        disabled={!tcpState.isConnected}
                                                    >Disconnect</Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles["ip-address-port-wrapper"]}>
                                        <FormControl className={`${styles["ip-address-port-wrap"]} ${styles["ip-address"]}`}>
                                            <FormLabel>IP Address</FormLabel>
                                            <FormGroup row={true}>
                                                <TextField value={tcpState.ipAddress.input1} onChange={(e) => onChangeIpAddress(e, 'input1')} type={"number"} size={"small"} />
                                                <TextField value={tcpState.ipAddress.input2} onChange={(e) => onChangeIpAddress(e, 'input2')} type={"number"} size={"small"} />
                                                <TextField value={tcpState.ipAddress.input3} onChange={(e) => onChangeIpAddress(e, 'input3')} type={"number"} size={"small"} />
                                                <TextField value={tcpState.ipAddress.input4} onChange={(e) => onChangeIpAddress(e, 'input4')} type={"number"} size={"small"} />
                                            </FormGroup>
                                        </FormControl>
                                        <FormControl className={`${styles["ip-address-port-wrap"]} ${styles["port"]}`}>
                                            <FormLabel>Port</FormLabel>
                                            <FormGroup row={true}>
                                                <TextField value={tcpState.port} onChange={(e) => onChangePort(e)} type={"number"} size={"small"} />
                                            </FormGroup>
                                        </FormControl>

                                    </div>
                                    {/* <TCPClient/> */}
                                    <div className={styles["option-contents"]}>
                                        <FormControl className={styles["option-mode-wrap"]}>
                                            <FormLabel>Mode</FormLabel>
                                            <RadioGroup
                                                defaultValue={"free-run"}
                                                row={true}
                                                onChange={handleChangeMode}
                                                value={Mode}
                                            >
                                                <FormControlLabel
                                                    value={"free-run"}
                                                    control={<Radio />}
                                                    label={"free-run"} />
                                                <FormControlLabel
                                                    value={"trigger"}
                                                    control={<Radio />}
                                                    label={"Trigger"} />
                                            </RadioGroup>
                                        </FormControl>
                                        <Divider />

                                        <VisionJob className={styles} moduleContext={moduleContext} sendMessageTCP={sendCmdTcp} receivedMsg={receivedData} />
                                        <Divider />

                                        <Command sendMessageTCP={sendCmdTcp} receivedMsg={receivedData} resetReceivedMsg={resetReceivedMsg} />
                                        <Divider />


                                        <CalibrationPoto moduleContext={moduleContext} tcpState={tcpState} />
                                        <Divider />

                                    </div>
                                </div>
                            </div>
                            <section className={styles["wrapper_btn_bottom"]}>
                                {/* <Button size={"small"} disabled={true} variant={"outlined"} color={"primary"} >Save</Button> */}
                            </section>
                        </div>
                    </div>
                
          
        </div>

    );
}

