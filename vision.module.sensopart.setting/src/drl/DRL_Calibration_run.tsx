export const DRL_Calibration_run = `

monitoringReadData = "init"

class DoosanSensoPart:
    """
    Interface to use SensoPart with Doosan
    """

    def __init__(self, ip="192.168.137.104", portIN=2006, portOUT=2005):
        """
        Initialize the connection between the camera and the Doosan.

        Params:

            - 'ip': ip of SensoPart camera
            - 'portIN': port of the camera INPUT TCP connection
            - 'portOUT': port of the camera OUTPUT TCP connection
        """

        self.ip = ip
        self.portIN = portIN
        self.portOUT = portOUT

        #tp_log("connection camera")
        try:
            self._socketIN = client_socket_open(self.ip, self.portIN)
            #tp_log("connection to the camera INPUT ok !")
        except Exception as e:
            #tp_popup("Socket INPUT connection failed. Error: {0}".format(
            #    str(e)), DR_PM_ALARM)
            #tp_log("connection Error!")
            raise e

        time.sleep(0.1)

        try:
            self._socketOUT = client_socket_open(self.ip, self.portOUT)
            #tp_log("connection to the camera OUTPUT ok !")
        except Exception as e:
            #tp_popup("Socket OUTPUT connection failed. Error: {0}".format(
            #    str(e)), DR_PM_ALARM)
            #tp_log("connection Error!")
            raise e

    def write(self, cmd, socket = None):
        """
        Write 'cmd' in the socket

        Params:

            - 'cmd': a SensoPart TCP Protocol command
       - 'socket': Socket to write (None will write to default socket)

        Return:

            - 'res': result of the writing

        Exemple:

            write("recognize")
        """

        if socket == None:
                socket = self._socketIN

        # Convert cmd in ascii before sending
        cmd = bytes(cmd, encoding="ascii")

        res = client_socket_write(socket, cmd)

        # Check res value
        if res == -1:
            #tp_log("error  " +                 "Error during a socket write: Server not connected")
            pass
        elif res == -2:
            #tp_log("error  " + "Error during a socket write: Socket error")
            pass
        elif res == 0:
            #tp_log("info " + "Sending {0} command ok".format(cmd))
            pass
        return res

    def read(self, length=-1, timeout=-1, socket = None):
        global monitoringReadData
        """
        Read the socket

        Params:

            - 'length': number of bytes to read (default = -1)
            - 'timeout': Waiting time (default = -1)
            - 'socket': Socket to read (None will read to default socket)

        Return:

            - 'res': result of the reading
            - 'rx_data': data received
        """

        if socket == None:
            socket = self._socketOUT

        res, rx_data = client_socket_read(socket, length, timeout)
        
        # Check res value
        if res == -1:
            #tp_log("error " +  "Error during a socket read: Server not connected")
            pass
        elif res == -2:
            #tp_log("error " + "Error during a socket read: Socket error")
            pass
        elif res == -3:
            #tp_log("error " + "Error during a socket read: Waiting time has expired")
            pass
        elif res > 0:
            #tp_log("info" + "Read res = {0} and rx_data = {1}".format(res, rx_data))
            pass
        # tp_popup("res={0}, rx_data={1}".format(res, rx_data))
        monitoringReadData=rx_data
        return res, rx_data

    def rotm2eulxyz(self, R):
        """
        Transform rotation matrix R to xyz euler angles

        Params:

            - 'R': rotation matrix

        Return:

            - 'eul_xyz': containing xyz euler angles 
        """
        eps = 2.220446049250313e-16  # for singularity check contant value    
        if (abs(R[2][2]) < eps) and (abs(R[1][2]) < eps):
            # if singularity,
            eul_alpha = 0;                          # roll
            eul_gamma = atan2(R[0][2], R[2][2])    # pitch
            eul_beta = atan2(R[1][0], R[1][1])     # yaw   
        else:
            eul_alpha = atan2(-R[1][2], R[2][2])     # roll
            sp = sin(eul_alpha)
            cp = cos(eul_alpha)
            eul_gamma = atan2(R[0][2], cp*R[2][2] - sp*R[1][2])  # pitch
            eul_beta = atan2(-R[0][1], R[0][0])  # yaw
            
        eul_xyz = [eul_alpha, eul_gamma, eul_beta]
        # #tp_log("in def print: {0}".format(eul_xyz))      #  debugging
        
        return eul_xyz

    def get_rotation_euler_XYZ(self):
        """
        Return the current position of the robot with xyz euler angles (instead of zyz)

        Return:

            - 'x1_pos_eulxyz': position of the robot (x,y,z,rx,ry,rz)
        """
        rad2deg = 180/pi
        x1, sol = get_current_posx()             # Robot's TCP pose (w.r.t. DR_BASE)
        x1_pos = x1[0:3]    
        x1_pos[0] = round(x1[0], 3)             # float formatting under 3rd
        x1_pos[1] = round(x1[1], 3)             # float formatting under 3rd
        x1_pos[2] = round(x1[2], 3)             # float formatting under 3rd
        
        x1_eulzyz = x1[3:]                         # extract ZYZ euler    
        x1_rotm = eul2rotm(x1_eulzyz)             # euler (ZYZ) to rotation matrix
        
        x1_eulxyz = self.rotm2eulxyz(x1_rotm)        # call the rotm to eul(xyz) function, rad    
        x1_eulxyz_deg = x1_eulxyz               # init. eul(xyz) [deg]
        x1_eulxyz_deg[0] = round(x1_eulxyz[0] * rad2deg, 3) # float formatting under 3rd
        x1_eulxyz_deg[1] = round(x1_eulxyz[1] * rad2deg, 3) # float formatting under 3rd
        x1_eulxyz_deg[2] = round(x1_eulxyz[2] * rad2deg, 3) # float formatting under 3rd
            
        x1_pos_eulxyz = x1_pos + x1_eulxyz_deg  # merge the tcp point (mm) and rotation (euler xyz deg)
        # # ========== debugging =============
        # #tp_log("x1_PosEulzyz={0}".format(str(x1))) 
        # #tp_log("x1_rotm={0},".format(x1_rotm))        
        # #tp_log("x1_eulxyz={0}".format(str(x1_eulxyz))) 
        # #tp_log("x1_eulxyz_deg={0}".format(str(x1_eulxyz_deg)))
        # # ==================================

        return x1_pos_eulxyz


    def eulxyz2eulzyz(self, theta):
        """
        Transform euler xyz angles to euler zyz angles

        Params:

            - 'theta': [x, y, z] euler angles

        Return:

            - 'theta_zyz': [z, y, z] euler angles
        """

        def rotation_matrix_from_euler_angles(theta):
            if type(theta) != list or len(theta) != 3:
                raise DR_Error(DR_ERROR_TYPE, "Invalid type : theta")

            if is_number(theta) != True:
                raise DR_Error(DR_ERROR_VALUE, "Invalid value : theta({0})".format(theta))
            
            def degree2rad(degree):
                return math.radians(degree)
            alpha, beta, gamma = degree2rad(theta[0]), degree2rad(theta[1]), degree2rad(theta[2])
            # print([alpha,beta,gamma])
            R_x = [
                [1, 0, 0],
                [0, math.cos(alpha), -math.sin(alpha)],
                [0, math.sin(alpha), math.cos(alpha)]
            ]

            R_y = [
                [math.cos(beta), 0, math.sin(beta)],
                [0, 1, 0],
                [-math.sin(beta), 0, math.cos(beta)]
            ]

            R_z = [
                [math.cos(gamma), -math.sin(gamma), 0],
                [math.sin(gamma), math.cos(gamma), 0],
                [0, 0, 1]
            ]

            R = matrix_multiply(matrix_multiply(R_x, R_y), R_z)
            return R

        def matrix_multiply(A, B):
            return [[sum(a * b for a, b in zip(A_row, B_col)) for B_col in zip(*B)] for A_row in A]

        R = rotation_matrix_from_euler_angles(theta)
        theta_zyz = rotm2eul(R)

        return theta_zyz        
        
    
        

    def calibration_init(self):
        """Initialization of the calibration"""
        global monitoringReadData
        cmd = "CCD"
        #tp_popup(cmd)
        #tp_log(cmd)
        self.write(cmd, socket = self._socketIN)
        res, rx_data = self.read(socket = self._socketIN)

        if rx_data.decode() == "CCDP":
            #tp_log("Success: Calibration initialization")
            monitoringReadData = "Success: Calibration initialization"
            return 0
        else:
            #tp_log("Fail: Calibration initialization")
            return -1

    def add_calibration_image(self, measurement_plane = "0"):
        """
        Add a new image to the current calibration. Please execute 'calibration_init' before 

        Params:

            - 'measurement_plane': need to be "1" for the first image and then "0"
        """
        global monitoringReadData
        request_version = "1"
        mode = "2" #Hand-Eye calibration
        order_rotation = "01" #Yaw-Pitch-Roll
        robot_position = self.get_rotation_euler_XYZ() # get robot position with Yaw-Pitch-Roll angles
        # tp_popup("robot_position: {}".format(robot_position))
        x = str(round(robot_position[0] * 1000)).zfill(8)[:8]
        y = str(round(robot_position[1] * 1000)).zfill(8)[:8]
        z = str(round(robot_position[2] * 1000)).zfill(8)[:8]
        rx = str(round(robot_position[3] * 1000)).zfill(8)[:8]
        ry = str(round(robot_position[4] * 1000)).zfill(8)[:8]
        rz = str(round(robot_position[5] * 1000)).zfill(8)[:8]
        # tp_popup("x: {0}, y: {1}, z: {2}, rx: {3}, ry: {4}, rz: {5}".format(x,y,z,rx,ry,rz))

        position = x + y + z + rx + ry + rz

        cmd = "CAI" + request_version + mode + "000" + measurement_plane + order_rotation + position
        # tp_popup(cmd)
        self.write(cmd, socket = self._socketIN)

        res, rx_data = self.read(socket = self._socketIN)
        if rx_data.decode()[:4] == "CAIP":
            #tp_log("Success: Add calibration image")
            monitoringReadData = "Success: Add calibration image"
            return 0
        else:
            #tp_log("Fail: Add calibration image ( " + rx_data.decode() + " )")
            return -1

    def run_calibration(self):
        """ Execute the calibration of the camera. You need to add at least 6 images (recommended: 10) to the calibration before run this function """
        global monitoringReadData
        duration = "1" # Permanent
        mode = "0" # 0 - Calibration (internal and external parameters) 6 - Calibrate Hand-Eye/Base-Eye
        cmd = "CRP1" + duration + "4" + mode
        # tp_popup(cmd)
        self.write(cmd, socket = self._socketIN)

        res, rx_data = self.read(socket = self._socketIN)
        if rx_data.decode()[:4] == "CRPP":
            #tp_log("Success: Calibration Robotics multi-image")
            monitoringReadData ="Success: Calibration Robotics multi-image"
            return 0
        else:
            #tp_log("Fail: Calibration Robotics multi-image ( " + rx_data.decode() + " )")
            return -1

    def TRG(self):
        """Send TRG to the camera in order to trigger a capture"""

        cmd = "TRG"

        self.write(cmd)
        # tp_popup("Trigger camera")
        #tp_log("Trigger camera")

    
    def TRR(self):
        """Send TRR (Trigger Robotics) to the camera in order to trigger a capture"""
        global monitoringReadData
        request_version = "1"
        length_trg_identifier = "04"
        trg_identifier = "Part"

        robot_position = self.get_rotation_euler_XYZ() # get robot position with Yaw-Pitch-Roll angles
        x = str(round(robot_position[0] * 1000)).zfill(8)[:8]
        y = str(round(robot_position[1] * 1000)).zfill(8)[:8]
        z = str(round(robot_position[2] * 1000)).zfill(8)[:8]
        rx = str(round(robot_position[3] * 1000)).zfill(8)[:8]
        ry = str(round(robot_position[4] * 1000)).zfill(8)[:8]
        rz = str(round(robot_position[5] * 1000)).zfill(8)[:8]
        # tp_popup("x: {0}, y: {1}, z: {2}, rx: {3}, ry: {4}, rz: {5}".format(x,y,z,rx,ry,rz))

        position = x + y + z + rx + ry + rz

        cmd = "TRR" + request_version + length_trg_identifier + trg_identifier + position

        self.write(cmd)

        res, rx_data = self.read()
        if rx_data.decode()[:4] == "TRRP":
            #tp_log("Success: Trigger robotics")
            monitoringReadData = "Success: Trigger robotics"
            return 0
        else:
            #tp_log("Fail: Trigger robotics ( " + rx_data.decode() + " )")
            return -1


    def extract_data(self, rx_data):
        """
        Extract data from the camera. Format trame needed: score;posx;posy;angle

        Params:

            - 'rx_data': data received from the camera (Format trame needed: score;posx;posy;angle)

        Return:

            - '(score, pos_x, pos_y, angle_rz)': tuple with object position information
        """

        result = rx_data.decode().split(';')

        score = int(result[0]) 
        pos_x = int(result[1]) 
        pos_y = int(result[2]) 
        angle_rz = int(result[3])

        # tp_popup("result {0}".format(result))
        #tp_log("result {0}".format(result))
        return (score, pos_x, pos_y, angle_rz)

    def extract_data_2_tools(self, rx_data):
        """
        Extract data from the camera config with two tools (in order to detetect the two sides of an object for example). 
        Format trame needed: score1;posx1;posy1;angle1;score2;posx2;posy2;angle2

        Params:

            - 'rx_data': data received from the camera (Format trame needed: score;posx;posy;angle)

        Return:

            - '(score, pos_x, pos_y, angle_rz)': tuple with object position (with the best score) information
        """

        result = rx_data.decode().split(';')

        score1 = int(result[0])/1000 
        pos_x1 = int(result[1])/1000 
        pos_y1 = int(result[2])/1000 
        angle_rz1 = int(result[3])/1000

        score2 = int(result[4])/1000 
        pos_x2 = int(result[5])/1000 
        pos_y2 = int(result[6])/1000 
        angle_rz2 = int(result[7])/1000

        if score1 >= score2:
            score = score1
            pos_x = pos_x1
            pos_y = pos_y1
            angle_rz = angle_rz1
        else:
            score = score2
            pos_x = pos_x2
            pos_y = pos_y2
            angle_rz = angle_rz2

        # tp_popup("result {0}".format(result))
        #tp_log("result {0}".format(result))
        return (score, pos_x, pos_y, angle_rz)

    def extract_3D_data(self, rx_data):
        """
        Extract 3D data from the camera. Format trame needed: score;posx;posy;anglex;angley;anglez

        Params:

            - 'rx_data': data received from the camera (Format trame needed: score;posx;posy;angle)

        Return:

            - '(score, pos_x, pos_y, angle_rx, angle_ry, angle_rz)': tuple with object position information
        """

        result = rx_data.decode().split(';')

        score = int(result[0])/1000 
        pos_x = int(result[1])/1000 
        pos_y = int(result[2])/1000 
        pos_z = int(result[3])/1000
        angle_rx = int(result[4])/1000
        angle_ry = int(result[5])/1000
        angle_rz = int(result[6])/1000

        eul = self.eulxyz2eulzyz([angle_rx, angle_ry, angle_rz])# Rz,Ry,Rz

        # tp_popup("result {0}".format(result))
        #tp_log("result {0}".format(result))
        return (score, pos_x, pos_y, pos_z, eul[0], eul[1], eul[2])

    def change_job(self, num_job):
        """Send CJB+num_job to the camera in order to change the job number"""

        cmd = "CJB" + "{0:0=3d}".format(num_job)

        self.write(cmd)
        #tp_log("Change job camera (job = {})".format(num_job))


        
set_singular_handling(DR_AVOID)
set_velj(30.0)
set_accj(50.0)
set_velx(125.0, 40.625)
set_accx(500.0, 166.5)
#camera_ip = "192.168.137.104"
sensopart = DoosanSensoPart(ip=camera_ip, portIN=2006, portOUT=2005)

sensopart.calibration_init()


for index, calibration_pose in enumerate(calibration_positions):
    if index == 0:
        #tp_popup("{0} {1}" .format(index, calibration_pose))
        movej(calibration_pose)
        sensopart.add_calibration_image(measurement_plane="1") # Only for the first image
        
    else:
        #tp_popup("{0} {1}" .format(index, calibration_pose))
        movej(calibration_pose)
        sensopart.add_calibration_image()
        

sensopart.run_calibration()    













`