export const DRL_Sub_Detection =`

from DRCF import * 
import math

#-*- coding: utf-8 -*-
#
# ##
# @mainpage
# @file     visor_robotic.py
# @brief    Define DRL vision functions
# @Last update date
# @details


import socket
import select
import codecs
import binascii
import struct
from DR_error import *



# timeout
DR_VS_TIMEOUT   = 10
DR_VS_WAIT      = 0.1
DR_VS_WAIT_TRIG = 0.5
# =============================================================================================
# global variable
telnet_sock = None
error_code  = "None"
binary_or_ascii="ascii"
version =  None
request_dictionary = {"buffer_content" :  None, "request_successful" : None, "trigger_mode" : None        , "job_number" : None        ,"length_of_identifier" : None, "identifier" : None, "operation_mode" : None, "length_of_result" : None, "result_data" : None,  "request_string" : "UNDEFINED", "encoding" : "ascii"}
class visorCommand():
    NO_COMMAND = "NO"
    TRIGGER = "TRG"
    EXTENDED_TRIGGER= "TRX"
    JOB_CHANGE = "CJB"
    JOB_CHANGE_JOB_NAME = "CJN"
    READ_JOB_LIST = "GJL"
    
class RequestClass:
    #This class contains the available requests for the visor. It is a child class of the ViosrInterface class.
    def __init__(self, command = visorCommand.NO_COMMAND,binary_or_ascii= "ascii"):
        self.command = command
        self.binary_or_ascii = binary_or_ascii
    def TRX(self, INPUT=""):
        # Check input
        assert len(INPUT) <= 255
       
        ###
        # Send request:
        if self.binary_or_ascii == 'ascii':
            trigger_req = b"TRX" + '{:02}'.format(len(INPUT)).encode() + INPUT.encode()
        #tp_popup("Sending TRX request to visor: {0}".format(trigger_req))
        #tp_popup("  -> Identifier:  {0}".format(INPUT))
        
        
        return trigger_req
    def CJB(self, INPUT):
        ### Check input:
        # the job number must be smaller than 256:
        assert 0 <= INPUT < 256 
        # Create request:
        if self.binary_or_ascii == 'ascii':
            change_req = b"CJB" + '{:03}'.format(INPUT).encode()
        #tp_popup("rSending CJB request to visor: {0}".format(change_req))
        #tp_popup("  -> Asking visor to switch to job number  {0}".format(INPUT))
        return change_req
    def CJN(self, JobName):
        # Check the inputs
        assert JobName, "Error: JobName must not be empty."
        assert len(JobName) <= 999, "Error: JobName must not exceed 999 characters."
        if self.binary_or_ascii == 'ascii':
            job_name_length = str(len(JobName)).zfill(3) # Pad the string with leading zeros until it is 3 characters long
            change_req = 'CJN1{0}{1}'.format(job_name_length, JobName)
            #tp_popup("rSending CJN request to visor: {0}".format(change_req))
        #tp_popup("  -> Asking visor to switch to job name  {0}".format(INPUT))
        return change_req.encode()      
    def GJL(self):
        # Create request:
        if self.binary_or_ascii == 'ascii':
            read_job_list_req = b"GJL"
        #tp_popup("rSending CJB request to visor: {0}".format(change_req))
        #tp_popup("  -> Asking visor to switch to job number  {0}".format(INPUT))
        return read_job_list_req        

def receive_and_parse_data(visor_conn,string):
    def TRX():
        # Check whether the response refers to 'TRX':
        request_successful = "False"
        request_dictionary = {"buffer_content" : buffer_content, "request_successful" : request_successful, "trigger_mode" : None        , "job_number" : None        ,"length_of_identifier" : None, "identifier" : None, "operation_mode" : None, "length_of_result" : None, "result_data" : None,  "request_string" : "UNDEFINED", "encoding" : "ascii"}
        if buffer_content[0:3] != 'TRX':
            #tp_popup("  -> The response of the visor does not seem to be a response to the TRX command.",DR_PM_MESSAGE)
            return request_successful, request_dictionary
        # Pass / fail:
        if buffer_content[3] == 'P':
            request_successful = True
            #tp_popup(" -> TRG request successful",DR_PM_MESSAGE)
        elif buffer_content[3] == 'F':
            request_successful = False
            return request_successful, request_dictionary
            #tp_popup("   -> TRG request not successfull",DR_PM_MESSAGE)
        else:
            request_successful = False
            #tp_popup("    -> Could not decode visor's answer (successful y/n",DR_PM_MESSAGE) 
        # Identifier:
        length_of_identifier = int(buffer_content[4:6])
        if length_of_identifier == 0:
            identifier = None
            next_list_index = 6
            #tp_popup(" -> No identifier given.",DR_PM_MESSAGE)
        else:
            identifier = buffer_content[6 : 6+length_of_identifier]
            next_list_index = 6+length_of_identifier
            #tp_popup("  -> Identifier: {0}".format(identifier))
        # Operation mode:
        op_mode = buffer_content[next_list_index]
        next_list_index += 1            
        if op_mode == 'C':
            op_mode = 'Config mode'
        elif op_mode == 'R':
            op_mode = 'Run mode'
        else:
            # Don't alter string in this case
            pass
         # running  모드 예외 처리 필요
        #tp_popup("  -> visor's operation mode is: {0}".format(op_mode))
        
        # Length of result output:
        length_of_result =  int(buffer_content[next_list_index : next_list_index + 8])
        next_list_index += 8
        # Result data:
        result_data = buffer_content[next_list_index : next_list_index + length_of_result]
        #tp_popup("  -> The result data is: {0}".format(result_data))            
        # Check whether the given data length coincides with the length as state by the response string.
        if next_list_index + length_of_result == len(buffer_content):
            request_dictionary = {"buffer_content" : buffer_content, "request_successful" : request_successful, "trigger_mode" : None        , "job_number" : None        ,"length_of_identifier" : length_of_identifier, "identifier" : identifier, "operation_mode" : op_mode, "length_of_result" : length_of_result, "result_data" : result_data, "request_string" : "TRX", "encoding" : "ascii"}
        else:
            #tp_popup("Error during decoding of TRX answer: response length does not coincide with length as stated by response.",DR_PM_MESSAGE)
            request_dictionary = {"buffer_content" : buffer_content, "request_successful" : None              , "trigger_mode" : None        , "job_number" : None        ,"length_of_identifier" : None, "identifier" : None, "operation_mode" : None, "length_of_result" : None, "result_data" : None, "request_string" : "TRX", "encoding" : "ascii"} 
        return request_successful, request_dictionary
    def CJB():
        request_successful = "False"
        request_dictionary = {"buffer_content" : buffer_content, "request_successful" : request_successful, "trigger_mode" : None, "job_number" : None                , "length_of_identifier" : None, "identifier" : None, "operation_mode" : None, "length_of_result" : None, "result_data" : None, "request_string" : "UNDEFINED", "encoding" : "ascii"}
         
        # Check whether the response refers to 'CJB':
        if buffer_content[0:3] != 'CJB':
            #tp_popup(" -> The response of the visor does not seem to be a response to the CJB command.",DR_PM_MESSAGE)
      
            return request_successful, request_dictionary
        # Pass/fail:
        if buffer_content[3] == 'P':
            request_successful = True
            #tp_popup(" -> CJB request successful",DR_PM_MESSAGE)
        elif buffer_content[3] == 'F':
            request_successful = False
            #tp_popup("   -> CJB request not successful",DR_PM_MESSAGE)
            return request_successful, request_dictionary
        else:
            request_successful = False
            #tp_popup(" -> Could not decode visor's answer (successful y/n)",DR_PM_MESSAGE)
        # Operating mode, trigger or free run:
        if buffer_content[4] == 'T':
            trigger_mode = "Trigger mode"
            #tp_popup("  -> visor is in trigger mode",DR_PM_MESSAGE)
        elif buffer_content[4] == 'F':
            trigger_mode = "Freerun mode"
            #tp_popup("  -> visor is in freerun mode",DR_PM_MESSAGE)
        else:
            trigger_mode = ""
            #tp_popup(" -> Could not decode visor's answer (trigger/freerun)",DR_PM_MESSAGE)
        # Job number:
        job_number = int(buffer_content[5:])
       # tp_popup("  -> Changed to job number {0}".format(job_number))
       
        request_dictionary = {"buffer_content" : buffer_content, "request_successful" : request_successful, "trigger_mode" : trigger_mode, "job_number" : job_number  ,"length_of_identifier" : None, "identifier" : None, "operation_mode" : None, "length_of_result" : None, "result_data" : None, "request_string" : "CJB", "encoding" : "ascii"}
        
        return request_successful, request_dictionary
    def CJN():
        request_successful = "False"
        request_dictionary = {"buffer_content" : buffer_content, "request_successful" : request_successful, "trigger_mode" : None, "job_name" : None                , "length_of_identifier" : None, "identifier" : None, "operation_mode" : None, "length_of_result" : None, "result_data" : None, "request_string" : "UNDEFINED", "encoding" : "ascii"}
        #tp_popup("{0}".format(buffer_content)) 
        # Check whether the response refers to 'CJN':
        if buffer_content[0:3] != 'CJN':
            #tp_popup(" -> The response of the visor does not seem to be a response to the CJN command.",DR_PM_MESSAGE)
      
            return request_successful, request_dictionary
        # Pass/fail:
        if buffer_content[3] == 'P':
            request_successful = True
            #tp_popup(" -> CJN request successful",DR_PM_MESSAGE)
        elif buffer_content[3] == 'F':
            request_successful = False
            #tp_popup("   -> CJN request not successful",DR_PM_MESSAGE)
            return request_successful, request_dictionary
        else:
            request_successful = False
            #tp_popup(" -> Could not decode visor's answer (successful y/n)",DR_PM_MESSAGE)
        # Operating mode, trigger or free run:
        if buffer_content[4] == 'T':
            trigger_mode = "Trigger mode"
            #tp_popup("  -> visor is in trigger mode",DR_PM_MESSAGE)
        elif buffer_content[4] == 'F':
            trigger_mode = "Freerun mode"
            #tp_popup("  -> visor is in freerun mode",DR_PM_MESSAGE)
        else:
            trigger_mode = ""
            #tp_popup(" -> Could not decode visor's answer (trigger/freerun)",DR_PM_MESSAGE)
        # Job name:
        job_name = str(buffer_content[5:])
       # tp_popup("  -> Changed to job name {0}".format(job_name))
       
        request_dictionary = {"buffer_content" : buffer_content, "request_successful" : request_successful, "trigger_mode" : trigger_mode, "job_name" : job_name  ,"length_of_identifier" : None, "identifier" : None, "operation_mode" : None, "length_of_result" : None, "result_data" : None, "request_string" : "CJN", "encoding" : "ascii"}
        
        return request_successful, request_dictionary        
        
    def GJL():
        request_successful = "False"    
        request_dictionary = {"buffer_content" : buffer_content, "request_successful" : request_successful, "trigger_mode" : None, "job_number" : None, "length_of_identifier" : None, "identifier" : None, "operation_mode" : None, "length_of_result" : None, "result_data" : None, "request_string" : "UNDEFINED", "encoding" : "ascii"}
        #tp_popup("{0}".format(buffer_content))
        if buffer_content[0:3] != 'GJL':
            return request_successful, request_dictionary
 
        # Pass/fail:
        if buffer_content[3] == 'P':
            request_successful = True
            
        elif buffer_content[3] == 'F':
            request_successful = False
            return request_successful, request_dictionary
            
        else:
            request_successful = False
        
        front = 13 # job name 시작 길이 점
        end = 16 # job name 끝 길이 점 
        name_front = 16 # job name 시작 점
        job_length = int(buffer_content[front:end]) # job name 길이
        count = len(buffer_content) - 47 -  job_length # 패킷 길이 - 변하지 않는 나머지 패킷 - job name length
        
        job_list = []
        job_list.append(buffer_content[name_front:name_front+job_length])
        
        while count != 0 :
            front = name_front+job_length+ 31 # job name 시작 길이 점
            end =  name_front+job_length+ 34 # job name 끝 길이 점 
            name_front =name_front+job_length+ 34 # job name 시작 점
            job_length = int(buffer_content[front:end]) # job name 길이
            count = count - 34 - job_length 
       
            job_list.append(buffer_content[name_front:name_front+job_length])
            #tp_popup(" {0}" .format(job_list))
       
        request_dictionary = {"buffer_content" : buffer_content, "request_successful" : request_successful,"job_list" : job_list }
        return request_successful, request_dictionary
    # CUSTOMARY FUNCTIONS:
    
    ready = select.select([visor_conn], [], [], DR_VS_TIMEOUT)
    #tp_popup("{0}".format(ready))
    buffer_content= None  
    if ready[0]:
        buffer_content = visor_conn.recv(1024) 

    else:
        DRCF._vision_system_error(1002,"visor")
    # Decode buffer content:
    if binary_or_ascii == 'ascii':
        # Convert form binary to string:
        buffer_content = buffer_content.decode()
        #tp_popup("visor response to TRX request: {0}".format(buffer_content))
        # Check whether the response refers to 'TRX':
        if buffer_content[0:3] == 'TRX':
            request_successful, request_dictionary = TRX()
            return request_successful, request_dictionary 
        # Check whether the response refers to 'CJB':            
        if buffer_content[0:3] == 'CJB':
            request_successful, request_dictionary = CJB()
            return request_successful, request_dictionary
        # Check whether the response refers to 'GJL':                            
        if buffer_content[0:3] == 'CJN':
            request_successful, request_dictionary = CJN()
            return request_successful, request_dictionary                  
        # Check whether the response refers to 'GJL':                            
        if buffer_content[0:3] == 'GJL':
            request_successful, request_dictionary = GJL()
            return request_successful, request_dictionary                
      
def extract_data_from_bin_contour_answer(response_dict, delimiter = ','):
    result_list = response_dict['result_data']
    #tp_popup("{0}".format(result_list))
    assert result_list != None, "Result list is empty!"
    assert binary_or_ascii in ['ascii', 'binary'], ("Wrong input value for binary_or_ascii variable!")
    if binary_or_ascii == 'ascii':
        result_list = result_list.split(',')
        #assert len(result_list) >= 4, "Result list has wrong number of items! Maybe you forgot to set '" + delimiter + "' as delimiter?"
        pos=-1
        var_list=[]
        
        if len(result_list) >= 4 and result_list[0]=="pos":
            pos=[int(result_list[1])/ 1000, int(result_list[2])/1000, 0, 0, 0, int(result_list[3])/1000]
            
        else:
            return -1,[]
        if result_list[4] == "P":
            var_list.append(1)
        for i in range(len(result_list)):
            if i >=5:
                var_list.append(int(result_list[i])/1000)
           
        return pos, var_list
        

# =============================================================================================
# @brief      visor sensopart 비전 센서 연결
# @details    vs_connect 호출시 실행
# @param      ip address (string)
# @return     연결성공 1, 연결실패 -1
# @exception  

def visor_robotic_connect(ip_addr):
    global telnet_sock,binary_or_ascii,version
    # Check the input variables and set them accordingly:
    assert type(ip_addr) == str
    # Check the input for "binary_or_ascii":
    assert ('ascii' == binary_or_ascii.lower()) or ('binary' == binary_or_ascii.lower())
    binary_or_ascii = binary_or_ascii.lower()
    telnet_sock = client_socket_open(ip_addr, 1998)
    client_socket_write(telnet_sock, b"GSI1")   
    time.sleep(DR_VS_WAIT)
    res, rx_data = client_socket_read(telnet_sock, -1, DR_VS_TIMEOUT)
    version = rx_data[10:14]
    #tp_popup("{0}".format(rx_data[10:14]))
    res=client_socket_close(telnet_sock)   
    telnet_sock = client_socket_open(ip_addr, 2006)


# =============================================================================================
# @brief      visor sensopart 비전 센서 해제
# @details    vs_disconnect 호출시 실행
# @param      없음
# @return     해제성공 1, 해제실패 -1
# @exception  

def visor_robotic_disconnect(): 
    global telnet_sock
    res=client_socket_close(telnet_sock)   
    if res!=0:
        raise DR_Error(DR_ERROR_VALUE, "Disconnect fail")
        return -1
    
    return 1
    
# =============================================================================================
# @brief      센서에 측정명령 전달, 측정결과 데이터 불러오기
# @details    센서 출력값 형식 : pos,x,y,angle,var1,var2,...
# @param      없음
# @return     posx, var_list / 측정실패시 -1, []
# @exception  
def eulxyz2eulzyz(theta):
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
    
def visor_robotic_trigger():
    global telnet_sock
    req= RequestClass(command = visorCommand.TRIGGER,binary_or_ascii= "ascii")
    telnet_sock.sendall(req.TRX("test"))
    request_successful, request_dictionary = receive_and_parse_data(telnet_sock, "visor_trigger")
    if request_successful == True:
        pos, var_list =extract_data_from_bin_contour_answer(request_dictionary,',')
        eul = eulxyz2eulzyz([pos[3], pos[4], pos[5]])
        tp_log("eul"+str(eul))
        return [pos[0], pos[1],pos[2], eul[0], eul[1],eul[2]], var_list        
    else:
        return -1,[]
        
# =============================================================================================
# @brief      입력된 번호로 비전센서의 설정작업으로 로딩함.
# @details    .
# @param      job_number(int) - 대상작업
# @return     성공시 1, 실패시 -1
# @exception  

def visor_robotic_job_change(INPUT):
    global telnet_sock
    req= RequestClass(command = visorCommand.JOB_CHANGE,binary_or_ascii= "ascii")
    telnet_sock.sendall(req.CJB(INPUT))
    request_successful, request_dictionary = receive_and_parse_data(telnet_sock, "visor_job_change")
    #tp_popup("{0}".format(request_dictionary))
    if request_successful == True:
        return 1    
    else:
        return -1


# =============================================================================================
# @brief      입력된 이름으로 비전센서의 설정작업으로 로딩함.
# @details    .
# @param      job_name(string) - 대상작업
# @return     성공시 1, 실패시 -1
# @exception  

def visor_robotic_job_change_name(INPUT):
    global telnet_sock
    req= RequestClass(command = visorCommand.JOB_CHANGE_JOB_NAME,binary_or_ascii= "ascii")
    telnet_sock.sendall(req.CJN(INPUT))
    request_successful, request_dictionary = receive_and_parse_data(telnet_sock, "visor_job_change")
    #tp_popup("{0}".format(request_dictionary))
    if request_successful == True:
        return 1    
    else:
        return -1        
                       
# =============================================================================================
# @brief      저장된 작업파일 리스트 불러오기
# @details    비전작업파일(job)의 리스트를 얻어온다.
# @param      없음
# @return     성공시 job_name[list(string)] / 실패시 -1
# @exception  

def visor_robotic_get_job_list():
    global telnet_sock
    req= RequestClass(command = visorCommand.READ_JOB_LIST,binary_or_ascii= "ascii")
    telnet_sock.sendall(req.GJL())
    request_successful, request_dictionary = receive_and_parse_data(telnet_sock,"visor_get_job_list")
    if request_successful == True:
        #tp_popup("{0}".format(request_dictionary['job_list']))
        return request_dictionary['job_list']
    else:
        return -1    
                
# =============================================================================================
# @brief      입력된 작업을 비전센서의 설정작업으로 로딩함.
# @details    입력된 작업은 재부팅 후에도 초기작업으로 설정됨.
# @param      job_name(string) - 대상작업
# @return     성공시 1, 실패시 -1
# @exception  

def visor_robotic_set_job(job_name):
    global telnet_sock    
    vs_data = visor_robotic_get_job_list()
    if vs_data != -1:                
        for i in range(len(vs_data)):
            if job_name == vs_data[i]:
                visor_robotic_job_change(i+1)
    else:
        return -1
            
    return 1
        
    
# =============================================================================================
# @brief      현재 설정된 작업 불러오기
# @param      없음
# @return     성공시 job_name(string), 실패시 -1
# @exception  

def visor_robotic_get_job():
    global telnet_sock
    req= RequestClass(command = visorCommand.READ_JOB_LIST,binary_or_ascii= "ascii")
    telnet_sock.sendall(req.GJL())
    request_successful, request_dictionary = receive_and_parse_data(telnet_sock,"visor_get_job")
    #tp_popup("{0}".format(request_dictionary['buffer_content'][10:13]))
    if request_successful == True:    
        job_name = request_dictionary['job_list'][int(request_dictionary['buffer_content'][10:13])-1]
        #tp_popup("{0}".format(job_name))
        return job_name 
    else:
        return -1


# Detection
def Detection():
    global CameraIp,Port,VisionJob,ShootPose,VisionPose,PickingPose
    
    visor_robotic_connect(CameraIp)             # Vision IP, Default port
    
    #movej(ShootPose)           # Move to shoot pose
    vis_posx = VisionPose      # Define the initial posx data - vision
    rob_posx = PickingPose      # Define the initial posx data - robot 
    tp_log(str(vis_posx)) 
    vs_set_init_pos(vis_posx, rob_posx, VS_POS1) # Enter the initial posx data to Vision
  
    visor_robotic_job_change_name(VisionJob)
  
    pos, var_list = visor_robotic_trigger()               # Execute the vision meausrement   
    tp_log("pos:"+str(pos))  
    tp_log("var:"+str(var_list))   
    robot_posx_meas=[0,0,0,0,0,0]
    if var_list[0] == 1:                      # Check the inspection result
      robot_posx_meas = vs_get_offset_pos(pos, VS_POS1) # offset the robot pose
      tp_log(str(robot_posx_meas))
      movel(robot_posx_meas)
    else:
      tp_log("Inspection Fail")  
    visor_robotic_disconnect()
    return robot_posx_meas

  


  `
