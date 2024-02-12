import React, { useRef, useState, useEffect } from "react";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Toast } from 'dart-api';
import { Button, FormControl, FormGroup, FormLabel, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";
import styles from "../assets/styles/styles.scss";
import { messages } from '../messages'



interface CommandProps {
    sendMessageTCP: (tcpMsg: string) => void;
    receivedMsg: string;
    resetReceivedMsg: () => void;
}
export function Command({ sendMessageTCP, receivedMsg, resetReceivedMsg }: CommandProps) {
    const [txCmd, setTxCmd] = useState<string>('TRG');

    const handleChange = (e: SelectChangeEvent) => {

        setTxCmd(e.target.value as string);
    };

    const inputRef = useRef<HTMLInputElement>(null);
    const inputMutiLineRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (inputMutiLineRef.current) {
            inputMutiLineRef.current.value = receivedMsg;

        }
    }, [receivedMsg]);


    const sendTextCmd = () => {
        const message = inputRef.current?.value ? txCmd + inputRef.current?.value : txCmd;

        sendMessageTCP(message);

        if (inputMutiLineRef.current) {
            inputMutiLineRef.current.value = receivedMsg;
        }

    }



    const handleResetClick = () => {

        resetReceivedMsg();

        if (inputMutiLineRef.current) {
            inputMutiLineRef.current.value = "";
        }


    };




    const onCopySuccess = (isCopied: boolean) => {

        if (isCopied) {
            Toast.show(0, 'confirmation', 'Command Result Copied');
        }
    };


    return (
        <FormControl size={"small"} className={styles["option-command-wrap"]}>
            <FormLabel disabled={false}>Command</FormLabel>
            <FormGroup row={true} className={styles["command-box"]}>
                <div className={styles["command-inner-box"]}>
                    <Select
                        onChange={handleChange}
                        renderValue={
                            value => value?.length ?
                                Array.isArray(value) ?
                                    value.join(', ') : value
                                : <div className={styles["place-holder"]}>Select Command</div>
                        } disabled={false}>

                        {/* vision.module.twodimensional control */}
                        <MenuItem value={''}></MenuItem>
                        <MenuItem value={'TRG'}>TRG</MenuItem>
                        <MenuItem value={'TRX'}>TRX</MenuItem>
                        <MenuItem value={'AFC'}>AFC</MenuItem>
                        <MenuItem value={'ASH'}>ASH</MenuItem>
                        <MenuItem value={'CJB'}>CJB</MenuItem>
                        <MenuItem value={'GIM0'}>GIM0</MenuItem>
                        <MenuItem value={'GIM1'}>GIM1</MenuItem>

                        {/* vision.module.twodimensional Job Setting */}
                        <MenuItem value={'GJL'}>GJL</MenuItem>
                        <MenuItem value={'GDL'}>GDL</MenuItem>

                        {/* vision.module.twodimensional Calibration */}
                        <MenuItem value={'CCD'}>CCD</MenuItem>
                        <MenuItem value={'CAI'}>CAI</MenuItem>
                        <MenuItem value={'CRP'}>CRP</MenuItem>
                        <MenuItem value={'CSP'}>CSP</MenuItem>
                        <MenuItem value={'CGP'}>CGP</MenuItem>

                        {/* vision.module.twodimensional Service */}
                        <MenuItem value={'GSI'}>GSI</MenuItem>
                        <MenuItem value={'SJS'}>SJS</MenuItem>
                        <MenuItem value={'GJS'}>GJS</MenuItem>

                    </Select>
                    <TextField inputRef={inputRef} placeholder={"Enter data"} size={"small"} disabled={false} />
                    <Button color={"secondary"} size={"small"} disabled={false}
                        onClick={() => sendTextCmd()}>Send</Button>
                </div>
                <div className={styles["multiline-btn-wrapper"]}>
                    <TextField inputRef={inputMutiLineRef} multiline={true} rows={7} fullWidth={true} placeholder={"Results are displayed here."} disabled={!receivedMsg} InputProps={{ readOnly: true }} />
                    <div className={styles["multiline-btn-wrap"]}>
                        <Button color={"secondary"} size={"small"} onClick={() => handleResetClick()} disabled={!receivedMsg} >Reset</Button>

                        <CopyToClipboard
                            text={receivedMsg}
                            onCopy={(_: string, result: boolean) => onCopySuccess(result)}
                            data-testid="copy-to-clipboard"
                        >
                            <Button color={"secondary"} disabled={!receivedMsg} size={"small"}>Copy</Button>
                        </CopyToClipboard>
                    </div>
                </div>
            </FormGroup>
        </FormControl>
    );
}
