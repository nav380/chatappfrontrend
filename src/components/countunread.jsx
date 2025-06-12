import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const CountUnread = ({ activeTab }) => {

    // Extract messages from both group chat and individual chat
    const { messages: groupMessages } = useSelector((state) => state.groupChat);
    const { messages: chatMessages } = useSelector((state) => state.chat);

    const username = typeof window !== "undefined" ? localStorage.getItem("username") : null;
    const [unread, setunread] = useState(0)










    useEffect(() => {
        if (activeTab === "user") {
            setunread(0)
            const unreadChatMessages = groupMessages?.filter(msg => !msg.user_has_read && msg.sender.username !== username).length || 0;
            setunread(unreadChatMessages)
        }


    }, [groupMessages,activeTab])

    useEffect(() => {
        if (activeTab === "group") {
            setunread(0)
            const unreadChatMessages = chatMessages?.filter(msg => !msg.read && msg.sender.username !== username).length || 0;
            setunread(unreadChatMessages)
        }

    }, [chatMessages,activeTab])

    return (
        <>
            {unread > 0 &&
                (<div className="flex absolute p-2 z-50 top-0 right-0">
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {unread}
                    </span>
                </div>
                )
            }
        </>
    );
}

export default CountUnread;

