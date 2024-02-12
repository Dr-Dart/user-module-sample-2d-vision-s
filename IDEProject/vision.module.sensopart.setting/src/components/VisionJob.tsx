import React, { useState, useEffect } from "react";
import { ModuleContext } from "dart-api";
import { Button, FormControl, FormGroup, FormLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";

import { messages } from '../messages'

function Get_JobList(buffer_content: string): string[] {

    if (!buffer_content || buffer_content.length === 0) {
        return [];
    }
    let front = 13;
    let end = 16;
    let name_front = 16;
    let job_length = parseInt(buffer_content.slice(front, end));
    let count = buffer_content.length - 47 - job_length;
    let job_list = [];
    job_list.push(buffer_content.slice(name_front, name_front + job_length));

    while (count > 0) {

        front = name_front + job_length + 31;
        end = front + 3;
        name_front = end;

        job_length = parseInt(buffer_content.slice(front, end));
        if (isNaN(job_length)) {
            break;
        }

        count = count - 34 - job_length;

        job_list.push(buffer_content.slice(name_front, name_front + job_length));
    }

    return job_list;
}

interface visionProps {
    className: string;
    moduleContext: ModuleContext;
    IVisionJob: number;
    sendMessageTCP: (tcpMsg: string) => void;
    receivedMsg: string;
    updateVisionJob: (jobNumber: number) => void;
    onUpdateDB: () => void
}


export function VisionJob({className, moduleContext,  IVisionJob, sendMessageTCP, receivedMsg, updateVisionJob, onUpdateDB }: visionProps) {
  
    const { packageName } = moduleContext;

    const [jobList, setJobList] = useState<string[]>([]);
    const [selectedJob, setSelectedJob] = useState(jobNumberToString(IVisionJob));
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        setSelectedJob(jobNumberToString(IVisionJob));
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
        setSelectedJob(newSelectedJob);
    
        const jobNumber = newSelectedJob.match(/\d+/);
        if (jobNumber) {
            const formattedNumber = Number(jobNumber[0]);
            updateVisionJob(formattedNumber);

        }


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
    
    const handleApplyBtnClick = () =>{
        const formattedJobNumber = extractAndFormatJobNumber(selectedJob);
          const command = `CJB${formattedJobNumber}`;
          sendMessageTCP(command);
        
    }


    return (
        <FormControl size={"small"} className={`${className["option-contents"]} ${className["vision-job"]}`}>
            
            <div className={className["form-label-wrapper"]}>
                <FormLabel disabled={false}>{messages.form_label_002}</FormLabel>
            </div>
            <FormGroup row={true} className={className["vision-job-wrapper"]}>
                <Select 
                    value={selectedJob}
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
                <Button onClick={(event) => { event.stopPropagation(); handleApplyBtnClick}} color={"secondary"} size={"small"} disabled={false}>{messages.btn_apply}</Button>
            </FormGroup>
        </FormControl>
    );
}
