
import React from 'react';
import { Button, FormLabel, TextField, FormControl, InputAdornment, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";

import styles from "../assets/PIPstyles/styles.scss";
import IcnGetPose from "../assets/images/icon_get_pose.svg";
import IcnMoveTo from "../assets/images/icon_move_to.svg";
import IcnReset from "../assets/images/icon_reset.svg";

import { RobotSpace, Context, IRobotManager, IPositionManager, IToast, Toast, IMotionManager, SixNumArray, CoordinateSystem, ModuleContext, StopType } from "dart-api";
import { useState, useEffect } from 'react';


import { MAX_COORDINATE, MAX_ROTATION, MOVE_L } from '../constants';

import {
  COORDINATE_TYPE_POSX, TOOL, INDEX_0, INDEX_1, INDEX_2, INDEX_3, INDEX_4, INDEX_5, COORDINATE_BASE,
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


interface PickingPoseProps {
  moduleContext: ModuleContext
  IpickingPose: SixNumArray
  onPoseChange: (pos: SixNumArray) => void
  onUpdateDB: () => void
}

export default function PickingPose({ moduleContext, IpickingPose, onPoseChange, onUpdateDB }: PickingPoseProps) {

  const { packageName } = moduleContext;

  const robotManager = moduleContext.getSystemManager(Context.ROBOT_MANAGER) as IRobotManager;
  const positionManager = moduleContext.getSystemManager(Context.POSITION_MANAGER) as IPositionManager;
  const motionManager = moduleContext.getSystemManager(Context.MOTION_MANAGER) as IMotionManager;


  const [isServoOn, setServoOn] = useState(robotManager.servoState.value);

  useEffect(() => {
    const servoStateCallback = (data: any) => {
      setServoOn(data);
    };
    robotManager.servoState.register(moduleContext, servoStateCallback);

    return () => {
      robotManager.servoState.unregister(moduleContext, servoStateCallback);

    };

  }, []);

  useEffect(() => {
    onPoseChange(IpickingPose);
  }, []);


  function getCoordinateType(coordinateSystem: CoordinateSystem | COORDINATE_TYPE_POSX) {
    let coordType;
    if (coordinateSystem === CoordinateSystem.BASE || coordinateSystem === BASE) {
      coordType = CoordinateSystem.BASE;
    } else if (coordinateSystem === CoordinateSystem.WORLD || coordinateSystem === WORLD) {
      coordType = CoordinateSystem.WORLD;
    } else if (coordinateSystem === CoordinateSystem.TOOL || coordinateSystem === TOOL) {
      coordType = CoordinateSystem.TOOL;
    } else if (coordinateSystem === CoordinateSystem.USER || coordinateSystem === USER) {
      coordType = CoordinateSystem.USER;
    }
    return coordType;
  };

  async function GetPoseClick() {
    const coordType = getCoordinateType(COORDINATE_BASE);
    const data = await positionManager.getCurrentPosX(coordType ?? CoordinateSystem.BASE);

    if (data) {


      onPoseChange(data.targetPose);



    };

  };



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
        // Fix sonar
      }
    }
    return canMove;
  };




  function moveToPosition(e: React.SyntheticEvent) {
    e.preventDefault();
    e.stopPropagation();
    const tmp1 = document.getElementById("pickingpose_t1");
    const tmp2 = document.getElementById("pickingpose_t2");
    const tmp3 = document.getElementById("pickingpose_t3");
    const tmp4 = document.getElementById("pickingpose_t4");
    const tmp5 = document.getElementById("pickingpose_t5");
    const tmp6 = document.getElementById("pickingpose_t6");

    const arrtmp: SixNumArray = [
      parseFloat(tmp1?.value || '0'),
      parseFloat(tmp2?.value || '0'),
      parseFloat(tmp3?.value || '0'),
      parseFloat(tmp4?.value || '0'),
      parseFloat(tmp5?.value || '0'),
      parseFloat(tmp6?.value || '0')
    ];




    if (isServoOn) {


      const pos = [...arrtmp] as SixNumArray;
      console.log("pos", pos)
      const object = Object.assign(
        {},
        { x: pos[INDEX_0], y: pos[INDEX_1], z: pos[INDEX_2], rz: pos[INDEX_3], ry: pos[INDEX_4], rx: pos[INDEX_5] },
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
      } else {
        Toast.show(IToast.TYPE_ERROR, 'Move Fail', 'Data is not correct...' , false)
      }


    } else {
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


  function onChangeTask(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, type: number) {

    const value = parseFloat(event.target.value) || 0;

    let tmp = [...IpickingPose] as SixNumArray;
    tmp[type] = value

    onPoseChange(tmp);

  }


  function ResetClick() {
    onPoseChange([0.00, 0.00, 0.00, 0.00, 0.00, 0.00]);

  }
  function handleBlur() {
    onUpdateDB()
  };
  return (
    <FormControl disabled={false} className={`${styles["option-contents"]} ${styles["pose"]}`}>
      <div className={styles["form-label-wrapper"]}>
        <FormLabel>{messages.calibration_option_title_005}</FormLabel>
      </div>
      <Accordion defaultExpanded={true}>
        <AccordionSummary>
          <FormLabel />
          <div className={styles["pose-control-btn"]}>
            <Button onClick={(event) => { event.stopPropagation(); GetPoseClick() }} disabled={false} startIcon={<IcnGetPose />}>{messages.btn_get_pose}</Button>
            <Button
              onMouseDown={moveToPosition}
              onMouseUp={stopMoveToPosition}
              onMouseLeave={stopMoveToPosition}
              disabled={false} variant={"longPressed"} startIcon={<IcnMoveTo />}>{messages.btn_move_to}</Button>
            <Button onClick={(event) => { event.stopPropagation(); ResetClick() }} disabled={false} color={"secondary"}><IcnReset /></Button>
          </div>
        </AccordionSummary>
        <AccordionDetails>
          <TextField id='pickingpose_t1' value={IpickingPose[0]}
            onChange={(event) => onChangeTask(event, INDEX_0)}
            onBlur={handleBlur} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
            InputProps={{
              startAdornment: <InputAdornment position={"start"}>X</InputAdornment>,
              endAdornment: <InputAdornment position={"end"}>mm</InputAdornment>,
            }} />
          <TextField id='pickingpose_t2' value={IpickingPose[1]}
            onChange={(event) => onChangeTask(event, INDEX_1)}
            onBlur={handleBlur} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
            InputProps={{
              startAdornment: <InputAdornment position={"start"}>Y</InputAdornment>,
              endAdornment: <InputAdornment position={"end"}>mm</InputAdornment>,
            }} />
          <TextField id='pickingpose_t3' value={IpickingPose[2]}
            onChange={(event) => onChangeTask(event, INDEX_2)}
            onBlur={handleBlur} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
            InputProps={{
              startAdornment: <InputAdornment position={"start"}>Z</InputAdornment>,
              endAdornment: <InputAdornment position={"end"}>mm</InputAdornment>,
            }} />
          <TextField id='pickingpose_t4' value={IpickingPose[3]} onChange={(event) => onChangeTask(event, INDEX_3)} onBlur={handleBlur} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
            InputProps={{
              startAdornment: <InputAdornment position={"start"}>RZ</InputAdornment>,
              endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
            }} />
          <TextField id='pickingpose_t5' value={IpickingPose[4]} onChange={(event) => onChangeTask(event, INDEX_4)} onBlur={handleBlur} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
            InputProps={{
              startAdornment: <InputAdornment position={"start"}>RY</InputAdornment>,
              endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
            }} />
          <TextField id='pickingpose_t6' value={IpickingPose[5]} onChange={(event) => onChangeTask(event, INDEX_5)} onBlur={handleBlur} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
            InputProps={{
              startAdornment: <InputAdornment position={"start"}>RX</InputAdornment>,
              endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
            }} />
        </AccordionDetails>
      </Accordion>
    </FormControl>
  );
}
