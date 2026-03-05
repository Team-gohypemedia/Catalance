import Razorpay from "razorpay";
import { env } from "../config/env.js";

let razorpayClient = null;

export const hasRazorpayCredentials = () =>
  Boolean(env.RAZORPAY_API_KEY && env.RAZORPAY_API_SECRET);

export const getRazorpayClient = () => {
  if (!hasRazorpayCredentials()) {
    return null;
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: env.RAZORPAY_API_KEY,
      key_secret: env.RAZORPAY_API_SECRET,
    });
  }

  return razorpayClient;
};

