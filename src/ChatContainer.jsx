import { useEffect, useState } from 'react'
import SideBar from './SideBar'
import ChatComponent from './ChatComponent'
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';

const ChatContainer = () => {
    const navigate = useNavigate();
  
    useEffect(() => {
        if (!localStorage.getItem('token')) navigate('/');
    }, [navigate]);
    
    
    const [curUser, setCurUser] = useState('')
    
    return (
        <>
            <SideBar curUser={curUser} setCurUser={setCurUser} />
            { curUser && <ChatComponent curUser={curUser} /> }
            { !curUser && 
                <Box 
                    sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '100vh',
                        width: '100%' 
                    }}
                    > 
                    Please choose the person to contact.
                </Box> }
        </>
    )
}

export default ChatContainer