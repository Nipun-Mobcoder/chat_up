import PropTypes from "prop-types";
import { Box, Typography, Paper } from "@mui/material";

const PaymentMessage = ({ userName, date, createdAt, amount, currency }) => {
  return (
    <Box display="flex" alignItems="center" my={2} sx={{ bgcolor: "black" }}>

      <Paper elevation={2} sx={{ p: 2,  maxWidth: "300px" }}>
        <Typography variant="body1" fontWeight="bold">
          {userName} paid {currency} {amount}
        </Typography>
        <Typography variant="caption" color="text.secondary">
            {userName} ({date ?? ''}, {createdAt})
        </Typography>
      </Paper>
    </Box>
  );
};

PaymentMessage.propTypes = {
  userName: PropTypes.string.isRequired,
  date: PropTypes.string,
  createdAt: PropTypes.string,
  amount: PropTypes.number,
  currency: PropTypes.string
};

export default PaymentMessage;
