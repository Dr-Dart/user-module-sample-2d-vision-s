import React, {useState, useEffect} from "react";
import { ModuleContext } from 'dart-api';
import { Button, FormControl, FormGroup, FormLabel, MenuItem, Select,SelectChangeEvent } from "@mui/material";

import { messages } from '../messages'


function Get_JobList(buffer_content: string): string[]
{
    if (!buffer_content || buffer_content.length === 0) {
        return [];
    }
    let front = 13; // job name starting length point
    let end = 16; // job name ending length point
    let name_front = 16; // job name starting point
    let job_length = parseInt(buffer_content.slice(front, end)); // job name length

    let count = buffer_content.length - 47 - job_length; // packet length - fixed remaining packet - job name length

    let job_list = [];
    job_list.push(buffer_content.slice(name_front, name_front + job_length));

    while (count !== 0) {

        front = name_front + job_length + 31; // job name starting length point
        end = name_front + job_length + 34; // job name ending length point
        name_front = name_front + job_length + 34; // job name starting point
        job_length = parseInt(buffer_content.slice(front, end)); // job name length
        count = count - 34 - job_length;

        job_list.push(buffer_content.slice(name_front, name_front + job_length));
    }

    return job_list;
}

interface visionProps {
    className: string;
    moduleContext: ModuleContext;
    IVisionJob: string;
    sendMessageTCP: (tcpMsg: string) => void;
    receivedMsg: string;
    updateVisionJob: (jobName: string) => void;
    onUpdateDB: () => void
}


export function VisionJob({className, moduleContext,  IVisionJob, sendMessageTCP, receivedMsg, updateVisionJob, onUpdateDB }: visionProps) {
  
    const { packageName } = moduleContext;

    const [jobList, setJobList] = useState<string[]>([]);
    const [selectedJobName, setSelectedJobName] = useState(IVisionJob);
    const [selectedJob, setSelectedJob] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        setSelectedJobName(IVisionJob);
    }, [IVisionJob]);
    useEffect(() => {
    
        if (isLoading &&typeof receivedMsg === 'string' && receivedMsg.startsWith("GJLP")) {        

        const extractedJobList = Get_JobList(receivedMsg);
        if(extractedJobList.length > 0 ){
         
            setJobList(extractedJobList);
       
        }else{
     
            setJobList([]);
     
        }
       
        setIsLoading(false);
 
        setOpen(true);
 
    
    }

      }, [receivedMsg, isLoading]);
    

    const handleOpen= () => {
        
        sendMessageTCP("GJL")
     
      
    }

    const handleChange = (event: SelectChangeEvent<string>) => {

        const newSelectedJob = event.target.value;
        setSelectedJobName(newSelectedJob);
        setSelectedJob(event.target.value);
    
    
            updateVisionJob(newSelectedJob);
        
    };

    const handleSelectOpen = (event: React.MouseEvent<HTMLElement>) => {
            event.preventDefault();
            setIsLoading(true);
            handleOpen();

    };
    const handleClose = () => {
        setOpen(false);
    };
    function jobNumberToString(jobNumber: number): string {
        return `job${jobNumber}`;
      }
    const extractAndFormatJobNumber = (job: string) => {

        const jobNumber = job.match(/\d+/);
        if (jobNumber) {

          const formattedNumber = String(jobNumber[0]).padStart(3, '0');
          return formattedNumber;
        }

        return null;
      };
    
  

    const changeJobName = () =>{

        console.log(`Command: ${selectedJob}`);
        const job_name_length = String(selectedJob.length).padStart(3, '0'); // Pad the string with leading zeros until it is 3 characters long
        const command = `CJN1${job_name_length}${selectedJob}`; 

        sendMessageTCP(command);
    }

    const handleApplyBtnClick = () =>{
        changeJobName()
    }


    return (
        <FormControl size={"small"} className={`${className["option-contents"]} ${className["vision-job"]}`}>
            
            <div className={className["form-label-wrapper"]}>
                <FormLabel disabled={false}>{messages.form_label_002}</FormLabel>
            </div>
            <FormGroup row={true} className={className["vision-job-wrapper"]}>
                <Select 
                    value={selectedJobName}
                    onChange={handleChange}   
                    onMouseDown={handleSelectOpen}
                    onClose={handleClose}

                    open={open}
                    displayEmpty
                    renderValue={value => value?.length ? Array.isArray(value) ? value.join(', ') : value : <div className={className["place-holder"]}>{messages.select_placeholder_001}</div>}

                >
                    {jobList.map((job, index) => (
                        <MenuItem key={index} value={job}>{job}</MenuItem>
                    ))}
                </Select>
                <Button onClick={handleApplyBtnClick} color={"secondary"} size={"small"} disabled={false}>
		{messages.btn_apply}</Button>
            </FormGroup>
        </FormControl>
    );
}
