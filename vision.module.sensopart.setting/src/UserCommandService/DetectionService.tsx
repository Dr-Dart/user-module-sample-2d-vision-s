import {
  IDartDatabase, Context, ModuleService, IModuleChannel, IProgramManager, ProgramSaveMode, Message, SixNumArray,
} from 'dart-api';


import { DRL_Sub_Detection } from '../drl/DRL_Sub_Detection'
import { DetectionInputValue } from '../drl/DRL_Sub_InputValue'
import { TCPClientState } from '../type';

const TABLE_VISIONDB_NAME = 'VisionDB';
const TABLE_VISIONDB_COLUMNS = ['visionDBId', 'CalibrationPoseData', 'VisionInputData'];


interface VisionData {
  tcpState: TCPClientState;
  VisionJob: number;
  ShootPose: SixNumArray;
  VisionPose: SixNumArray;
  PickingPose: SixNumArray;
}


export class ServiceForTaskEditor extends ModuleService {

  private VisionInputDB: IDartDatabase | null;

  constructor(props: any) {
    super(props);
    this.VisionInputDB = this.moduleContext.getSystemLibrary(Context.DART_DATABASE) as IDartDatabase;
  }

  onStart() {

  }

  //onStop
  onStop() {

  }

  onBind(message: Message, channel: IModuleChannel): boolean {

    const programManager = this.moduleContext.getSystemManager(Context.PROGRAM_MANAGER) as IProgramManager;


    channel.receive("req_to_save_commands_def_as_sub_program", ({ componentId, programName }) => {


      let programInput

      let program = `from DRCF import * \r\n`
      if (componentId === "pip_detection") {
        this.VisionInputDB?.query(TABLE_VISIONDB_NAME, TABLE_VISIONDB_COLUMNS, {}).then((queryResult) => {

          //sub 프로그램 내리기

          const VisionInputData = JSON.parse(queryResult[0].data.VisionInputData);
          const { ipAddress } = VisionInputData.tcpState;
          const { input1, input2, input3, input4 } = ipAddress;
          const CameraIp = [input1, input2, input3, input4].join('.');

          programInput =
            `
CameraIp= ${JSON.stringify(CameraIp) + '\r'}
Port= ${Number(VisionInputData.tcpState.port) + '\r'}
VisionJob= ${Number(VisionInputData.VisionJob) + '\r'}
ShootPose= ${JSON.stringify(VisionInputData.ShootPose) + '\r'}
VisionPose= ${JSON.stringify(VisionInputData.VisionPose) + '\r'}
PickingPose= ${JSON.stringify(VisionInputData.PickingPose) + '\r'}
`


          program = program + programInput + DRL_Sub_Detection



          programManager.saveSubProgram(ProgramSaveMode.SAVE, programName, program)
            .then(result => {

              channel.send("req_to_save_commands_def_as_sub_program", result);


            });
        });

      }
    });

    // 2-1. Task Editor 모듈로부터 "gen_command_call" 이벤트 수신을 위한 이벤트 등록

    channel.receive("gen_command_call", ({ componentId, data }) => {

      // 2-2 DB 검색 or property에 있는 것 가져옴 
      // 2-3. 'componentId' 에 적합한 Command 에 대해, data (사용자 입력값) 기반으로 Command Function Call 생성 명령어 생성 (1.2 에서 등록한 Command Definition 에 존재하는 함수여야 함)


      let DetectionInputValue = {} as DetectionInputValue;

      // 테스크로 부터 받은 것
      let visionData = data.TaskEditorSavedVisionData

      const { ipAddress } = visionData.tcpState;
      const { input1, input2, input3, input4 } = ipAddress;
      const camera_ip = [input1, input2, input3, input4].join('.');


      DetectionInputValue.camera_ip = camera_ip
      DetectionInputValue.port = visionData.tcpState.port
      DetectionInputValue.job_id = visionData.VisionJob
      DetectionInputValue.ShootPose = visionData.ShootPose
      DetectionInputValue.vision_posx = visionData.VisionPose
      DetectionInputValue.robot_posx = visionData.PickingPose


      let result = ``;

      //Detection(camera_ip, vision_posx, robot_posx, job_id)
      if (componentId === "pip_detection") {
        this.VisionInputDB?.query(TABLE_VISIONDB_NAME, TABLE_VISIONDB_COLUMNS, {}).then((queryResult) => {


          const VisionInputData = JSON.parse(queryResult[0].data.VisionInputData);

          const { ipAddress } = VisionInputData.tcpState;
          const { input1, input2, input3, input4 } = ipAddress;
          const CameraIp = [input1, input2, input3, input4].join('.');


          result = `Detection()`
          // + JSON.stringify(CameraIp) + `,`
          // + Number(VisionInputData.tcpState.port) + `,`
          // + Number(VisionInputData.VisionJob) + `,`
          // + JSON.stringify(VisionInputData.ShootPose) + `,`
          // + JSON.stringify(VisionInputData.VisionPose) + `,`
          // + JSON.stringify(VisionInputData.PickingPose) + `)`


          // result = `Detection(`
          //   + JSON.stringify(DetectionInputValue.camera_ip) + `,`
          //   + Number(DetectionInputValue.port) + `,`
          //   + Number(DetectionInputValue.job_id) + `,`
          //   + JSON.stringify(DetectionInputValue.ShootPose) + `,`
          //   + JSON.stringify(DetectionInputValue.vision_posx) + `,`
          //   + JSON.stringify(DetectionInputValue.robot_posx) + `)`

          channel.send("gen_command_call", result);

        });
      }



    });
    return true;



  }//onBind

  onUnbind(message: Message) {

  }



}
