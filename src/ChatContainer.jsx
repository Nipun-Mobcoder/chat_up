import { useEffect, useState } from 'react'
import SideBar from './SideBar'
import ChatComponent from './ChatComponent'
import { useNavigate } from 'react-router-dom';

const ChatContainer = () => {
    const navigate = useNavigate();
  
    useEffect(() => {
        if (!localStorage.getItem('token')) navigate('/');
    }, [navigate]);
    
    
    const [curUser, setCurUser] = useState(localStorage.getItem('name') === 'Harsh' ? '66d6b9eb938bb2bdcdfe231d' : '66d6b9e0938bb2bdcdfe231b')
    
    return (
        <>
            <SideBar curUser={curUser} setCurUser={setCurUser} />
            <ChatComponent curUser={curUser} />
        </>
    )
}

export default ChatContainer