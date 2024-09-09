import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper, Divider, CircularProgress,  MenuItem, FormControl, InputLabel, Select, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { gql, useMutation, useQuery, useSubscription } from '@apollo/client';
import { AttachFile } from '@mui/icons-material';

const SEND_MESSAGE = gql`
  mutation message($to: String!, $message: String, $file: Upload) {
    sendMessage(to: $to, message: $message, file: $file)
  }
`;

const SHOW_MESSAGE = gql`
    query {
        messages {
            file {
                url
            }
            message
            sender
        }
    }
`;

const SUBSCRIBE = gql`
    subscription subscribe($tokenId: String!) {
        showMessages(tokenId: $tokenId) {
            file {
                url
            }
            message
            sender
        }
    }
`;

function ChatApp() {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!localStorage.getItem('token')) navigate('/');
  }, [navigate]);

  const token = localStorage.getItem('token');

  const [mutateFunction] = useMutation(SEND_MESSAGE, {
    context: { headers: { token, "x-apollo-operation-name": "1" } }
  });

  const { data: msg, loading: loader } = useQuery(SHOW_MESSAGE, {
    context: { headers: { token } }
  });

  const { data: subscriptionData } = useSubscription(SUBSCRIBE, {
    variables: { tokenId: token }
  });

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [reciever, setReciever] = useState('66d6b9e0938bb2bdcdfe231b');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (msg) {
      setMessages(msg.messages);
    }
  }, [msg]);

  useEffect(() => {
    if (subscriptionData && subscriptionData.showMessages) {
      const newMessage = subscriptionData.showMessages;
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    }
  }, [subscriptionData]);

  if (loader) {
    return <CircularProgress sx={{ justifyContent: 'center', alignItems: 'center' }} />;
  }

  const handleSendMessage = () => {
    if ((newMessage.trim() && newMessage.trim() !== "") || selectedFile) {
      mutateFunction({
        variables: { to: reciever, message: newMessage, file: selectedFile },
        context: { headers: { token, "x-apollo-operation-name": "1"} }
      });
      setNewMessage('');
      setSelectedFile(null);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <Paper elevation={3} sx={{ p: 2, height: '100%' }}>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end',alignItems: 'flex-start' }}>
          <FormControl sx={{ mr: 2 }}>
          <InputLabel id="sending-to">To</InputLabel>
            <Select
            labelId='sending-to'
            id='to'
            value={reciever}
            label='To'
            onChange={(e) => setReciever(e.target.value)}
            sx={{ mr: 2 }}>
                <MenuItem value={'66d6b9e0938bb2bdcdfe231b'}>Harsh</MenuItem>
                <MenuItem value={'66d6b9eb938bb2bdcdfe231d'}>Nipun</MenuItem>
                <MenuItem value={'66d98e401f67518576761cc4'}>Aditya</MenuItem>
            </Select>
          </FormControl>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {messages.map((ms, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'gray' }}>
                {ms.sender}
              </Typography>
              <Typography variant="body1">{ms.file ? ms.file.url : ms.message}</Typography>
            </Box>
          ))}
        </Paper>

        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderTop: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e)=> {
              setSelectedFile(e.target.files[0])}
            }
            style={{ display: 'none' }}
            id="file-input"
          />
          <label htmlFor="file-input">
            <IconButton component="span" sx={{ mr: 2 }}>
              <AttachFile />
            </IconButton>
          </label>
          <TextField
            fullWidth
            variant="outlined"
            label="Type a message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button variant="contained" color="primary" sx={{ ml: 2 }} onClick={handleSendMessage}>
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default ChatApp;
