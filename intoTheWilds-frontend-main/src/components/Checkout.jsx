import React, { useState, useEffect } from "react";
import img1 from "../assets/majuli/majuli1.jpeg";
import razorPay from "../assets/razorpay.png";
import { BadgeCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { BASE_URL } from "../utils/baseurl";
import DatePicker from "react-datepicker";

const Checkout = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const bookingData = location.state;
  console.log(bookingData);
  const [razorpayChecked, setRazorpayChecked] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [selectedCheckInDate, setSelectedCheckInDate] = useState(
    new Date(bookingData?.checkIn)
  );
  const [selectedCheckOutDate, setSelectedCheckOutDate] = useState(
    new Date(bookingData?.checkOut)
  );
  const [adults, setAdults] = useState(bookingData?.adults || 1);
  const [children, setChildren] = useState(bookingData?.children || 0);

  const loadRazorpayScript = async () => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {};
    document.body.appendChild(script);
  };

  React.useEffect(() => {
    loadRazorpayScript();
  }, []);

  const checkInDate = new Date(bookingData?.checkIn);
  const checkOutDate = new Date(bookingData?.checkOut);
  const numberOfGuests = bookingData?.adults + bookingData?.children;
  const guestCapacity = bookingData?.property?.guestCapacity;
  const numberOfRooms = Math.ceil(numberOfGuests / guestCapacity);
  const dailyRate = bookingData?.property?.price;
  const totalDays = (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24);
  // Generate billing details for each day
  const billingDetails = [];
  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(checkInDate);
    currentDate.setDate(currentDate.getDate() + i);
    billingDetails.push({
      date: currentDate.toLocaleDateString(),
      amount: dailyRate * numberOfRooms,
    });
  }

  const totalAmount = billingDetails
    .reduce((total, bill) => total + bill.amount, 0)
    .toFixed(1);
  const tax = (0.18 * totalAmount).toFixed(1);
  const finalAmount = (parseFloat(totalAmount) + parseFloat(tax)).toFixed(1);
  const payAmount = (finalAmount * 0.2).toFixed(1);
  const formatDate = (date) => {
    const day = date.getDate();
    const suffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
        ? "rd"
        : "th";
    const options = { month: "long", year: "numeric" };
    const formattedDate = new Intl.DateTimeFormat("en-US", options).format(
      date
    );
    return `${day}${suffix} ${formattedDate.split(" ")[0]}, ${
      formattedDate.split(" ")[1]
    }`;
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Prepare the data for the API call
      if (!fullName || !email || !phone) {
        toast.error(
          "Please fill in all required fields (Full Name, Email, Phone)."
        );
        setLoading(false);
        return; // Exit the function if validation fails
      }
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phone)) {
        toast.error("Please enter a valid 10-digit phone number");
        setLoading(false);
        return;
      }
      if (checkOutDate <= checkInDate) {
        toast.error("Check-out date must be after check-in date");
        setLoading(false);
        return;
      }
      const submissionData = {
        checkInDate: bookingData.checkIn,
        checkOutDate: bookingData.checkOut,
        amount: payAmount,
        adults: bookingData.adults,
        children: bookingData.children,
        user: user ? user._id : null,
        userDetails: {
          fullName: fullName,
          email: email,
          phone: phone,
          specialRequirements: specialRequirements,
        },
        property: bookingData.property ? bookingData.property._id : null,
        tour: bookingData.tour ? "Tour" : null,
      };

      const response = await axios.post(`${BASE_URL}/booking/new-booking`, submissionData);
      // console.log(response.data);
      initPayment(response.data.order, response.data.booking._id);
    } catch (error) {
      // console.error(error);
      toast.error(error.response.data.message||"Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const initPayment = (data, bookingId) => {
    const options = {
      key: "rzp_test_S7O9aeETo3NXrl",
      amount: data.amount,
      currency: data.currency,
      order_id: data.razorpayOrderId,
      name: "Into The Wilds",
      description: "Payment for your booking",
      prefill: {
        name: fullName,
        email: email,
      },
      notes: {
        address: "Into The Wild Stays near Eco Park Dhanolti",
      },
      theme: {
        color: "#3399cc",
      },
      handler: async (response) => {
        try {
          const verifyUrl = `${BASE_URL}/booking/verify-payment`;
          const verifyData = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            bookingId: bookingId,
          };
          try {
            const res = await axios.post(verifyUrl, verifyData);
            if (res.status === 200) {
              toast.success("Payment Successful");
              window.location.reload();
            }
          } catch (err) {
            toast.error(err.response.data.message);
          }
        } catch (err) {
          // toast.error(err);
          // console.log(err);
        }
      },
    };
    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  const handleCheckInChange = (date) => {
    setSelectedCheckInDate(date);
    if (bookingData) {
      bookingData.checkIn = date;
    }
  };

  const handleCheckOutChange = (date) => {
    setSelectedCheckOutDate(date);
    if (bookingData) {
      bookingData.checkOut = date;
    }
  };

  const handleAdultsChange = (newAdults) => {
    setAdults(newAdults);
    if (bookingData) {
      bookingData.adults = newAdults;
    }
  };

  const handleChildrenChange = (newChildren) => {
    setChildren(newChildren);
    if (bookingData) {
      bookingData.children = newChildren;
    }
  };

  return (
    <div className="md:pb-6 text-black md:pt-36 md:mx-44 mx-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Review Your Booking</h1>
        <h2 className="text-xl">INFORMATION</h2>
      </div>
      <div className="flex justify-between flex-col md:flex-row gap-8">
        <div className="space-y-4">
          <div className="flex mt-4 gap-12 border-b-2 py-12 flex-col md:flex-row">
            <div>
              <img
                className="h-60 rounded-xl"
                src={bookingData.property.images[0]}
                alt=""
              />
            </div>
            <div className="space-y-3">
              <div>
                <h2>Home Stays</h2>
                <h1 className="text-3xl font-semibold">
                  {bookingData?.property?.name}
                </h1>
              </div>
              <h2>{bookingData?.property?.location}</h2>
              <div className="flex gap-8">
                <div>
                  <h3 className="text-lg font-semibold">CHECK IN</h3>
                  <div className="flex items-center">
                    {/* <h1 className="font-bold">{selectedCheckInDate.toLocaleDateString()}</h1> */}
                    <DatePicker
                      selected={selectedCheckInDate}
                      onChange={handleCheckInChange}
                      dateFormat="dd MMM yyyy"
                      className="border rounded p-2 w-48"
                      minDate={new Date()}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">CHECK OUT</h3>
                  <div className="flex items-center">
                    {/* <h1 className="font-bold">{selectedCheckOutDate.toLocaleDateString()}</h1> */}
                    <DatePicker
                      selected={selectedCheckOutDate}
                      onChange={handleCheckOutChange}
                      dateFormat="dd MMM yyyy"
                      className="border rounded p-2 w-48 ml-2"
                      minDate={selectedCheckInDate || new Date()}
                    />
                  </div>
                </div>
              </div>
              <h1 className="text-xl">
                {adults} Adult{adults > 1 ? "s" : ""}, {children} Child
                {children > 1 ? "ren" : ""}
              </h1>
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <label className="font-semibold">Adults</label>
                  <div className="flex items-center">
                    <button
                      onClick={() =>
                        handleAdultsChange(Math.max(1, adults - 1))
                      }
                      className="border-2 px-2 hover:bg-gray-200 duration-300"
                    >
                      -
                    </button>
                    <span className="mx-2">{adults}</span>
                    <button
                      className="border-2 px-2 hover:bg-gray-200 duration-300"
                      onClick={() => handleAdultsChange(adults + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="font-semibold">Children</label>
                  <div className="flex items-center">
                    <button
                      onClick={() =>
                        handleChildrenChange(Math.max(0, children - 1))
                      }
                      className="border-2 px-2 hover:bg-gray-200 duration-300"
                    >
                      -
                    </button>
                    <span className="mx-2">{children}</span>
                    <button
                      className="border-2 px-2 hover:bg-gray-200 duration-300"
                      onClick={() => handleChildrenChange(children + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              {/* Display guest capacity and number of rooms booked */}
              <h2 className="text-lg">
                Guest Capacity/
                {bookingData?.property?.cottage ? "Cottage" : "Room"}:{" "}
                {guestCapacity}
              </h2>
              <h2 className="text-lg">
                Number of Rooms Booked: {numberOfRooms}
              </h2>
            </div>
          </div>
          <div className="px-10 py-8 shadow-xl rounded-lg space-y-3">
            <h1 className="text-2xl">Guest Details</h1>
            <div>
              <form
                action=""
                method="post"
                className="grid md:grid-cols-2 grid-cols-1 gap-4"
              >
                <div className="flex flex-col gap-1">
                  <label className="font-semibold" htmlFor="fullName">
                    Full Name*
                  </label>
                  <input
                    className="border-2 px-2 py-1"
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold" htmlFor="phone">
                    Mobile Number*
                  </label>
                  <input
                    className="border-2 px-2 py-1"
                    type="tel"
                    placeholder="Enter Mobile Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold" htmlFor="email">
                    Email Address*
                  </label>
                  <input
                    className="border-2 px-2 py-1"
                    type="email"
                    placeholder="Enter Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    className="font-semibold"
                    htmlFor="specialRequirements"
                  >
                    Special Requirements
                  </label>
                  <textarea
                    rows={1}
                    className="border-2 px-2 py-1"
                    placeholder="Special Requirements"
                    value={specialRequirements}
                    onChange={(e) => setSpecialRequirements(e.target.value)}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
        <div>
          <div className="p-5 shadow-lg rounded-lg space-y-6">
            <h1 className="text-2xl py-2 border-b-2 font-semibold">
              Your Reservation
            </h1>
            {billingDetails.map((bill, index) => (
              <div
                key={index}
                className="flex justify-between items-center gap-16"
              >
                <h1>{formatDate(new Date(bill.date))}</h1>
                <p>Rs. {bill.amount}</p>
              </div>
            ))}
            <div className="flex justify-between font-semibold items-center gap-16">
              <h1>Subtotal</h1>
              <p>Rs. {totalAmount}</p>
            </div>
            <div className="flex justify-between items-center gap-16">
              <h1>Tax (18%)</h1>
              <p>Rs. {tax}</p>
            </div>
            <div className="flex justify-between font-semibold items-center gap-16 border-t-2">
              <h1>Total</h1>
              <p>Rs. {finalAmount}</p>
            </div>
            <div className="flex justify-between font-semibold items-center gap-16 border-t-2">
              <h1>Pay Now (20%)</h1>
              <p>Rs. {payAmount}</p>
            </div>

            <div className="flex items-center gap-3 border-2 px-3 py-2">
              <input
                className="h-5 w-5  border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer rounded-full"
                type="checkbox"
                checked={razorpayChecked}
                onChange={() => setRazorpayChecked(!razorpayChecked)}
              />
              <img className="w-28" src={razorPay} alt="" />
            </div>
            <div>
              <button
                className={`px-4 py-2 rounded-lg shadow-lg font-semibold text-white bg-cyan-600 hover:bg-cyan-800 ${
                  loading || !razorpayChecked
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={handlePayment}
                disabled={loading || !razorpayChecked}
              >
                {loading ? "Processing..." : "Pay and Confirm Reservation"}
              </button>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Why SignUp or Login</h1>
              <div className="flex items-center gap-2">
                <BadgeCheck size={18} />
                <p>Get access to Secret Deals</p>
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck size={18} />
                <p>Manage your bookings from one place</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
