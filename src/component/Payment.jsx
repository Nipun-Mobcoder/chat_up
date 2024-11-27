/* eslint-disable react/prop-types */
import { gql, useMutation } from "@apollo/client";
import { CircularProgress } from "@mui/material";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Create_Order = gql`
  mutation VerifyPayment($amount: String!, $currency: String!, $to: String!) {
    createOrder(amount: $amount, currency: $currency, to: $to) {
        amount
        id
        currency
        status
    }
}
`;

const VERIFY_PAYMENT = gql`
    mutation VerifyPayment($razorpayOrderId: String!, $razorpayPaymentId: String!, $razorpaySignature: String!, $to: String!, $amount: String!, $currency: String!) {
        verifyPayment(razorpayOrderId: $razorpayOrderId, razorpayPaymentId: $razorpayPaymentId, razorpaySignature: $razorpaySignature, to: $to, amount: $amount, currency: $currency)
    }
`;

export default function PaymentButton({ amount, currency, whom }) {
    amount = `${amount * 100}`;
    const navigate = useNavigate();
  
    useEffect(() => {
        if (!localStorage.getItem('token')) navigate('/');
    }, [navigate]);

    const token = localStorage.getItem('token');

    const [mutateFunction, { loading, data }] = useMutation(Create_Order, {
        context: { headers: { token, "x-apollo-operation-name": "1" } }
    });

    const [verifyFunction, {error}] = useMutation(VERIFY_PAYMENT, {
        context: { headers: { token, "x-apollo-operation-name": "1" } }
    });

    const name = localStorage.getItem('name');
    
    const RAZORPAY_KEY_ID = import.meta.env.REACT_APP_RAZORPAY_KEY_ID;
    
    useEffect(() => {
        async function payment() {
            await mutateFunction({
                variables: { amount, currency, to: whom },
                context: { headers: { token, "x-apollo-operation-name": "1"} }
            });
        }

        payment();
    }, [amount, currency, mutateFunction, token, whom])

    useEffect(()=> {
        const handlePayment = async () => {
            try {
                const order = data.createOrder;
                
                const options = {
                    key: RAZORPAY_KEY_ID,
                    amount: order.amount,
                    currency: order.currency,
                    name,
                    description: `Payment to ${whom}`,
                    order_id: order.id,
                    handler: async (response) => {
                        try {
                            await verifyFunction({
                                variables: { 
                                    razorpayOrderId: response.razorpay_order_id,
                                    razorpayPaymentId: response.razorpay_payment_id,
                                    razorpaySignature: response.razorpay_signature,
                                    to: whom,
                                    amount,
                                    currency
                                },
                                context: { headers: { token, "x-apollo-operation-name": "1"} }
                            });
                            alert("Payment successful!");
                            if(error) alert("Payment failed: " + error.message);
                        } 
                        catch (err) {
                            alert("Payment failed: " + err.message);
                        }
                    },
                    prefill: {
                        name,
                        email: "john@example.com",
                        contact: "9999999999",
                    },
                    notes: {
                        address: "Razorpay Corporate Office",
                    },
                    theme: {
                        color: "#3399cc",
                    },
                };
                if (!window.Razorpay) {
                    const script = document.createElement("script");
                    script.src = "https://checkout.razorpay.com/v1/checkout.js";
                    script.onload = () => {
                      const rzpay = new window.Razorpay(options);
                      rzpay.open();
                    };
                    script.onerror = () => alert("Failed to load Razorpay. Please try again.");
                    document.body.appendChild(script);
                  } else {
                    const rzpay = new window.Razorpay(options);
                    rzpay.open();
                  }
                } catch (err) {
                    alert("Error creating order: " + err.message);
                }
            };
            
            if(data)
                handlePayment();

    }, [RAZORPAY_KEY_ID, amount, currency, data, error, name, token, verifyFunction, whom])


    if(loading) return <CircularProgress sx={{ justifyContent: 'center', alignItems: 'center' }} />;

    return <div></div>;
}