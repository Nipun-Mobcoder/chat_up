import { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper, Divider, CircularProgress, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { gql, useLazyQuery, useMutation, useQuery, useSubscription } from '@apollo/client';
import { AttachFile } from '@mui/icons-material';
import axios from "axios";
import PropTypes from 'prop-types';

const SEND_MESSAGE = gql`
  mutation message($to: String!, $message: String, $file: Upload) {
    sendMessage(to: $to, message: $message, file: $file)
  }
`;

const SHOW_MESSAGE = gql`
    query messages($sender: String!) {
        showUserMessage(sender: $sender) {
            file {
                url
            }
            message
            sender
            createdAt
        }
    }
`;

const SUBSCRIBE = gql`
    subscription subscribe ($tokenId: String!, $userId: String!) {
        showUsersMessages(tokenId: $tokenId, userId: $userId) {
            file {
                url
            }
            message
            sender
        }
    }
`;

const START_MULTIPART = gql`
    query multipart($fileName: String!, $contentType: String!) {
      startMultipart(fileName: $fileName, contentType: $contentType)
    }
`;

const GENERATE_MULTIPART = gql`
    query generate($fileName: String!, $uploadId: String!, $partNumbers: Int!) {
      generateMultipart(fileName: $fileName, uploadId: $uploadId, partNumbers: $partNumbers)
    }
`;


const COMPLETE_MULTIPART = gql`
    mutation complete($fileName: String!, $uploadId: String!, $parts: [PartType!]!, $to: String!) {
      complete(fileName: $fileName, uploadId: $uploadId, parts: $parts, to: $to)
    }
`;


function ChatComponent({curUser}) {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!localStorage.getItem('token')) navigate('/');
  }, [navigate]);

  const token = localStorage.getItem('token');

  const [mutateFunction] = useMutation(SEND_MESSAGE, {
    context: { headers: { token, "x-apollo-operation-name": "1" } }
  });

  const [start] = useLazyQuery(START_MULTIPART, {
    context: { headers: { token, "x-apollo-operation-name": "1" } }
  });

  const [generate] = useLazyQuery(GENERATE_MULTIPART, {
    context: { headers: { token, "x-apollo-operation-name": "1" } }
  });

  const [complete] = useMutation(COMPLETE_MULTIPART, {
    context: { headers: { token, "x-apollo-operation-name": "1" } }
  });

  const { data: msg, loading: loader } = useQuery(SHOW_MESSAGE, {
    variables: { sender: curUser },
    context: { headers: { token } }
  });

  const { data: subscriptionData } = useSubscription(SUBSCRIBE, {
    variables: { tokenId: token, userId: curUser }
  });

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const reciever = curUser;

  useEffect(() => {
    if (msg) {
      setMessages(msg.showUserMessage);
    }
  }, [msg]);

  useEffect(() => {
    if (subscriptionData && subscriptionData.showUsersMessages) {
        const date = new Date();
        const newMessage = {...subscriptionData.showUsersMessages, createdAt: `${date.getHours()}:${date.getMinutes()}`};
        setMessages((prevMessages) => [...prevMessages, newMessage]);
    }
  }, [subscriptionData]);

  if (loader) {
    return <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      width: '100%' 
    }}
  >
    <CircularProgress />
  </Box>;
  }

  const handleSendMessage = () => {
    if ((newMessage.trim() && newMessage.trim() !== "")) {
      mutateFunction({
        variables: { to: reciever, message: newMessage, file: null },
        context: { headers: { token, "x-apollo-operation-name": "1"} }
      });
      setNewMessage('');
    }
  };

  const handleFileUpload = async (file) => {
    const totalSize = file.size;
    const partNumbers = Math.ceil(totalSize / 10000000);
    
    const { data: startData } = await start({
      variables: { fileName: file.name, contentType: file.type },
    });
  
    if (startData && startData.startMultipart) {
      const { data: generateData } = await generate({
        variables: { fileName: file.name, uploadId: startData.startMultipart, partNumbers },
      });
  
      const preSignedUrls = generateData?.generateMultipart;
      if (preSignedUrls) {
        let parts = [];
        const uploadPromises = [];
  
        for (let i = 0; i < partNumbers; i++) {
          let start = i * 10000000;
          let end = Math.min(start + 10000000, totalSize);
          let chunk = file.slice(start, end);
          let presignedUrl = preSignedUrls[i];
  
          uploadPromises.push(
            axios.put(presignedUrl, chunk, {
              headers: {
                "Content-Type": file.type,
              },
            })
          );
        }
  
        const uploadResponses = await Promise.all(uploadPromises);
  
        uploadResponses.forEach((response, i) => {
          parts.push({
            etag: response.headers.etag,
            PartNumber: i + 1,
          });
        });

        const { data: completeData } = await complete({
          variables: { fileName: file.name, uploadId: startData.startMultipart, parts, to: reciever },
        });
  
        console.log(completeData);
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column', }}>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <Paper elevation={3} sx={{ p: 2, height: '100%', mt: '40px' }}>

          <Divider sx={{ mb: 2 }} />
          {messages.map((ms, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'gray' }}>
                {ms.sender} {ms.createdAt}
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
              const file = e.target.files[0];
              if(file.size < 10000000){
                mutateFunction({
                  variables: { to: reciever, message: '', file },
                  context: { headers: { token, "x-apollo-operation-name": "1"} }
                });
              }
              else {
                handleFileUpload(e.target.files[0]);
              }
            }
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

ChatComponent.propTypes = {
    curUser: PropTypes.string.isRequired,
};

export default ChatComponent;