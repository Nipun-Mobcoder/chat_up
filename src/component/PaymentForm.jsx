/* eslint-disable react/prop-types */
import { useEffect } from "react";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
} from "@mui/material";
import { gql, useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";

const CUR_USER = gql`
  query CurUser {
    curUser {
      id
      user
    }
  }
`;

const PaymentForm = ({ open, onClose, formData, setFormData, setFormSent }) => {


  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/");
  }, [navigate]);

  const token = localStorage.getItem("token");

  const { data: msg, loading: loader } = useQuery(CUR_USER, {
    context: { headers: { token, "x-apollo-operation-name": "1" } },
  });

  if (loader) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const { curUser } = msg;
  const users = curUser.map((user) => user.id);

  const currencies = ["USD", "EUR", "INR", "JPY"];
  const recipients = users;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSent(true);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Transaction Form</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Amount"
            name="amount"
            type="number"
            fullWidth
            margin="normal"
            value={formData.amount}
            onChange={handleChange}
            required
          />

          <FormControl fullWidth margin="normal">
            <InputLabel id="currency-label">Currency</InputLabel>
            <Select
              labelId="currency-label"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              required
            >
              {currencies.map((currency) => (
                <MenuItem key={currency} value={currency}>
                  {currency}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="toWhom-label">To Whom</InputLabel>
            <Select
              labelId="toWhom-label"
              name="toWhom"
              value={formData.toWhom}
              onChange={handleChange}
              required
            >
              {recipients.map((recipient) => (
                <MenuItem key={recipient} value={recipient}>
                  {recipient}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentForm;
