import { gql, useMutation } from "@apollo/client";
import { CircularProgress } from "@mui/material";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from 'prop-types';

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
    mutation VerifyPayment($razorpayOrderId: String!, $razorpayPaymentId: String!, $razorpaySignature: String!, $to: String!) {
        verifyPayment(razorpayOrderId: $razorpayOrderId, razorpayPaymentId: $razorpayPaymentId, razorpaySignature: $razorpaySignature, to: $to)
    }
`;

const PAYMENT_FAIL = gql`
    mutation Mutation($paymentOrderId: String!) {
        paymentFailure(paymentOrderId: $paymentOrderId)
    }
`;

export default function PaymentButton({ amount, currency, whom, setFormSent }) {
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

    const [paymentFailFunction, {error: err}] = useMutation(PAYMENT_FAIL, {
        context: { headers: { token, "x-apollo-operation-name": "1" } }
    });

    const name = localStorage.getItem('name');
    const email = localStorage.getItem('email');
    const phoneNumber = localStorage.getItem('phoneNumber');
    
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
                                    to: whom
                                },
                                context: { headers: { token, "x-apollo-operation-name": "1"} }
                            });
                            alert("Payment successful!");
                            setFormSent(false);
                            if(error) {
                                setFormSent(false);
                                alert("Payment failed: " + error.message);
                            }
                        } 
                        catch (err) {
                            await paymentFailFunction({
                                variables: { paymentOrderId: order.id },
                                context: { headers: { token, "x-apollo-operation-name": "1"} }
                            });
                            alert("Payment failed: " + err.message);
                        }
                    },
                    prefill: {
                        name,
                        email,
                        contact: phoneNumber,
                    },
                    notes: {
                        address: "Razorpay Corporate Office",
                    },
                    theme: {
                        color: "#3399cc",
                    },
                    modal: {
                        ondismiss: async () => {
                            await paymentFailFunction({
                                variables: { paymentOrderId: order.id },
                                context: { headers: { token, "x-apollo-operation-name": "1"} }
                            });
                            setFormSent(false);
                        },
                        escape: false,
                        backdropclose: false,
                    }
                };
                if (!window.Razorpay) {
                    const script = document.createElement("script");
                    script.src = "https://checkout.razorpay.com/v1/checkout.js";
                    script.onload = () => {
                      const rzpay = new window.Razorpay(options);
                      rzpay.open();
                    };
                    script.onerror = async () => {
                        await paymentFailFunction({
                            variables: { paymentOrderId: order.id },
                            context: { headers: { token, "x-apollo-operation-name": "1"} }
                        });
                        alert("Failed to load Razorpay. Please try again.");
                    }
                    document.body.appendChild(script);
                  } else {
                    const rzpay = new window.Razorpay(options);
                    rzpay.open();
                  }
                  setFormSent(false);
                } catch (err) {
                    setFormSent(false);
                    alert("Error creating order: " + err.message);
                }
            };
            
            if(data)
                handlePayment();

    }, [RAZORPAY_KEY_ID, amount, currency, data, email, error, mutateFunction, name, paymentFailFunction, phoneNumber, setFormSent, token, verifyFunction, whom])

    if(err || error) {
        setFormSent(false);
        alert("Payment failed: " + ( error.message || err.message ));
    }

    if(loading) return <CircularProgress sx={{ justifyContent: 'center', alignItems: 'center' }} />;

    return <div></div>;
}


PaymentButton.propTypes = {
    amount: PropTypes.string.isRequired, 
    currency: PropTypes.string.isRequired, 
    whom: PropTypes.string.isRequired,
    setFormSent: PropTypes.func.isRequired
};