import { useState, useEffect } from 'react'
import './App.css'
import {gql, useLazyQuery} from "@apollo/client"
import {
  Avatar,
  Button,
  TextField,
  Box,
  Typography,
  Container,
  Paper,
  CircularProgress
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNavigate } from 'react-router-dom';

const GET_TOKEN = gql `
  query loginToken($email: String!, $password: String!) {
    login(email: $email, password: $password)
  }
`

function App() {
  const navigate = useNavigate();
  useEffect(()=> {
    if(localStorage.getItem("token")){
      navigate('/chat');
    }
  },[navigate])

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [getToken, { loading, error, data }] = useLazyQuery(GET_TOKEN);

  const handleSubmit = (event) => {
    event.preventDefault();
    getToken({ variables: { email, password } });
  
    if(loading) return <CircularProgress sx={{ justifyContent: 'center', alignItems: 'center' }} />;
  };

  useEffect(() => {
    if (data) {
      localStorage.setItem('token', data.login);
      navigate('/chat');
    }
  }, [data, navigate]);


  return (
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={10}
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 4,
            borderRadius: 2,
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, bgcolor: 'primary.main' }}
            >
              Sign In
            </Button>
          </Box>
        </Paper>
      </Container>
  );
}

export default App
