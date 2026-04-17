import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyUser } from "../services/authService";

const Verify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // let [subOTP, setSubOTP] = useState("");
  let [verifyInfo, setVerifyInfo] = useState({
    subOTP: "",
    email: "",
  });

  useEffect(() => {
    const email = searchParams.get("email");
    const otp = searchParams.get("otp");

    // if these exists redirect to the setPassword page.
    // else
    // let the user manually enter the values.

    if (email) {
      setVerifyInfo({ ...verifyInfo, email: email });
    }

    // check if otp also exists then make direct call and rediret the user
    if (email && otp) {
      let autoRedirect = async () => {
        console.log(`GANDU`);
        let response = await verifyUser(email, otp);

        if (!response.err) {
          navigate("/setPassword");
        }
      };
      autoRedirect();
    }

    console.log(`email: ${email}, otp: ${otp}`);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setVerifyInfo({
      ...verifyInfo,
      subOTP: e.target.value,
    });
  }

  async function handleSubmit() {
    let response = await verifyUser(verifyInfo.email, verifyInfo.subOTP);

    if (!response.err) {
      navigate("/setPassword");
    }
  }

  return (
    <div>
      Verify OTP
      <br />
      <input
        type="number"
        name="otp"
        placeholder="Enter otp"
        value={verifyInfo.subOTP}
        onChange={handleChange}
      />
      <br />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};

export default Verify;
