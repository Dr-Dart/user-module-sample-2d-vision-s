
import React from 'react';
import { Button, FormLabel, TextField, FormControl, InputAdornment, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";

import styles from "../assets/PIPstyles/styles.scss";
import IcnGetPose from "../assets/images/icon_get_pose.svg";
import IcnMoveTo from "../assets/images/icon_move_to.svg";
import IcnReset from "../assets/images/icon_reset.svg";


import { Context, IRobotManager, IPositionManager, IMotionManager, SixNumArray, CoordinateSystem, ModuleContext, StopType } from "dart-api";
import { useState, useEffect } from 'react';

import { MAX_COORDINATE, MAX_ROTATION, MOVE_L } from '../constants';

import {

  COORDINATE_TYPE_POSX,
  TOOL,
  INDEX_0, INDEX_1, INDEX_2, INDEX_3, INDEX_4, INDEX_5,
} from '../type';
import { messages } from '../messages'
declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    longPressed: true;
  }
}


type Speed = {
  Vel: number;
  Acc: number;
}

type CoordinatesObject = {
  x: number;
  y: number;
  z: number;
  Rx: number;
  Ry: number;
  Rz: number;
};

interface VisionPoseProps {
  moduleContext: ModuleContext
  IvisionPose: SixNumArray
  onPoseChange: (pos: SixNumArray) => void

  sendMessageTCP: (tcpMsg: string) => void;
  receivedMsg: any;
}

interface ParsedData {
  position: { x: number; y: number; z: number };
  rotation: { rx: number; ry: number; rz: number };
  fail: boolean;
}
const parseData = (data: string): ParsedData => {
  const regex3 = /TRXP\d{2}[A-Za-z]+\d{8}\w+,(?:([Pp]?),)?(-?\d+),(-?\d+),(-?\d+)?/;
  const regex6 = /TRXP\d{2}[A-Za-z]+\d{8}\w+,(?:([Pp]?),)?(-?\d+),(-?\d+),(-?\d+),(-?\d+),(-?\d+),(-?\d+)?/;

  let matches = data.match(regex3);

  const parsedData: ParsedData = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { rx: 0, ry: 0, rz: 0 },
    fail: false,
  };

  if (!matches) {
    matches = data.match(regex6);
    if (!matches) {

      parsedData.fail = true;
      return parsedData;
    } else {
      const [_, pass1 = '', x = '', y = '', z = '', rx = '', ry = '', rz = ''] = matches;
      parsedData.position = {
        x: parseInt(x) / 1000,
        y: parseInt(y) / 1000,
        z: parseInt(z) / 1000,
      };
      parsedData.rotation = {
        rx: parseInt(rx) / 1000,
        ry: parseInt(ry) / 1000,
        rz: parseInt(rz) / 1000,
      };
    }
  } else {
    const [_, pass1 = '', x = '', y = '', rz = ''] = matches;
    parsedData.position = {
      x: parseInt(x) / 1000,
      y: parseInt(y) / 1000,
      z: 0,
    };
    parsedData.rotation = {
      rx: 0,
      ry: 0,
      rz: parseInt(rz) / 1000,
    };
  }

  return parsedData;
};



