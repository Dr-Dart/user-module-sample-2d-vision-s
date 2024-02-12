import React from "react";
import { ModuleContext, ProgramState, MonitoringVariable } from 'dart-api';
import { Button, FormControl, FormGroup, FormLabel, InputAdornment, Stack, TextField, Typography, Divider, MenuItem, Select, SelectChangeEvent  } from "@mui/material";
import styles from "../assets/styles/styles.scss";
import IcnGetPose from "../assets/images/icon_get_pose.svg";
import IcnMoveTo from "../assets/images/icon_move_to.svg";
import IcnReset from "../assets/images/icon_reset.svg";
import IcnPaste from "../assets/images/icon_paste.svg"
import IcnCopy from "../assets/images/icon_copy.svg";
import IcnTrash from "../assets/images/icon_trash.svg";
import IcnAdd from "../assets/images/icon_add.svg";
import { TCPClientState } from '../type';
import { messages } from '../messages'



import { useState, useEffect, useRef } from 'react';
//pose 
import { logger, RobotSpace, Context, IToast,Toast,StopType,IRobotManager,IProgramManager, IPositionManager, IMotionManager, SixNumArray } from "dart-api";

//drl 
import { DRL_Calibration_run } from "../drl/DRL_Calibration_run"

//database 
import { IDartDatabase } from 'dart-api';

declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    longPressed: true;
  }
}

interface visionProps {
  moduleContext: ModuleContext;
  tcpState: TCPClientState;
}



export interface LogInfo {

  timestamp: string;
  message: string;

}
export const formatDateToString = (date: Date) => {
  const formatLengthForAll = 2;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(formatLengthForAll, '0');
  const day = String(date.getDate()).padStart(formatLengthForAll, '0');
  const hour = String(date.getHours()).padStart(formatLengthForAll, '0');
  const minute = String(date.getMinutes()).padStart(formatLengthForAll, '0');
  const second = String(date.getSeconds()).padStart(formatLengthForAll, '0');
  return `${year}.${month}.${day} ${hour}:${minute}:${second}`;

};


const TABLE_VISIONDB_NAME = 'VisionDB';
const TABLE_VISIONDB_COLUMNS = ['visionDBId', 'CalibrationPoseData', 'VisionInputData'];




