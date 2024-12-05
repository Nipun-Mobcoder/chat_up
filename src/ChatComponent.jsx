import { useState, useEffect, useCallback } from 'react';
import { Box, TextField, Button, Typography, Paper, Divider, CircularProgress, IconButton, Avatar, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { gql, useLazyQuery, useMutation, useQuery, useSubscription } from '@apollo/client';
import { AttachFile, Payment } from '@mui/icons-material';
import axios from "axios";
import PropTypes from 'prop-types';

import PaymentForm from './component/PaymentForm';
import PaymentButton from './component/Payment';
import PaymentMessage from './component/PaymentMessage';
// import decryptMessage from './helper/decryptMessage';

function isImage(url) {
  const cleanUrl = url.split('?')[0];
  return /\.(jpg|jpeg|png|gif|bmp|svg)$/i.test(cleanUrl);
}

const SEND_MESSAGE = gql`
  mutation message($to: ID!, $message: String, $file: Upload) {
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
            date
            paymentAmount
            currency
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
            paymentAmount
            currency
            date
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

const DECRYPT_MESSAGE = gql`
    query Query($encryptedText: String!, $sender: Boolean!) {
      decrypt(encryptedText: $encryptedText, sender: $sender)
    }
`


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

  const [decrypt] = useLazyQuery(DECRYPT_MESSAGE, {
    context: { headers: { token, "x-apollo-operation-name": "1" } }
  }); 

  const [complete] = useMutation(COMPLETE_MULTIPART, {
    context: { headers: { token, "x-apollo-operation-name": "1" } }
  });

  const { data: msg, loading: loader } = useQuery(SHOW_MESSAGE, {
    variables: { sender: curUser.id },
    context: { headers: { token } }
  });

  const { data: subscriptionData } = useSubscription(SUBSCRIBE, {
    variables: { tokenId: token, userId: curUser.id }
  });

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const reciever = curUser.id;

  const [showForm, setShowForm] = useState(false);
  const [formSent, setFormSent] = useState(false);

  const [formData, setFormData] = useState({
    amount: "",
    currency: "",
    toWhom: reciever.toString() || "",
  });

  const onClose = () => {
    setShowForm(false)
  } 

  const handleToggleForm = () => {
    setShowForm((prev) => !prev);
  };

  useEffect(() => {
      if (msg) {
        setMessages(msg.showUserMessage);
      }
  }, [msg]);

  const decryptFunction = useCallback(
    async (message, sender) => {
      try {
        const send = sender === localStorage.getItem('name')
        const { data } = await decrypt({
          variables: {
            sender: send,
            encryptedText: message,
          },
          context: {
            headers: { token, "x-apollo-operation-name": "1" },
          },
        });
        return data?.decrypt || message;
      } catch (error) {
        console.error("Decryption error:", error);
        return message;
      }
    },
    [decrypt, token]
  );

  useEffect(() => {
    if (subscriptionData && subscriptionData.showUsersMessages) {
      const date = new Date();
      (async () => {
        const decryptedMessage = await decryptFunction(subscriptionData.showUsersMessages.message, true);
        const newMessage = {
          ...subscriptionData.showUsersMessages,
          message: decryptedMessage,
          createdAt: `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`,
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      })();
    }
  }, [decryptFunction, subscriptionData]);

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

        await complete({
          variables: { fileName: file.name, uploadId: startData.startMultipart, parts, to: reciever },
        });
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column', width: '100%' }}>
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
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: ms.sender === localStorage.getItem('name') ? 'flex-end' : 'flex-start',
                my: 2,
                maxWidth: '100%',
              }}
            >
            <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
              {ms.sender.charAt(0).toUpperCase()}
            </Avatar>
            
            <Stack sx={{ maxWidth: '80%' }}>
              {!ms.paymentAmount && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                  {ms.sender} ({ms.date ?? ''}, {ms.createdAt})
                </Typography>
              )}
              {!ms.file && !ms.paymentAmount && 
                <Box
                  sx={{
                    maxWidth: '100%',
                    bgcolor: ms.sender === localStorage.getItem('name') ?  "#e6fee1" : "#e1f5fe",
                    padding: "8px 12px",
                    borderRadius: "12px",
                    margin: "8px 0",
                    wordWrap: "break-word",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "break-word"
                  }}
                > 
                  <Typography variant="body1">
                    {!ms.file && !ms.paymentAmount && ms.message}
                  </Typography>
                </Box>
              }
              {ms.file && (
                isImage(ms.file.url) ? (
                  <img
                    src={ms.file.url}
                    alt="Uploaded file"
                    style={{ maxWidth: '100%', borderRadius: '12px', marginTop: '8px' }}
                  />
                ) : (
                  <video
                    src={ms.file.url}
                    controls
                    style={{ maxWidth: '100%', borderRadius: '12px', marginTop: '8px' }}
                  />
                )
              )}
              {ms.paymentAmount && (
                <PaymentMessage
                  userName={ms.sender}
                  date={ms.date ?? ''}
                  createdAt={ms.createdAt ?? ''}
                  amount={ms.paymentAmount}
                  currency={ms.currency}
                />
              )}
            </Stack>
          </Box>
          
          ))}
          {showForm && <PaymentForm onClose={onClose} open={showForm} formData={formData} setFormData={setFormData} setFormSent={setFormSent} />}
          {formSent && <PaymentButton amount={formData.amount} currency={formData.currency} whom={curUser.id} setFormSent={setFormSent} />}
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
          <IconButton component="span" sx={{ mr: 2 }} onClick={handleToggleForm}>
              <Payment />
          </IconButton>
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
    curUser: PropTypes.object.isRequired,
};

export default ChatComponent;