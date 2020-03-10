import React from "react";

import StripeCheckout from 'react-stripe-checkout'
// import { Notification, Message } from "element-react";

import { API } from 'aws-amplify'

const stripeConfig = {
  currency: "USD",
  publishableAPIKey: "pk_test_plk8pDklHmEKKJrBWG7ZFSHk00fO6JDdxh"
}

const PayButton = ({product, user}) => {

  const handleCharge = async token => {
    try {
      const response = await API.post('purchase', '/purchase', {
        body: {
          token,
          charge: {
            currency: stripeConfig.currency,
            amount: product.price,
            description: product.description 
          }
        }
      })
    console.log("LAMBDARESPONSE!!!!!!", response)
    } catch(err) {
       console.error(err)
    }
  }

  return (
    <StripeCheckout
      token={handleCharge}
      email={user.attributes.email}
      name={product.description}
      amount={product.price} 
      currency={stripeConfig.currency} 
      stripeKey={stripeConfig.publishableAPIKey}
      billingAddress={product.shipped}
      shippingAddress={product.shipped}
      locale="auto"
      allowRememberMe={false}
    />  
  );
};

export default PayButton;