export function CalibrationPoto(props: visionProps) {

  const { packageName } = props.moduleContext;

  const database = props.moduleContext.getSystemLibrary(Context.DART_DATABASE) as IDartDatabase;

  const { input1, input2, input3, input4 } = props.tcpState.ipAddress;
  const portIN = props.tcpState.port;
  const camera_ip = [input1, input2, input3, input4].join('.');


  const calibData = [[-87.7, -17.11, 96.43, 0, 100.68, -17.7],
  [-151.09, -58.19, 120.77, 23.69, 104.51, -39.01],
  [-26.28, 24.22, 69.07, -20.58, 122.3, 31.21],
  [-51.64, 37.25, 38.25, -12.86, 133.87, 29.93],
  [-114.72, 35.24, 42.48, 185.88, -130.5, 74.62],
  [-146.27, 2.18, 84.98, 33.13, 113.59, 12.83],
  [-150.73, -58.77, 109.49, 18.4, 101.42, -101.15],
  [-57.94, 35.91, 46.21, -15.15, 133.99, 29.93],
  [-118.88, 35.36, 42.09, 185.88, -131.74, 113.52],
  [-159.18, 2.56, 96.86, 21.28, 99.56, -100.79]
  ];

  const convertToSixNumArray = (arr: number[][]): SixNumArray[] => {
    return arr.map((subArray) => {
      if (subArray.length !== 6) {
        throw new Error("Each subarray must contain exactly 6 elements.");
      }
      return [subArray[0], subArray[1], subArray[2], subArray[3], subArray[4], subArray[5]] as SixNumArray;
    });
  };
  const calibDataSixNum = convertToSixNumArray(calibData);

  const initCalibrationData = {
    Calpose1: calibDataSixNum[0],
    Calpose2: calibDataSixNum[1],
    Calpose3: calibDataSixNum[2],
    Calpose4: calibDataSixNum[3],
    Calpose5: calibDataSixNum[4],
    Calpose6: calibDataSixNum[5],
    Calpose7: calibDataSixNum[6]
  };

  const [calibrationPoses, setCalibrationPoses] = useState(initCalibrationData);

  useEffect(() => {
    const handleData = (data) => {
      if (data && data.Calpose1 && data.Calpose2 && data.Calpose3 && data.Calpose4 && data.Calpose5 && data.Calpose6 && data.Calpose7) {
  
        setCalibrationPoses({
          Calpose1: data.Calpose1 as SixNumArray,
          Calpose2: data.Calpose2 as SixNumArray,
          Calpose3: data.Calpose3 as SixNumArray,
          Calpose4: data.Calpose4 as SixNumArray,
          Calpose5: data.Calpose5 as SixNumArray,
          Calpose6: data.Calpose6 as SixNumArray,
          Calpose7: data.Calpose7 as SixNumArray,
        });
      } else {
    
        setCalibrationPoses(initCalibrationData);
      }
    };

    const fetchData = async () => {
      try {
        const data = await get(database);
        if (data === null) {
     
        } else {
          handleData(data);
        }
      } catch (error) {

      }
    };

    fetchData();
  }, []);


  const positionManager = props.moduleContext.getSystemManager(Context.POSITION_MANAGER) as IPositionManager;
  const motionManager = props.moduleContext.getSystemManager(Context.MOTION_MANAGER) as IMotionManager;
  const programManager = props.moduleContext.getSystemManager(Context.PROGRAM_MANAGER) as IProgramManager;
  const robotManager = props.moduleContext.getSystemManager(Context.ROBOT_MANAGER) as IRobotManager;
    
  const [isServoOn, setServoOn] = useState(robotManager.servoState.value);

  useEffect(() => {
    const servoStateCallback = (data: any) => {
      setServoOn(data);
    };
    robotManager.servoState.register(props.moduleContext, servoStateCallback);

    return () => {
      robotManager.servoState.unregister(props.moduleContext, servoStateCallback);
    };
  }, []);

  const [commentLog, setCommentLog] = useState<LogInfo[]>([]);
  const scrollableDivRef = useRef(null);

  useEffect(() => {
    if (scrollableDivRef.current) {
      scrollableDivRef.current.scrollTop = scrollableDivRef.current.scrollHeight;
    }
  }, [commentLog]);

  useEffect(() => {


    programManager.userLog.register(props.moduleContext, onWatchCommentLog);


    return () => {

      programManager.userLog.unregister(props.moduleContext, onWatchCommentLog);
    };
  }, []);




  const onWatchCommentLog = (cmt: string) => {
    reformatCommentLog(cmt);
  };

  const reformatCommentLog = (cmt: string) => {



    const currentTime = new Date();
    const commentInfo = getCommentLogInfo(currentTime, cmt);
    setCommentLog((prevcommentLog) => [
      {
        ...commentInfo,
        message: cmt,
      }

      , ...prevcommentLog]);


  };

  const getCommentLogInfo = (date: Date, message: string) => {
    const logInfo: LogInfo = {

      timestamp: formatDateToString(date),
      message: ""

    };
    return logInfo;
  };
  const [inputValues, setInputValues] = useState({
    Calpose1: calibrationPoses.Calpose1.map(val => val.toFixed(2)),
    Calpose2: calibrationPoses.Calpose2.map(val => val.toFixed(2)),
    Calpose3: calibrationPoses.Calpose3.map(val => val.toFixed(2)),
    Calpose4: calibrationPoses.Calpose4.map(val => val.toFixed(2)),
    Calpose5: calibrationPoses.Calpose5.map(val => val.toFixed(2)),
    Calpose6: calibrationPoses.Calpose6.map(val => val.toFixed(2)),
    Calpose7: calibrationPoses.Calpose7.map(val => val.toFixed(2))
  });

  useEffect(() => {
    setInputValues(prevValues => ({
      ...prevValues,
      Calpose1: calibrationPoses.Calpose1.map(val => val.toFixed(2)),
      Calpose2: calibrationPoses.Calpose2.map(val => val.toFixed(2)),
      Calpose3: calibrationPoses.Calpose3.map(val => val.toFixed(2)),
      Calpose4: calibrationPoses.Calpose4.map(val => val.toFixed(2)),
      Calpose5: calibrationPoses.Calpose5.map(val => val.toFixed(2)),
      Calpose6: calibrationPoses.Calpose6.map(val => val.toFixed(2)),
      Calpose7: calibrationPoses.Calpose7.map(val => val.toFixed(2))
    }));

    updateAndQuery();
  }, [calibrationPoses]);


  const MOVE_J_DEFAULT = {
    targetVelocity: 60,
    targetAcceleration: 100,
    targetTime: 0,
    moveMode: 0,
    blendingRadius: 0,
    blendingType: 0,
  };

  const [item, setItem] = useState('');
  async function update(database: IDartDatabase, item): Promise<boolean> {
    try {
  
      await database.update(TABLE_VISIONDB_NAME, {}, { CalibrationPoseData: JSON.stringify(item) });

      return true;
    } catch (error) {
    
      return false;
    }
  }
  const updateAndQuery = async () => {
    try {
      const item = {
        Calpose1: calibrationPoses.Calpose1,
        Calpose2: calibrationPoses.Calpose2,
        Calpose3: calibrationPoses.Calpose3,
        Calpose4: calibrationPoses.Calpose4,
        Calpose5: calibrationPoses.Calpose5,
        Calpose6: calibrationPoses.Calpose6,
        Calpose7: calibrationPoses.Calpose7,
      };

      await update(database, item);

      const data = await get(database);
      if (Object.keys(data).length === 0) {
   
      } else {
 
      }
    } catch (error) {

    }
  };



  async function get(database: IDartDatabase): Promise<any> {
    return new Promise<any>((resolve) => {
      database?.query(TABLE_VISIONDB_NAME, TABLE_VISIONDB_COLUMNS, {})
        .then((queryResult) => {
       
          if (queryResult?.length === 0) {

            resolve({});
          } else {
            const parsedCalibrationData = JSON.parse(queryResult[0].data.CalibrationPoseData);
            if (parsedCalibrationData !== JSON.stringify(calibrationPoses)) {
        
            }
      
            resolve(parsedCalibrationData);
          }
        });
    });
  }

  function GetPoseClick(num: number) {
    positionManager.getCurrentPos(RobotSpace.JOINT).then((pos) => {
      const poseKeys = ['Calpose1', 'Calpose2', 'Calpose3', 'Calpose4', 'Calpose5', 'Calpose6', 'Calpose7'];

      if (poseKeys[num]) {
        setCalibrationPoses(prevPoses => ({
          ...prevPoses,
          [poseKeys[num]]: pos,
        }));
      }
      updateAndQuery()
    });
  }

  function moveToPosition(e: React.MouseEvent<HTMLButtonElement>, num: number): void
  {
    const idPrefix = `calpose${num + 1}_j`;
    
    const tmp1 = document.getElementById(`${idPrefix}1`);
    const tmp2 = document.getElementById(`${idPrefix}2`);
    const tmp3 = document.getElementById(`${idPrefix}3`);
    const tmp4 = document.getElementById(`${idPrefix}4`);
    const tmp5 = document.getElementById(`${idPrefix}5`);
    const tmp6 = document.getElementById(`${idPrefix}6`);


    const poseKeys = ['Calpose1', 'Calpose2', 'Calpose3', 'Calpose4', 'Calpose5', 'Calpose6', 'Calpose7'];
    const arrtmp: SixNumArray = [
      parseFloat(tmp1?.value || '0'),
      parseFloat(tmp2?.value || '0'),
      parseFloat(tmp3?.value || '0'),
      parseFloat(tmp4?.value || '0'),
      parseFloat(tmp5?.value || '0'),
      parseFloat(tmp6?.value || '0')

    ];


    const MOVE_J = {
      targetVelocity: MOVE_J_DEFAULT.targetVelocity,
      targetAcceleration: MOVE_J_DEFAULT.targetAcceleration,
      targetTime: MOVE_J_DEFAULT.targetTime,
      moveMode: MOVE_J_DEFAULT.moveMode,
      blendingRadius: MOVE_J_DEFAULT.blendingRadius,
      blendingType: MOVE_J_DEFAULT.blendingType
    };

    if (poseKeys[num]) {
      setCalibrationPoses(prevPoses => ({
        ...prevPoses,
        [poseKeys[num]]: arrtmp,
      }));
    }
    

    if (isServoOn) {
      if (!arrtmp.some((value) => value === null || value === undefined)) {
        if (motionManager) {
          motionManager.moveJoint(
            arrtmp,
            MOVE_J.targetVelocity,
            MOVE_J.targetAcceleration,
            MOVE_J.targetTime,
            MOVE_J.moveMode,
            MOVE_J.blendingRadius,
            MOVE_J.blendingType

          );
        }
      }
    }  else{
      Toast.show(IToast.TYPE_ERROR, 'Move Fail', 'Please Servo On...', false)
    }



  }


  function stopMoveToPosition(e: React.SyntheticEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (isServoOn) {
      motionManager?.moveStop(StopType.SLOW);
    }
  };
  


  function CopyClick(index: number) {
    const calposes = [inputValues.Calpose1, inputValues.Calpose2, inputValues.Calpose3, inputValues.Calpose4, inputValues.Calpose5, inputValues.Calpose6, inputValues.Calpose7];

    if (calposes[index]) {
      const coordinates = [...calposes[index]];
      const coordinatesString = '[' + coordinates.join(', ') + ']';


      navigator.clipboard.writeText(coordinatesString).then(
        () => {
     
        },
        (err) => {
    
        },
      );
    }
  }



  function ResetClick(num: number) {
    const poseKeys = ['Calpose1', 'Calpose2', 'Calpose3', 'Calpose4', 'Calpose5', 'Calpose6', 'Calpose7'];
    if (poseKeys[num]) {
      setCalibrationPoses(prevPoses => ({
        ...prevPoses,
        [poseKeys[num]]: [0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
      }));
    }
  }
  const setCalpose = (index: number, data: SixNumArray) => {
    const poseKeys = ['Calpose1', 'Calpose2', 'Calpose3', 'Calpose4', 'Calpose5', 'Calpose6', 'Calpose7'];
    if (poseKeys[index]) {
      setCalibrationPoses(prevPoses => ({
        ...prevPoses,
        [poseKeys[index]]: data,
      }));
    } else {
    
    }
  };


  const handlePasteFromClipboard = async (index: number) => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const clipboardArray = JSON.parse(clipboardText);

      if (
        Array.isArray(clipboardArray) &&
        clipboardArray.length === 6 &&
        clipboardArray.every((item) => typeof item === 'number')
      ) {
        setCalpose(index, clipboardArray as SixNumArray);


      } else {
 
      }
    } catch (error) {

    }
  };

  function CalibrationResultCallback(variable: MonitoringVariable[]) {


    reformatCommentLog(variable[0].data)


  }

  function RunCalibraiton() {
    // drl input variable
    var DRL_tmp = DRL_Calibration_run
    const monitoringVar: MonitoringVariable[] = [];



    let calibration_positions = [];
    for (let i = 1; i <= 7; i++) {
      let joint_positions = [];
      for (let j = 1; j <= 6; j++) {
        const tmp = document.getElementById(`calpose${i}_j${j}`);
        joint_positions.push(parseFloat(tmp?.value || '0'));
      }
      calibration_positions.push(`posj(${joint_positions.join(",")})`);
    }
    var DRL_input_var =
      `portIN = ${JSON.stringify(portIN) + '\r'}
camera_ip = ${JSON.stringify(camera_ip) + '\r'}
calibration_positions = [${calibration_positions.join(",")}]
`
    DRL_tmp = DRL_input_var + DRL_tmp

   

    monitoringVar.push({ data: 'test', division: 1, name: 'monitoringReadData', type: 3 })
    programManager.monitoringVariables.register(props.moduleContext, CalibrationResultCallback);
    const unregistVariableMonitor = (programState: ProgramState) => {

      if (programState !== ProgramState.STOP)
        return;
    
      programManager.monitoringVariables.unregister(props.moduleContext, CalibrationResultCallback);
      programManager.programState.unregister(props.moduleContext, unregistVariableMonitor);
    }
    programManager.programState.register(props.moduleContext, unregistVariableMonitor);


    programManager.runProgram(DRL_tmp, null, monitoringVar, false)
      .then(result => {
        if (result) {
          logger.info("Successfully run program.");
        } else {
          logger.warn(`Failed to run program.`);
        }
      })
      .catch((e: Error) => {
        logger.warn(`Failed to run program by ${e}.`);
      });
  }

  const handleInputChange = (id: keyof typeof inputValues, index: number, value: string) => {
    setInputValues(prevValues => ({
      ...prevValues,
      [id]: prevValues[id].map((val, i) => (i === index ? value : val)),
    }));
  };

  
  const handleChangeModule = (event: SelectChangeEvent) => {
    setItem(event.target.value as string);
}
  return (


    <FormControl className={styles["option-calibration-wrap"]}>
      <FormLabel disabled={false}>{messages.form_label_004}</FormLabel>
      <FormGroup>
      {/* <FormGroup row={true} className={styles["calibration-select-wrapper"]}>
    <Select size={"small"} value={item} onChange={handleChangeModule} displayEmpty={true}
            renderValue={item !== "" ? undefined : () => (
              <span className={styles["place-holder"]}>Select calibration method</span>
            )}>
            <MenuItem className={styles["no-value"]} value={""}>{messages.select_placeholder_004}</MenuItem>
            //<MenuItem value={1}>method 1</MenuItem>
            //<MenuItem value={2}>method 2</MenuItem>
          </Select>
          
          <Button color={"secondary"} disabled={false}>{messages.btn_apply}</Button>
          </FormGroup>
          <FormGroup row={true} className={styles["calibration-select-wrapper"]}>
          <Select size={"small"} value={item} onChange={handleChangeModule} displayEmpty={true}
            renderValue={item !== "" ? undefined : () => (
              <span className={styles["place-holder"]}>Select calibration plate </span>
            )}>
            <MenuItem className={styles["no-value"]} value={""}>{messages.select_placeholder_005}</MenuItem>
            //<MenuItem value={1}>plate 1</MenuItem>
            //<MenuItem value={2}>plate 2</MenuItem>
          </Select>
          <Button color={"secondary"} disabled={false}>{messages.btn_apply}</Button>
          </FormGroup>

        <FormGroup row={true} className={styles["calibration_textfield-wrapper"]}>
          <TextField
            id="z_offset"
            disabled={false}
            size="small"
            defaultValue=""
            type="number"
            className={styles["calibration_textfield"]}
            InputProps={{
              startAdornment: (
                <InputAdornment
                  position="start"
                  className={styles["textfield-start-adornment"]}
                >
                  <span className={styles["adornment-content"]}>Z-Offset</span>
                </InputAdornment>
              ),
              endAdornment: <InputAdornment position="end">mm</InputAdornment>,
            }}
          />
        </FormGroup>

        <FormGroup row={true} className={styles["calibration_textfield-wrapper"]}>
          <TextField
            id="focal_length"
            disabled={false}
            size="small"
            defaultValue=""
            type="number"
            className={styles["calibration_textfield"]}
            InputProps={{
              startAdornment: (
                <InputAdornment
                  position="start"
                  className={styles["textfield-start-adornment"]}
                >
                  <span className={styles["adornment-content"]}>Focal length</span>
                </InputAdornment>
              ),
              endAdornment: <InputAdornment position="end">mm</InputAdornment>,
            }}
          />
        </FormGroup>
             */}
        <Stack direction={"column"} className={styles["point-group"]}>
          {/* Point 1 Start */}
          <Stack direction={"column"} spacing={1} className={styles["pose-control"]}>
            <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}
              flexWrap={"wrap"} className={styles["pose-control-title"]}>
              <Typography variant={"subtitle1"}>{messages.pose_text_001}</Typography>
              <Stack direction={"row"} spacing={1} className={styles["pose-control-btn"]}>
                <Button onClick={(event) => { event.stopPropagation(); GetPoseClick(0) }} color={"primary"} size={"small"} disabled={false} startIcon={<IcnGetPose />}>{messages.btn_get_pose}</Button>
                <Button
                  onMouseDown={(e) => moveToPosition(e, 0)}
                  onMouseUp={stopMoveToPosition}
                  onMouseLeave={stopMoveToPosition}
                color={"primary"} size={"small"} disabled={false} variant={"longPressed"} startIcon={<IcnMoveTo />}>{messages.btn_move_to}</Button>
                <Button onClick={(event) => { event.stopPropagation(); ResetClick(0) }} color={"secondary"} size={"small"} disabled={false}><IcnReset /></Button>

                <Divider flexItem={true} orientation={"vertical"} />
                <Button onClick={(event) => { event.stopPropagation(); CopyClick(0) }} color={"secondary"} size={"small"} disabled={false}><IcnCopy /></Button>
                <Button onClick={(event) => { event.stopPropagation(); handlePasteFromClipboard(0) }} color={"secondary"} size={"small"} disabled={false}><IcnPaste /></Button>
          
              </Stack>
            </Stack>
            <Stack direction={"row"} className={styles["pose-control-task"]}>
              <TextField id='calpose1_j1' value={inputValues.Calpose1[0]} onChange={(e) => handleInputChange("Calpose1", 0, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J1</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose1_j2' value={inputValues.Calpose1[1]} onChange={(e) => handleInputChange("Calpose1", 1, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J2</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose1_j3' value={inputValues.Calpose1[2]} onChange={(e) => handleInputChange("Calpose1", 2, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J3</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose1_j4' value={inputValues.Calpose1[3]} onChange={(e) => handleInputChange("Calpose1", 3, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J4</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose1_j5' value={inputValues.Calpose1[4]} onChange={(e) => handleInputChange("Calpose1", 4, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J5</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose1_j6' value={inputValues.Calpose1[5]} onChange={(e) => handleInputChange("Calpose1", 5, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J6</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
            </Stack>
          </Stack>
          {/* Point 1 End */}




          {/* Point 2 Start */}
          <Stack direction={"column"} spacing={1} className={styles["pose-control"]}>
            <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}
              flexWrap={"wrap"} className={styles["pose-control-title"]}>
              <Typography variant={"subtitle1"}>{messages.pose_text_002}</Typography>
              <Stack direction={"row"} spacing={1} className={styles["pose-control-btn"]}>
                <Button onClick={(event) => { event.stopPropagation(); GetPoseClick(1) }} color={"primary"} size={"small"} disabled={false} startIcon={<IcnGetPose />}>{messages.btn_get_pose}</Button>
                <Button 
                 onMouseDown={(e) => moveToPosition(e, 1)}
                 onMouseUp={stopMoveToPosition}
                 onMouseLeave={stopMoveToPosition}
                color={"primary"} size={"small"} disabled={false} variant={"longPressed"} startIcon={<IcnMoveTo />}>{messages.btn_move_to}</Button>
                <Button onClick={(event) => { event.stopPropagation(); ResetClick(1) }} color={"secondary"} size={"small"} disabled={false}><IcnReset /></Button>
                <Divider flexItem={true} orientation={"vertical"} />
                <Button onClick={(event) => { event.stopPropagation(); CopyClick(1) }} color={"secondary"} size={"small"} disabled={false}><IcnCopy /></Button>
                <Button onClick={(event) => { event.stopPropagation(); handlePasteFromClipboard(1) }} color={"secondary"} size={"small"} disabled={false}><IcnPaste /> </Button>

               
              </Stack>
            </Stack>
            <Stack direction={"row"} className={styles["pose-control-task"]}>
              <TextField id='calpose2_j1' value={inputValues.Calpose2[0]} onChange={(e) => handleInputChange("Calpose2", 0, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J1</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose2_j2' value={inputValues.Calpose2[1]} onChange={(e) => handleInputChange("Calpose2", 1, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J2</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose2_j3' value={inputValues.Calpose2[2]} onChange={(e) => handleInputChange("Calpose2", 2, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J3</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose2_j4' value={inputValues.Calpose2[3]} onChange={(e) => handleInputChange("Calpose2", 3, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J4</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose2_j5' value={inputValues.Calpose2[4]} onChange={(e) => handleInputChange("Calpose2", 4, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J5</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose2_j6' value={inputValues.Calpose2[5]} onChange={(e) => handleInputChange("Calpose2", 5, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J6</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
            </Stack>
          </Stack>
          {/* Point 2 End */}


          {/* Point 3 Start */}
          <Stack direction={"column"} spacing={1} className={styles["pose-control"]}>
            <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}
              flexWrap={"wrap"} className={styles["pose-control-title"]}>
              <Typography variant={"subtitle1"}>{messages.pose_text_003}</Typography>
              <Stack direction={"row"} spacing={1} className={styles["pose-control-btn"]}>
                <Button onClick={(event) => { event.stopPropagation(); GetPoseClick(2) }} color={"primary"} size={"small"} disabled={false} startIcon={<IcnGetPose />}>{messages.btn_get_pose}</Button>
                <Button                   
                  onMouseDown={(e) => moveToPosition(e, 2)}
                  onMouseUp={stopMoveToPosition}
                  onMouseLeave={stopMoveToPosition}
                 color={"primary"} size={"small"} disabled={false} variant={"longPressed"} startIcon={<IcnMoveTo />}>{messages.btn_move_to}</Button>
                <Button onClick={(event) => { event.stopPropagation(); ResetClick(2) }} color={"secondary"} size={"small"} disabled={false}><IcnReset /></Button>
                <Divider flexItem={true} orientation={"vertical"} />
                <Button onClick={(event) => { event.stopPropagation(); CopyClick(2) }} color={"secondary"} size={"small"} disabled={false}><IcnCopy /></Button>
                <Button onClick={(event) => { event.stopPropagation(); handlePasteFromClipboard(2) }} color={"secondary"} size={"small"} disabled={false}><IcnPaste /></Button>

              </Stack>
            </Stack>
            <Stack direction={"row"} className={styles["pose-control-task"]}>
              <TextField id='calpose3_j1' value={inputValues.Calpose3[0]} onChange={(e) => handleInputChange("Calpose3", 0, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J1</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose3_j2' value={inputValues.Calpose3[1]} onChange={(e) => handleInputChange("Calpose3", 1, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J2</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose3_j3' value={inputValues.Calpose3[2]} onChange={(e) => handleInputChange("Calpose3", 2, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J3</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose3_j4' value={inputValues.Calpose3[3]} onChange={(e) => handleInputChange("Calpose3", 3, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J4</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose3_j5' value={inputValues.Calpose3[4]} onChange={(e) => handleInputChange("Calpose3", 4, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J5</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose3_j6' value={inputValues.Calpose3[5]} onChange={(e) => handleInputChange("Calpose3", 5, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J6</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
            </Stack>
          </Stack>
          {/* Point 3 End */}


          {/* Point 4 Start */}
          <Stack direction={"column"} spacing={1} className={styles["pose-control"]}>
            <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}
              flexWrap={"wrap"} className={styles["pose-control-title"]}>
              <Typography variant={"subtitle1"}>{messages.pose_text_004}</Typography>
              <Stack direction={"row"} spacing={1} className={styles["pose-control-btn"]}>
                <Button onClick={(event) => { event.stopPropagation(); GetPoseClick(3) }} color={"primary"} size={"small"} disabled={false} startIcon={<IcnGetPose />}>{messages.btn_get_pose}</Button>
                <Button                   
                  onMouseDown={(e) => moveToPosition(e, 3)}
                  onMouseUp={stopMoveToPosition}
                  onMouseLeave={stopMoveToPosition} 
                 color={"primary"} size={"small"} disabled={false} variant={"longPressed"} startIcon={<IcnMoveTo />}>{messages.btn_move_to}</Button>
                <Button onClick={(event) => { event.stopPropagation(); ResetClick(3) }} color={"secondary"} size={"small"} disabled={false}><IcnReset /></Button>
                <Divider flexItem={true} orientation={"vertical"} />
                <Button onClick={(event) => { event.stopPropagation(); CopyClick(3) }} color={"secondary"} size={"small"} disabled={false}><IcnCopy /></Button>
                <Button onClick={(event) => { event.stopPropagation(); handlePasteFromClipboard(3) }} color={"secondary"} size={"small"} disabled={false}><IcnPaste /></Button>

              </Stack>
            </Stack>
            <Stack direction={"row"} className={styles["pose-control-task"]}>
              <TextField id='calpose4_j1' value={inputValues.Calpose4[0]} onChange={(e) => handleInputChange("Calpose4", 0, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J1</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose4_j2' value={inputValues.Calpose4[1]} onChange={(e) => handleInputChange("Calpose4", 1, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J2</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose4_j3' value={inputValues.Calpose4[2]} onChange={(e) => handleInputChange("Calpose4", 2, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J3</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose4_j4' value={inputValues.Calpose4[3]} onChange={(e) => handleInputChange("Calpose4", 3, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J4</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose4_j5' value={inputValues.Calpose4[4]} onChange={(e) => handleInputChange("Calpose4", 4, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J5</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose4_j6' value={inputValues.Calpose4[5]} onChange={(e) => handleInputChange("Calpose4", 5, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J6</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
            </Stack>
          </Stack>
          {/* Point 4 End */}


          {/* Point 5 Start */}
          <Stack direction={"column"} spacing={1} className={styles["pose-control"]}>
            <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}
              flexWrap={"wrap"} className={styles["pose-control-title"]}>
              <Typography variant={"subtitle1"}>{messages.pose_text_005}</Typography>
              <Stack direction={"row"} spacing={1} className={styles["pose-control-btn"]}>
                <Button onClick={(event) => { event.stopPropagation(); GetPoseClick(4) }} color={"primary"} size={"small"} disabled={false} startIcon={<IcnGetPose />}>{messages.btn_get_pose}</Button>
                <Button                   
                  onMouseDown={(e) => moveToPosition(e, 4)}
                  onMouseUp={stopMoveToPosition}
                  onMouseLeave={stopMoveToPosition}
                color={"primary"} size={"small"} disabled={false} variant={"longPressed"} startIcon={<IcnMoveTo />}>{messages.btn_move_to}</Button>
                <Button onClick={(event) => { event.stopPropagation(); ResetClick(4) }} color={"secondary"} size={"small"} disabled={false}><IcnReset /></Button>
                <Divider flexItem={true} orientation={"vertical"} />
                <Button onClick={(event) => { event.stopPropagation(); CopyClick(4) }} color={"secondary"} size={"small"} disabled={false}><IcnCopy /></Button>
                <Button onClick={(event) => { event.stopPropagation(); handlePasteFromClipboard(4) }} color={"secondary"} size={"small"} disabled={false}><IcnPaste /></Button>

              </Stack>
            </Stack>
            <Stack direction={"row"} className={styles["pose-control-task"]}>
              <TextField id='calpose5_j1' value={inputValues.Calpose5[0]} onChange={(e) => handleInputChange("Calpose5", 0, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J1</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose5_j2' value={inputValues.Calpose5[1]} onChange={(e) => handleInputChange("Calpose5", 1, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J2</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose5_j3' value={inputValues.Calpose5[2]} onChange={(e) => handleInputChange("Calpose5", 2, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J3</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose5_j4' value={inputValues.Calpose5[3]} onChange={(e) => handleInputChange("Calpose5", 3, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J4</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose5_j5' value={inputValues.Calpose5[4]} onChange={(e) => handleInputChange("Calpose5", 4, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J5</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose5_j6' value={inputValues.Calpose5[5]} onChange={(e) => handleInputChange("Calpose5", 5, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J6</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
            </Stack>
          </Stack>
          {/* Point 5 End */}


          {/* Point 6 Start */}
          <Stack direction={"column"} spacing={1} className={styles["pose-control"]}>
            <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}
              flexWrap={"wrap"} className={styles["pose-control-title"]}>
              <Typography variant={"subtitle1"}>{messages.pose_text_006}</Typography>
              <Stack direction={"row"} spacing={1} className={styles["pose-control-btn"]}>
                <Button onClick={(event) => { event.stopPropagation(); GetPoseClick(5) }} color={"primary"} size={"small"} disabled={false} startIcon={<IcnGetPose />}>{messages.btn_get_pose}</Button>
                <Button                   
                  onMouseDown={(e) => moveToPosition(e, 5)}
                  onMouseUp={stopMoveToPosition}
                  onMouseLeave={stopMoveToPosition}
                color={"primary"} size={"small"} disabled={false} variant={"longPressed"} startIcon={<IcnMoveTo />}>{messages.btn_move_to}</Button>
                <Button onClick={(event) => { event.stopPropagation(); ResetClick(5) }} color={"secondary"} size={"small"} disabled={false}><IcnReset /></Button>
                <Divider flexItem={true} orientation={"vertical"} />
                <Button onClick={(event) => { event.stopPropagation(); CopyClick(5) }} color={"secondary"} size={"small"} disabled={false}><IcnCopy /></Button>
                <Button onClick={(event) => { event.stopPropagation(); handlePasteFromClipboard(5) }} color={"secondary"} size={"small"} disabled={false}><IcnPaste /></Button>

              </Stack>
            </Stack>
            <Stack direction={"row"} className={styles["pose-control-task"]}>
              <TextField id='calpose6_j1' value={inputValues.Calpose6[0]} onChange={(e) => handleInputChange("Calpose6", 0, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J1</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose6_j2' value={inputValues.Calpose6[1]} onChange={(e) => handleInputChange("Calpose6", 1, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J2</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose6_j3' value={inputValues.Calpose6[2]} onChange={(e) => handleInputChange("Calpose6", 2, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J3</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose6_j4' value={inputValues.Calpose6[3]} onChange={(e) => handleInputChange("Calpose6", 3, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J4</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose6_j5' value={inputValues.Calpose6[4]} onChange={(e) => handleInputChange("Calpose6", 4, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J5</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose6_j6' value={inputValues.Calpose6[5]} onChange={(e) => handleInputChange("Calpose6", 5, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J6</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
            </Stack>
          </Stack>
          {/* Point 6 End */}

          {/* Point 7 Start */}
          <Stack direction={"column"} spacing={1} className={styles["pose-control"]}>
            <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}
              flexWrap={"wrap"} className={styles["pose-control-title"]}>
              <Typography variant={"subtitle1"}>{messages.pose_text_007}</Typography>
              <Stack direction={"row"} spacing={1} className={styles["pose-control-btn"]}>
                <Button onClick={(event) => { event.stopPropagation(); GetPoseClick(6) }} color={"primary"} size={"small"} disabled={false} startIcon={<IcnGetPose />}>{messages.btn_get_pose}</Button>
                <Button                   
                  onMouseDown={(e) => moveToPosition(e, 6)}
                  onMouseUp={stopMoveToPosition}
                  onMouseLeave={stopMoveToPosition}
                color={"primary"} size={"small"} disabled={false} variant={"longPressed"} startIcon={<IcnMoveTo />}>{messages.btn_move_to}</Button>
                <Button onClick={(event) => { event.stopPropagation(); ResetClick(6) }} color={"secondary"} size={"small"} disabled={false}><IcnReset /></Button>
                <Divider flexItem={true} orientation={"vertical"} />
                <Button onClick={(event) => { event.stopPropagation(); CopyClick(6) }} color={"secondary"} size={"small"} disabled={false}><IcnCopy /></Button>
                <Button onClick={(event) => { event.stopPropagation(); handlePasteFromClipboard(6) }} color={"secondary"} size={"small"} disabled={false}><IcnPaste /></Button>
              </Stack>
            </Stack>
            <Stack direction={"row"} className={styles["pose-control-task"]}>
              <TextField id='calpose7_j1' value={inputValues.Calpose7[0]} onChange={(e) => handleInputChange("Calpose7", 0, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J1</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose7_j2' value={inputValues.Calpose7[1]} onChange={(e) => handleInputChange("Calpose7", 1, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J2</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose7_j3' value={inputValues.Calpose7[2]} onChange={(e) => handleInputChange("Calpose7", 2, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J3</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose7_j4' value={inputValues.Calpose7[3]} onChange={(e) => handleInputChange("Calpose7", 3, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J4</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose7_j5' value={inputValues.Calpose7[4]} onChange={(e) => handleInputChange("Calpose7", 4, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J5</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
              <TextField id='calpose7_j6' value={inputValues.Calpose7[5]} onChange={(e) => handleInputChange("Calpose7", 5, e.target.value)} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                InputProps={{
                  startAdornment: <InputAdornment position={"start"}>J6</InputAdornment>,
                  endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                }} />
            </Stack>
          </Stack>
          {/* Point 7 End */}

        </Stack>
      </FormGroup>
      <div className={styles["calibration-btn-wrapper"]}>

        <Button onClick={() => RunCalibraiton()} color={"primary"} size={"small"} disabled={false}>{messages.Run_Calibration}</Button>
      </div>

      <TextField inputRef={scrollableDivRef} multiline={true} label={"DRL User Log"} minRows={5} maxRows={5} value={commentLog.slice().reverse().map((item) => `${item.timestamp}: ${item.message}`).join('\n')}
      ></TextField>

    </FormControl>
  );
}
