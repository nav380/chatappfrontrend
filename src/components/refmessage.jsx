import React, { useEffect, useState } from 'react';
import Msgtype from './msgtype';
import axios from 'axios';
import DjangoConfig from '@/config/config';

const Refmessage = ({ msg }) => {
    const [message,setMessage]=useState();

    useEffect(() => {
        if (msg.group_name) {
            fetchRefMsggroup()
        } else {
            fetchRefMsg()

        }
        
    }, []);

    const fetchRefMsggroup = async () => {
        try {
            const response = await axios.get(`${DjangoConfig.apiUrl}get_group_message_by_id/${msg.ref}`, 
                { withCredentials: true });
            setMessage(response.data)
        } catch (error) {
            console.error("Error fetching reference message:", error);
        }
    };
    const fetchRefMsg = async () => {
        try {
            const response = await axios.get(`${DjangoConfig.apiUrl}get_user_message_by_id/${msg.ref}`, 
                { withCredentials: true });
            setMessage(response.data);
        } catch (error) {
            console.error("Error fetching reference message:", error);
        }
    };

    return (
        <div className='bg-green-400 rounded-lg'>
            <Msgtype msg={message} />
        </div>
    );
};

export default Refmessage;
