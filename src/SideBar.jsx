import { Menu as MenuIcon, Logout } from '@mui/icons-material';
import { Box, Menu, Drawer, IconButton, List, ListItem, ListItemButton, ListItemText, Typography, MenuItem, CircularProgress } from '@mui/material'
import  { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';

const CUR_USER = gql`
    query CurUser {
      curUser {
        id
        user
        cur
      }
    }
`;

const SideBar = ({ curUser, setCurUser }) => {
    const [toggleMenu, setToggleMenu] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
      if (!localStorage.getItem('token')) navigate('/');
    }, [navigate]);

    const token = localStorage.getItem('token')

    const { data: msg, loading: loader, error } = useQuery(CUR_USER, {
      context: { headers: { token, "x-apollo-operation-name": "1" } }
    });

    if(error) return <div>Looks like something went wrong.</div>

    if(!loader) var users = msg.curUser;

    if(loader) {
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

    const filterUsers = users.filter(user => {
      return user.cur !== true
    })

    if(msg && !curUser) setCurUser(filterUsers[0].id);

    const drawerList = (
        <Box sx={{ height: "100%", bgcolor: '#3E103F' }}>
          <Box sx={{ width: 250,}} role="presentation" onClick={() => setToggleMenu(false)}>
            <Typography variant='h3' sx={{ p: "10px",color: 'white' }}>Users</Typography>
            <List>
                {filterUsers.map((user) => (
                <ListItem key={user.id} disablePadding >
                    <ListItemButton sx={ user.id === curUser ? { m: '5px', backgroundColor: '#2B092A', color: 'white', borderRadius: '10px' } : {m: '5px',color: 'white'}} onClick={() => setCurUser(user.id)}>
                        <ListItemText primary={user.user} />
                    </ListItemButton>
                </ListItem>
                ))}
            </List>
          </Box>
        </Box>
    )

  return (
    <header style={{ position: 'fixed', backgroundColor: '#3E103F', width: '100%',margin: '-10px', padding: "10px", zIndex: 1000,}}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
        <IconButton onClick={() => setToggleMenu(!toggleMenu)} sx={{ color: 'white' }}>
          <MenuIcon />
          <Typography variant='h5' color='white' sx={{ ml: '10px' }}>Chat Up</Typography>
        </IconButton>
        <IconButton onClick={(event)=> setAnchorEl(event.currentTarget)} sx={{ color: 'white', mr: '50px' }}>
            <Typography variant='h6'>{localStorage.getItem('name')}</Typography>
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={()=> setAnchorEl(null)}
        >
          <MenuItem onClick={() => {localStorage.removeItem('token'); navigate('/');}}>
            <Logout sx={{ mr: 1 }} />
            <Typography variant='h6'>Logout</Typography>
          </MenuItem>
        </Menu>
      </Box>
        <Drawer open={toggleMenu} onClose={() => setToggleMenu(false)}>
            {drawerList}
        </Drawer>
    </header>
  )
}

SideBar.propTypes = {
    curUser: PropTypes.string.isRequired,
    setCurUser: PropTypes.func.isRequired,
};

export default SideBar