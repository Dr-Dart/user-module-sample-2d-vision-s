import { SixNumArray} from 'dart-api';


export interface DetectionInputValue {
  camera_ip: string;
  port: string;
  job_id: number;
  ShootPose: SixNumArray;
  vision_posx: SixNumArray;
  robot_posx: SixNumArray;


}