export default function VisionPose({ moduleContext, IvisionPose, onPoseChange, sendMessageTCP, receivedMsg }: VisionPoseProps) {
  

  const { packageName } = moduleContext;

  const robotManager = moduleContext.getSystemManager(Context.ROBOT_MANAGER) as IRobotManager;
  const positionManager = moduleContext.getSystemManager(Context.POSITION_MANAGER) as IPositionManager;
  const motionManager = moduleContext.getSystemManager(Context.MOTION_MANAGER) as IMotionManager;


  const [isServoOn, setServoOn] = useState(robotManager.servoState.value);
  const [txCmd, setTxCmd] = useState<string>('TRX04test');


  useEffect(() => {


    if (receivedMsg && Object.keys(receivedMsg).length !== 0) {

      const parsedData = parseData(JSON.stringify(receivedMsg));
      
      let theta_xyz = [parsedData.rotation.rx, parsedData.rotation.ry, parsedData.rotation.rz];
      let theta_zyz = eulxyz2eulzyz(theta_xyz);
      onPoseChange([
        parsedData.position.x,
        parsedData.position.y,
        parsedData.position.z,
        theta_zyz[0],
        theta_zyz[1],
        theta_zyz[2]
      ]);
    }
  }, [receivedMsg]);
  
  




  

  useEffect(() => {
    const servoStateCallback = (data: any) => {
      setServoOn(data);
    };
    robotManager.servoState.register(moduleContext, servoStateCallback);

    return () => {
      robotManager.servoState.unregister(moduleContext, servoStateCallback);

    };

  }, []);


  function degree2rad(degree: number): number {
    return (degree * Math.PI) / 180;
  }

  function matrixMultiply(A: number[][], B: number[][]): number[][] {
    if (!A || !B) {
      throw new Error("Input matrices A and B must not be empty.");
    }

    if (!A.every(row => Array.isArray(row)) || !B.every(row => Array.isArray(row))) {
      throw new Error("Input matrices A and B must be arrays of arrays.");
    }

    if (!A.every(row => row.length === A[0].length) || !B.every(row => row.length === B[0].length)) {
      throw new Error("Input matrices A and B must have consistent row lengths.");
    }

    if (A[0].length !== B.length) {
      throw new Error("The number of columns in matrix A must match the number of rows in matrix B.");
    }

    return A.map(A_row => B[0].map((_, colIdx) => A_row.reduce((sum, a, rowIdx) => sum + a * B[rowIdx][colIdx], 0)));
  }

  function rotationMatrixFromEulerAngles(theta: number[]): number[][] {
    const [alpha, beta, gamma] = theta.map(degree2rad);

    const R_x = [
      [1, 0, 0],
      [0, Math.cos(alpha), -Math.sin(alpha)],
      [0, Math.sin(alpha), Math.cos(alpha)]
    ];

    const R_y = [
      [Math.cos(beta), 0, Math.sin(beta)],
      [0, 1, 0],
      [-Math.sin(beta), 0, Math.cos(beta)]
    ];

    const R_z = [
      [Math.cos(gamma), -Math.sin(gamma), 0],
      [Math.sin(gamma), Math.cos(gamma), 0],
      [0, 0, 1]
    ];

    return matrixMultiply(matrixMultiply(R_x, R_y), R_z);
  }
  function eulerAnglesFromRotationMatrix(R: number[][]): number[] {
    const epsilon = 1e-6;
    let rz1, ry, rz2;

    if (Math.abs(R[0][2]) < epsilon && Math.abs(R[1][2]) < epsilon) {
      // Gimbal lock (singular) case
      rz1 = 0;
      const sp = 0;
      const cp = 1;

      ry = Math.atan2(cp * R[0][2] + sp * R[1][2], R[2][2])
      rz2 = Math.atan2(-sp * R[0][0] + cp * R[1][0], -sp * R[0][1] + cp * R[1][1]);

    } else {
      rz1 = Math.atan2(R[1][2], R[0][2])

      const sp = Math.sin(rz1)
      const cp = Math.cos(rz1)

      ry = Math.atan2(cp * R[0][2] + sp * R[1][2], R[2][2])
      rz2 = Math.atan2(-sp * R[0][0] + cp * R[1][0], -sp * R[0][1] + cp * R[1][1])

    }

    const angles = [rz1, ry, rz2].map((rad) => {
      let deg = (rad * 180) / Math.PI;
      if (deg > 180) {
        deg -= 360;
      } else if (deg < -180) {
        deg += 360;
      }
      return deg;
    });

    return angles;
  }




  function eulxyz2eulzyz(theta_degrees: number[]): number[] {
    const R = rotationMatrixFromEulerAngles(theta_degrees);
    return eulerAnglesFromRotationMatrix(R);
  }


  function checkDataBeforeMoving(params: Record<string, string | number | null>): boolean {
    let canMove = true;
    for (const [key, value] of Object.entries(params)) {
      if (key.toUpperCase() === 'X' || key.toUpperCase() === 'Y' || key.toUpperCase() === 'Z') {
        if (!(Number(value) >= -MAX_COORDINATE && Number(value) <= MAX_COORDINATE)) {
          canMove = false;
          break;
        }
      } else if (!(Number(value) >= -MAX_ROTATION && Number(value) <= MAX_ROTATION)) {
        canMove = false;
        break;
      } else {
    
      }
    }
    return canMove;
  };


  function moveToPosition(e: React.SyntheticEvent) {
    e.preventDefault();
    e.stopPropagation();
    const tmp1 = document.getElementById("visionpose_t1");
    const tmp2 = document.getElementById("visionpose_t2");
    const tmp3 = document.getElementById("visionpose_t3");
    const tmp4 = document.getElementById("visionpose_t4");
    const tmp5 = document.getElementById("visionpose_t5");
    const tmp6 = document.getElementById("visionpose_t6");

    const arrtmp: SixNumArray = [
      parseFloat(tmp1?.value || '0'),
      parseFloat(tmp2?.value || '0'),
      parseFloat(tmp3?.value || '0'),
      parseFloat(tmp4?.value || '0'),
      parseFloat(tmp5?.value || '0'),
      parseFloat(tmp6?.value || '0')
    ];




    if (isServoOn) {


      if (!arrtmp.some((value) => value === null || value === undefined)) {
        const pos = [...arrtmp] as SixNumArray;
        const object = Object.assign(
          {},
          { x: pos[INDEX_0], y: pos[INDEX_1], z: pos[INDEX_2], a: pos[INDEX_3], b: pos[INDEX_4], c: pos[INDEX_5] },
        );
        if (checkDataBeforeMoving({ ...object }) && motionManager && positionManager) {
          const isSolutionSpace = positionManager.getSolutionSpace();
          motionManager?.moveJointPosx(
            pos,
            isSolutionSpace,
            MOVE_L.fTargetVelNum,
            MOVE_L.fTargetAccNum,
            MOVE_L.targetTime,
            MOVE_L.moveMode,
            MOVE_L.moveReference,
            MOVE_L.blendingRadius,
            MOVE_L.blendingType,
          );
        }
      }

    }


  }


  function stopMoveToPosition(e: React.SyntheticEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (isServoOn) {
      motionManager?.moveStop(StopType.SLOW);
    }
  };


  function ResetClick() {
    onPoseChange([0.00,0.00,0.00,0.00,0.00,0.00]);

  }
  function handleBlur() {

  };


  const onChangeTask = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
    const newValue = parseFloat(event.target.value) || 0;
    let updatedValue: SixNumArray = [...IvisionPose];
    updatedValue[index] = newValue;
    onPoseChange(updatedValue);
  };

  function VisionPoseTrigger() {

    const message = txCmd;

    sendMessageTCP(message);

  }
  

  return (
    <FormControl disabled={false} className={`${styles["option-contents"]} ${styles["calibration"]}`}>
      <div className={styles["form-label-wrapper"]}>
        <FormLabel>{messages.calibration_option_title_004}</FormLabel>
      </div>

      <Accordion defaultExpanded={true}>
        <AccordionSummary>
          <FormLabel />
          <div className={styles["pose-control-btn"]}>
            <Button onClick={(event) => { event.stopPropagation(); VisionPoseTrigger() }} disabled={false} startIcon={<IcnGetPose />} > Trigger Pose </Button>
            {/* <Button onClick={(event)=>{event.stopPropagation(); GetPoseClick()}} disabled={false} startIcon={<IcnGetPose />}>{t("btn_get-pose", {ns: packageName})}</Button> */}
            <Button
              onMouseDown={moveToPosition}
              onMouseUp={stopMoveToPosition}
              onMouseLeave={stopMoveToPosition}
              disabled={false} variant={"longPressed"} startIcon={<IcnMoveTo />}>{messages.btn_move_to}</Button>
            <Button onClick={(event) => { event.stopPropagation(); ResetClick() }} disabled={false} color={"secondary"}><IcnReset /></Button>

          </div>

        </AccordionSummary>
        <AccordionDetails>
          <TextField id='visionpose_t1' value={IvisionPose[0]}  
           onChange={(event) => onChangeTask(event, INDEX_0)} 
           onBlur={handleBlur} disabled={false} size={"small"} type={"number"} className={styles["desc-textfield"]}
            InputProps={{
              startAdornment: <InputAdornment position={"start"}>X</InputAdornment>,
              endAdornment: <InputAdornment position={"end"}>mm</InputAdornment>,
            }} />
          <TextField id='visionpose_t2' value={IvisionPose[1]}  
           onChange={(event) => onChangeTask(event, INDEX_1)} 
           onBlur={handleBlur} disabled={false} size={"small"} type={"number"} className={styles["desc-textfield"]}
            InputProps={{
              startAdornment: <InputAdornment position={"start"}>Y</InputAdornment>,
              endAdornment: <InputAdornment position={"end"}>mm</InputAdornment>,
            }} />
          <TextField id='visionpose_t3' value={IvisionPose[2]}  
           onChange={(event) => onChangeTask(event, INDEX_2)} 
           onBlur={handleBlur} disabled={false} size={"small"} type={"number"} className={styles["desc-textfield"]}
            InputProps={{
              startAdornment: <InputAdornment position={"start"}>Z</InputAdornment>,
              endAdornment: <InputAdornment position={"end"}>mm</InputAdornment>,
            }} />
          <TextField id='visionpose_t4' value={IvisionPose[3]}
           onChange={(event) => onChangeTask(event, INDEX_3)} 
          onBlur={handleBlur} disabled={false} size={"small"} type={"number"} className={styles["desc-textfield"]}
            InputProps={{
              startAdornment: <InputAdornment position={"start"}>Rz</InputAdornment>,
              endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
            }} />
          <TextField id='visionpose_t5' value={IvisionPose[4]}  
           onChange={(event) => onChangeTask(event, INDEX_4)} 
          onBlur={handleBlur} disabled={false} size={"small"} type={"number"} className={styles["desc-textfield"]}
            InputProps={{
              startAdornment: <InputAdornment position={"start"}>Ry</InputAdornment>,
              endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
            }} />
          <TextField id='visionpose_t6' value={IvisionPose[5]}  
           onChange={(event) => onChangeTask(event, INDEX_5)} 
          onBlur={handleBlur} disabled={false} size={"small"} type={"number"} className={styles["desc-textfield"]}
            InputProps={{
              startAdornment: <InputAdornment position={"start"}>Rz</InputAdornment>,
              endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
            }} />
        </AccordionDetails>
      </Accordion>
    </FormControl>
  );
}


