import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const Forget = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const email = searchParams.get("email");
    const otp = searchParams.get("otp");

    console.log(`email: ${email} & otp: ${otp}`);

    // if these does not exists we need to navigate to the /login page.
    // if exits we need to redirect to the password setup page + jwt token of 15 mins
  }, []);

  return <div>Forget Password</div>;
};

export default Forget;
