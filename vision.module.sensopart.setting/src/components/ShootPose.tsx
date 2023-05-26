import { ModuleContext } from "dart-api";
import React from 'react';
import { Button, FormLabel, TextField, FormControl, InputAdornment, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";

import styles from "../assets/PIPstyles/styles.scss";
import IcnGetPose from "../assets/images/icon_get_pose.svg";
import IcnPaste from "../assets/images/icon_paste.svg"
import IcnCopy from "../assets/images/icon_copy.svg";
import IcnMoveTo from "../assets/images/icon_move_to.svg";
import IcnReset from "../assets/images/icon_reset.svg";

import { RobotSpace, Context, IPositionManager, IMotionManager, SixNumArray, Toast,IToast,StopType , IRobotManager } from "dart-api";
import { useState, useEffect } from 'react';
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




interface ShootPoseProps {
    moduleContext: ModuleContext
    IshootPose: SixNumArray
    onPoseChange: (pos: SixNumArray) => void
    onUpdateDB: () => void
}


export default function ShootPose({ moduleContext, IshootPose, onPoseChange, onUpdateDB }: ShootPoseProps) {

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

    

    function GetPoseClick() {

        positionManager.getCurrentPos(RobotSpace.JOINT).then((pos) => {


            onPoseChange(pos);


        })
    }


    function moveToPosition() {
        const tmp1 = document.getElementById("shootpose_j1");
        const tmp2 = document.getElementById("shootpose_j2");
        const tmp3 = document.getElementById("shootpose_j3");
        const tmp4 = document.getElementById("shootpose_j4");
        const tmp5 = document.getElementById("shootpose_j5");
        const tmp6 = document.getElementById("shootpose_j6");
    
        const arrtmp: SixNumArray = [
          parseFloat(tmp1?.value || '0'),
          parseFloat(tmp2?.value || '0'),
          parseFloat(tmp3?.value || '0'),
          parseFloat(tmp4?.value || '0'),
          parseFloat(tmp5?.value || '0'),
          parseFloat(tmp6?.value || '0')
        ];
    
        console.log('move to click pose: ' + String(arrtmp))
        console.log('move to click vel: ' + String(60))
        console.log('move to click acc: ' + String(100))
    
        if (isServoOn) {
          if (!arrtmp.some((value) => value === null || value === undefined)) {
            if (motionManager) {
              motionManager.moveJoint(
                  arrtmp, 
                  60,
                  100,
                  0,
                  0,
                  0,
                  0,
              )
            }
          }
        }
        else{
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
      

      function onChangeJoint() {
        const tmp1 = document.getElementById("shootpose_j1");
        const tmp2 = document.getElementById("shootpose_j2");
        const tmp3 = document.getElementById("shootpose_j3");
        const tmp4 = document.getElementById("shootpose_j4");
        const tmp5 = document.getElementById("shootpose_j5");
        const tmp6 = document.getElementById("shootpose_j6");


      const arrtmp: SixNumArray = [
        parseFloat(tmp1?.value || '0'),
        parseFloat(tmp2?.value || '0'),
        parseFloat(tmp3?.value || '0'),
        parseFloat(tmp4?.value || '0'),
        parseFloat(tmp5?.value || '0'),
        parseFloat(tmp6?.value || '0')

      ];

      onPoseChange(arrtmp);


    };
      



    function ResetClick() {
        onPoseChange([0.00,0.00,0.00,0.00,0.00,0.00]);
  

    }

    function handleBlur() {
 
    };

    
  function CopyClick() {

    const tmp1 = document.getElementById("shootpose_j1");
    const tmp2 = document.getElementById("shootpose_j2");
    const tmp3 = document.getElementById("shootpose_j3");
    const tmp4 = document.getElementById("shootpose_j4");
    const tmp5 = document.getElementById("shootpose_j5");
    const tmp6 = document.getElementById("shootpose_j6");

    const arrtmp: SixNumArray = [
      parseFloat(tmp1?.value || '0'),
      parseFloat(tmp2?.value || '0'),
      parseFloat(tmp3?.value || '0'),
      parseFloat(tmp4?.value || '0'),
      parseFloat(tmp5?.value || '0'),
      parseFloat(tmp6?.value || '0')
    ];

      const coordinates = [...arrtmp];
      const coordinatesString = '[' + coordinates.join(', ') + ']';


      navigator.clipboard.writeText(coordinatesString).then(
        () => {
     
        },
        (err) => {
    
        },
      );
    
  }

    const handlePasteFromClipboard = async () => {
        try {
          const clipboardText = await navigator.clipboard.readText();
          const clipboardArray = JSON.parse(clipboardText);
    
          if (
            Array.isArray(clipboardArray) &&
            clipboardArray.length === 6 &&
            clipboardArray.every((item) => typeof item === 'number')
          ) {
         
            onPoseChange(clipboardArray as SixNumArray);

    
          } else {
     
          }
        } catch (error) {
    
        }
      };
      

    return (
        <FormControl disabled={false} className={`${styles["option-contents"]} ${styles["pose"]}`}>
            <div className={styles["form-label-wrapper"]}>
                <FormLabel>{messages.form_label_006}</FormLabel>
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
                        <Button onClick={(event) => { event.stopPropagation(); CopyClick() }} color={"secondary"} size={"small"} disabled={false}><IcnCopy /></Button>
                        <Button onClick={(event) => { event.stopPropagation(); handlePasteFromClipboard() }} color={"secondary"} size={"small"} disabled={false}><IcnPaste /></Button>

                    </div>
                </AccordionSummary>
                <AccordionDetails>
                    <TextField id='shootpose_j1' value={IshootPose[0]} onChange={onChangeJoint} onBlur={handleBlur} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                        InputProps={{
                            startAdornment: <InputAdornment position={"start"}>J1</InputAdornment>,
                            endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                        }} />
                    <TextField id='shootpose_j2' value={IshootPose[1]} onChange={onChangeJoint} onBlur={handleBlur} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                        InputProps={{
                            startAdornment: <InputAdornment position={"start"}>J2</InputAdornment>,
                            endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                        }} />
                    <TextField id='shootpose_j3' value={IshootPose[2]} onChange={onChangeJoint} onBlur={handleBlur} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                        InputProps={{
                            startAdornment: <InputAdornment position={"start"}>J3</InputAdornment>,
                            endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                        }} />
                    <TextField id='shootpose_j4' value={IshootPose[3]} onChange={onChangeJoint} onBlur={handleBlur} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                        InputProps={{
                            startAdornment: <InputAdornment position={"start"}>J4</InputAdornment>,
                            endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                        }} />
                    <TextField id='shootpose_j5' value={IshootPose[4]} onChange={onChangeJoint} onBlur={handleBlur} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                        InputProps={{
                            startAdornment: <InputAdornment position={"start"}>J5</InputAdornment>,
                            endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                        }} />
                    <TextField id='shootpose_j6' value={IshootPose[5]} onChange={onChangeJoint} onBlur={handleBlur} disabled={false} size={"small"} defaultValue={"0.00"} type={"number"} className={styles["desc-textfield"]}
                        InputProps={{
                            startAdornment: <InputAdornment position={"start"}>J6</InputAdornment>,
                            endAdornment: <InputAdornment position={"end"}>°</InputAdornment>,
                        }} />
                </AccordionDetails>
            </Accordion>
        </FormControl>
    );
}
